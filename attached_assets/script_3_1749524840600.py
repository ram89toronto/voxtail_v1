# Create the speech recognizer code

speech_recognizer_code = '''
import json
import wave
import io
from pathlib import Path
from typing import Dict, Optional, Union, List
import numpy as np

try:
    import vosk
    VOSK_AVAILABLE = True
except ImportError:
    VOSK_AVAILABLE = False

class VoskRecognizer:
    """
    Vosk speech recognition wrapper with enhanced functionality
    for Streamlit applications.
    """
    
    def __init__(self, model_path: Union[str, Path], sample_rate: int = 16000):
        """
        Initialize Vosk recognizer
        
        Args:
            model_path: Path to the Vosk model directory
            sample_rate: Audio sample rate (default: 16000 Hz)
        """
        if not VOSK_AVAILABLE:
            raise ImportError(
                "Vosk is not installed. Install it with: pip install vosk"
            )
        
        self.model_path = Path(model_path)
        self.sample_rate = sample_rate
        
        # Initialize Vosk model and recognizer
        self._load_model()
    
    def _load_model(self):
        """Load the Vosk model"""
        if not self.model_path.exists():
            raise FileNotFoundError(f"Model not found at: {self.model_path}")
        
        try:
            # Set log level to reduce Vosk output
            vosk.SetLogLevel(-1)
            
            # Load model
            self.model = vosk.Model(str(self.model_path))
            
            # Create recognizer
            self.rec = vosk.KaldiRecognizer(self.model, self.sample_rate)
            
            # Enable partial results for real-time recognition
            self.rec.SetWords(True)
            self.rec.SetPartialWords(True)
            
        except Exception as e:
            raise RuntimeError(f"Failed to load Vosk model: {str(e)}")
    
    def recognize(self, audio_data: bytes, return_alternatives: bool = False) -> Dict:
        """
        Recognize speech from audio data
        
        Args:
            audio_data: Raw audio bytes (WAV format, 16-bit, mono)
            return_alternatives: Whether to return alternative transcriptions
            
        Returns:
            Dictionary with recognition results
        """
        try:
            # Process audio in chunks
            chunk_size = 4000
            results = []
            
            # Reset recognizer for new audio
            self.rec = vosk.KaldiRecognizer(self.model, self.sample_rate)
            self.rec.SetWords(True)
            self.rec.SetPartialWords(True)
            
            # Process audio in chunks
            for i in range(0, len(audio_data), chunk_size):
                chunk = audio_data[i:i + chunk_size]
                
                # Feed chunk to recognizer
                if self.rec.AcceptWaveform(chunk):
                    result = json.loads(self.rec.Result())
                    if result.get('text'):
                        results.append(result)
            
            # Get final result
            final_result = json.loads(self.rec.FinalResult())
            if final_result.get('text'):
                results.append(final_result)
            
            # Combine results
            if results:
                combined_text = ' '.join([r['text'] for r in results if r.get('text')])
                
                # Calculate confidence (average of word confidences)
                all_words = []
                for result in results:
                    if 'result' in result:
                        all_words.extend(result['result'])
                
                confidence = 0.0
                if all_words:
                    confidence = sum(word.get('conf', 0.0) for word in all_words) / len(all_words)
                
                return {
                    'text': combined_text.strip(),
                    'confidence': confidence,
                    'words': all_words,
                    'alternatives': results if return_alternatives else None
                }
            else:
                return {'text': '', 'confidence': 0.0, 'words': [], 'alternatives': None}
                
        except Exception as e:
            raise RuntimeError(f"Recognition failed: {str(e)}")
    
    def recognize_stream(self, audio_stream, callback=None):
        """
        Recognize speech from audio stream in real-time
        
        Args:
            audio_stream: Audio stream generator
            callback: Callback function for partial results
        """
        try:
            # Reset recognizer
            self.rec = vosk.KaldiRecognizer(self.model, self.sample_rate)
            self.rec.SetWords(True)
            self.rec.SetPartialWords(True)
            
            full_transcript = []
            
            for chunk in audio_stream:
                if self.rec.AcceptWaveform(chunk):
                    result = json.loads(self.rec.Result())
                    if result.get('text'):
                        full_transcript.append(result['text'])
                        if callback:
                            callback(result, is_final=True)
                else:
                    # Partial result
                    partial = json.loads(self.rec.PartialResult())
                    if callback and partial.get('partial'):
                        callback(partial, is_final=False)
            
            # Final result
            final_result = json.loads(self.rec.FinalResult())
            if final_result.get('text'):
                full_transcript.append(final_result['text'])
                if callback:
                    callback(final_result, is_final=True)
            
            return ' '.join(full_transcript)
            
        except Exception as e:
            raise RuntimeError(f"Stream recognition failed: {str(e)}")
    
    def set_vocabulary(self, words: List[str]) -> bool:
        """
        Set custom vocabulary for recognition (if supported by model)
        
        Args:
            words: List of words to add to vocabulary
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Create vocabulary JSON
            vocab_json = json.dumps(words, ensure_ascii=False)
            
            # Set vocabulary (only works with some models)
            success = self.rec.SetGrammar(vocab_json)
            return success
            
        except Exception:
            return False
    
    def get_model_info(self) -> Dict:
        """Get information about the loaded model"""
        return {
            'model_path': str(self.model_path),
            'sample_rate': self.sample_rate,
            'model_exists': self.model_path.exists(),
            'vosk_version': getattr(vosk, '__version__', 'unknown') if VOSK_AVAILABLE else None
        }

class AudioValidator:
    """
    Utility class for validating and preprocessing audio for Vosk
    """
    
    @staticmethod
    def validate_audio_format(audio_data: bytes) -> bool:
        """
        Validate that audio is in correct format for Vosk
        
        Args:
            audio_data: Raw audio bytes
            
        Returns:
            bool: True if format is valid
        """
        try:
            # Try to open as WAV
            with io.BytesIO(audio_data) as audio_io:
                with wave.open(audio_io, 'rb') as wav_file:
                    # Check format
                    channels = wav_file.getnchannels()
                    sample_width = wav_file.getsampwidth()
                    framerate = wav_file.getframerate()
                    
                    # Vosk requirements: mono, 16-bit, 16kHz (or other supported rates)
                    return (
                        channels == 1 and  # Mono
                        sample_width == 2 and  # 16-bit
                        framerate in [8000, 16000, 22050, 44100, 48000]  # Supported rates
                    )
        except Exception:
            return False
    
    @staticmethod
    def convert_to_vosk_format(audio_data: bytes, target_rate: int = 16000) -> bytes:
        """
        Convert audio to Vosk-compatible format
        
        Args:
            audio_data: Input audio data
            target_rate: Target sample rate
            
        Returns:
            bytes: Converted audio data
        """
        try:
            import soundfile as sf
            import librosa
            
            # Load audio using soundfile
            with io.BytesIO(audio_data) as audio_io:
                audio, sample_rate = sf.read(audio_io)
            
            # Convert to mono if stereo
            if len(audio.shape) > 1:
                audio = np.mean(audio, axis=1)
            
            # Resample if necessary
            if sample_rate != target_rate:
                audio = librosa.resample(audio, orig_sr=sample_rate, target_sr=target_rate)
            
            # Convert to 16-bit PCM
            audio_int16 = (audio * 32767).astype(np.int16)
            
            # Convert to WAV bytes
            output_io = io.BytesIO()
            sf.write(output_io, audio_int16, target_rate, format='WAV', subtype='PCM_16')
            output_io.seek(0)
            
            return output_io.read()
            
        except ImportError:
            raise ImportError(
                "Audio conversion requires soundfile and librosa. "
                "Install with: pip install soundfile librosa"
            )
        except Exception as e:
            raise RuntimeError(f"Audio conversion failed: {str(e)}")

# Example usage
if __name__ == "__main__":
    # Example of how to use the VoskRecognizer
    model_path = "models/english_us/small"
    
    if Path(model_path).exists():
        recognizer = VoskRecognizer(model_path)
        
        # Example with dummy audio data
        print("Recognizer initialized successfully")
        print(f"Model info: {recognizer.get_model_info()}")
    else:
        print(f"Model not found at: {model_path}")
'''

# Save to file
with open("speech_recognizer.py", "w") as f:
    f.write(speech_recognizer_code)

print("✅ Created speech recognizer code")
print("File: speech_recognizer.py")
print(f"Lines of code: {len(speech_recognizer_code.splitlines())}")