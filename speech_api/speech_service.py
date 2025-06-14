import os
import json
import time
import zipfile
import tempfile
import requests
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import vosk
import soundfile as sf
import librosa
import numpy as np
from sqlalchemy.orm import Session
from database import VoskModel, get_db
from models import TranscriptionSegment, TranscriptionResult
from tqdm import tqdm

class VoskSpeechService:
    def __init__(self):
        self.models_dir = Path("../vosk_models")
        self.models_dir.mkdir(exist_ok=True)
        self.loaded_models: Dict[str, vosk.Model] = {}
        
    def get_available_models(self, db: Session) -> List[VoskModel]:
        """Get all available models from database"""
        return db.query(VoskModel).filter(VoskModel.is_active == True).all()
    
    def get_downloaded_models(self, db: Session) -> List[VoskModel]:
        """Get only downloaded models"""
        return db.query(VoskModel).filter(
            VoskModel.is_downloaded == True,
            VoskModel.is_active == True
        ).all()
    
    async def download_model(self, model_id: str, db: Session) -> Tuple[bool, str]:
        """Download a specific model"""
        model = db.query(VoskModel).filter(VoskModel.id == model_id).first()
        if not model:
            return False, "Model not found"
        
        if model.is_downloaded:
            return True, "Model already downloaded"
        
        try:
            model_path = self.models_dir / model.model_name
            
            # Download model
            response = requests.get(model.download_url, stream=True)
            response.raise_for_status()
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as tmp_file:
                total_size = int(response.headers.get('content-length', 0))
                
                with tqdm(total=total_size, unit='B', unit_scale=True, desc=f"Downloading {model.language_name}") as pbar:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            tmp_file.write(chunk)
                            pbar.update(len(chunk))
                
                tmp_file_path = tmp_file.name
            
            # Extract model
            with zipfile.ZipFile(tmp_file_path, 'r') as zip_ref:
                zip_ref.extractall(self.models_dir)
            
            # Update database
            model.is_downloaded = True
            model.model_path = str(model_path)
            db.commit()
            
            # Clean up
            os.unlink(tmp_file_path)
            
            return True, f"Model {model.language_name} downloaded successfully"
            
        except Exception as e:
            return False, f"Download failed: {str(e)}"
    
    def load_model(self, model_id: str, db: Session) -> Optional[vosk.Model]:
        """Load a model into memory"""
        if model_id in self.loaded_models:
            return self.loaded_models[model_id]
        
        model = db.query(VoskModel).filter(
            VoskModel.id == model_id,
            VoskModel.is_downloaded == True
        ).first()
        
        if not model or not model.model_path:
            return None
        
        try:
            vosk_model = vosk.Model(model.model_path)
            self.loaded_models[model_id] = vosk_model
            return vosk_model
        except Exception as e:
            print(f"Failed to load model {model_id}: {e}")
            return None
    
    def preprocess_audio(self, file_path: str, target_sr: int = 16000) -> Tuple[np.ndarray, int]:
        """Preprocess audio file for VOSK"""
        try:
            # Load audio file
            audio, sr = librosa.load(file_path, sr=target_sr, mono=True)
            
            # Convert to 16-bit PCM
            audio = (audio * 32767).astype(np.int16)
            
            return audio, target_sr
        except Exception as e:
            raise Exception(f"Audio preprocessing failed: {str(e)}")
    
    def transcribe_audio(
        self, 
        file_path: str, 
        model_id: str, 
        db: Session,
        enable_speaker_diarization: bool = False
    ) -> TranscriptionResult:
        """Transcribe audio file using VOSK"""
        start_time = time.time()
        
        # Load model
        model = self.load_model(model_id, db)
        if not model:
            raise Exception(f"Model {model_id} not available or not downloaded")
        
        # Preprocess audio
        audio_data, sample_rate = self.preprocess_audio(file_path)
        
        # Create recognizer
        rec = vosk.KaldiRecognizer(model, sample_rate)
        rec.SetWords(True)  # Enable word-level timestamps
        
        # Process audio in chunks
        segments = []
        chunk_size = 4000  # Process in 4000 sample chunks
        
        for i in range(0, len(audio_data), chunk_size):
            chunk = audio_data[i:i + chunk_size]
            
            if rec.AcceptWaveform(chunk.tobytes()):
                result = json.loads(rec.Result())
                if result.get('text'):
                    segments.append(self._parse_vosk_result(result, i, sample_rate))
        
        # Get final result
        final_result = json.loads(rec.FinalResult())
        if final_result.get('text'):
            segments.append(self._parse_vosk_result(final_result, len(audio_data), sample_rate))
        
        # Calculate processing time and duration
        processing_time = time.time() - start_time
        duration = len(audio_data) / sample_rate
        
        # Get model info for language
        model_info = db.query(VoskModel).filter(VoskModel.id == model_id).first()
        language = model_info.language_code if model_info else "unknown"
        
        return TranscriptionResult(
            segments=segments,
            language=language,
            duration=duration,
            processing_time=processing_time
        )
    
    def _parse_vosk_result(self, result: Dict, offset_samples: int, sample_rate: int) -> TranscriptionSegment:
        """Parse VOSK result into TranscriptionSegment"""
        text = result.get('text', '')
        confidence = result.get('confidence', 0.0)
        
        # Calculate timing
        start_time = offset_samples / sample_rate
        
        # If word-level results are available, use them for better timing
        if 'result' in result and result['result']:
            words = result['result']
            start_time = words[0].get('start', start_time)
            end_time = words[-1].get('end', start_time + len(text.split()) * 0.5)
            
            # Average word confidence
            word_confidences = [w.get('conf', 0.0) for w in words if 'conf' in w]
            if word_confidences:
                confidence = sum(word_confidences) / len(word_confidences)
        else:
            # Estimate end time based on text length
            estimated_duration = len(text.split()) * 0.5  # ~2 words per second
            end_time = start_time + estimated_duration
        
        return TranscriptionSegment(
            text=text,
            confidence=confidence,
            start_time=start_time,
            end_time=end_time,
            speaker_id=None  # Speaker diarization would be implemented separately
        )
    
    def transcribe_realtime_chunk(
        self, 
        audio_chunk: bytes, 
        model_id: str, 
        db: Session,
        recognizer: Optional[vosk.KaldiRecognizer] = None
    ) -> Optional[TranscriptionSegment]:
        """Transcribe real-time audio chunk"""
        if not recognizer:
            model = self.load_model(model_id, db)
            if not model:
                return None
            recognizer = vosk.KaldiRecognizer(model, 16000)
            recognizer.SetWords(True)
        
        if recognizer.AcceptWaveform(audio_chunk):
            result = json.loads(recognizer.Result())
            if result.get('text'):
                return self._parse_vosk_result(result, 0, 16000)
        
        return None

# Global service instance
speech_service = VoskSpeechService()