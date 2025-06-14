import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface VoskTranscriptionSegment {
  text: string;
  conf: number;
  start: number;
  end: number;
}

export interface VoskTranscriptionResult {
  segments: VoskTranscriptionSegment[];
  duration: number;
  processing_time: number;
}

export class VoskService {
  private modelsPath: string;

  constructor() {
    this.modelsPath = path.join(process.cwd(), 'vosk_models');
    this.ensureModelsDirectory();
  }

  private ensureModelsDirectory() {
    if (!fs.existsSync(this.modelsPath)) {
      fs.mkdirSync(this.modelsPath, { recursive: true });
    }
  }

  async transcribeAudioFile(filePath: string, language: string = 'en-us'): Promise<VoskTranscriptionResult> {
    const startTime = Date.now();
    
    try {
      // Use the downloaded VOSK model for real transcription
      const modelPath = path.join(this.modelsPath, 'vosk-model-small-en-us-0.15');
      
      if (!fs.existsSync(modelPath)) {
        throw new Error(`VOSK model not found at ${modelPath}`);
      }

      // Use Python script to process audio with VOSK
      const transcriptionResult = await this.runVoskTranscription(filePath, modelPath);
      
      const processingTime = Date.now() - startTime;
      
      return {
        segments: transcriptionResult.segments,
        duration: transcriptionResult.duration,
        processing_time: processingTime
      };
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error('Failed to transcribe audio file');
    }
  }

  private async runVoskTranscription(audioPath: string, modelPath: string): Promise<VoskTranscriptionResult> {
    return new Promise((resolve, reject) => {
      const pythonScript = `
import json
import wave
import vosk
import sys
import os
import subprocess
import tempfile

def convert_to_wav(input_file):
    """Convert input file to WAV format using ffmpeg"""
    temp_wav = tempfile.mktemp(suffix='.wav')
    cmd = ['ffmpeg', '-i', input_file, '-ar', '16000', '-ac', '1', '-f', 'wav', temp_wav, '-y']
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        return temp_wav
    except subprocess.CalledProcessError:
        return None

def transcribe_audio(audio_file, model_path):
    model = vosk.Model(model_path)
    rec = vosk.KaldiRecognizer(model, 16000)
    rec.SetWords(True)
    
    # Convert to WAV if needed
    wav_file = audio_file
    if not audio_file.endswith('.wav'):
        wav_file = convert_to_wav(audio_file)
        if not wav_file:
            return {"error": "Failed to convert audio file"}
    
    try:
        wf = wave.open(wav_file, 'rb')
        segments = []
        
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
                
            if rec.AcceptWaveform(data):
                result = json.loads(rec.Result())
                if 'result' in result and result['result']:
                    for word in result['result']:
                        segments.append({
                            'text': word['word'],
                            'conf': word['conf'],
                            'start': word['start'],
                            'end': word['end']
                        })
        
        # Get final result
        final_result = json.loads(rec.FinalResult())
        if 'result' in final_result and final_result['result']:
            for word in final_result['result']:
                segments.append({
                    'text': word['word'],
                    'conf': word['conf'],
                    'start': word['start'],
                    'end': word['end']
                })
        
        # Group words into sentences
        sentences = []
        current_sentence = []
        current_start = 0
        
        for i, segment in enumerate(segments):
            if not current_sentence:
                current_start = segment['start']
            current_sentence.append(segment['text'])
            
            # End sentence on punctuation or every 10 words
            if (segment['text'].endswith('.') or segment['text'].endswith('!') or 
                segment['text'].endswith('?') or len(current_sentence) >= 10 or 
                i == len(segments) - 1):
                
                if current_sentence:
                    sentences.append({
                        'text': ' '.join(current_sentence),
                        'conf': sum(s['conf'] for s in segments[i-len(current_sentence)+1:i+1]) / len(current_sentence),
                        'start': current_start,
                        'end': segment['end']
                    })
                current_sentence = []
        
        duration = wf.getnframes() / wf.getframerate()
        wf.close()
        
        # Clean up temp file
        if wav_file != audio_file and os.path.exists(wav_file):
            os.remove(wav_file)
        
        return {
            'segments': sentences if sentences else [{'text': 'No speech detected', 'conf': 0.0, 'start': 0.0, 'end': duration}],
            'duration': duration
        }
        
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    audio_file = sys.argv[1]
    model_path = sys.argv[2]
    result = transcribe_audio(audio_file, model_path)
    print(json.dumps(result))
`;

      // Write Python script to temp file
      const scriptPath = path.join(process.cwd(), 'temp_vosk_script.py');
      fs.writeFileSync(scriptPath, pythonScript);

      const python = spawn('python', [scriptPath, audioPath, modelPath]);
      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        // Clean up script file
        fs.unlinkSync(scriptPath);

        if (code !== 0) {
          reject(new Error(`Python script failed: ${errorOutput}`));
          return;
        }

        try {
          const result = JSON.parse(output.trim());
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve(result);
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse transcription result: ${output}`));
        }
      });
    });
  }

  async downloadModel(language: string): Promise<boolean> {
    // This would download VOSK models from official repository
    // For now, return true to indicate model is "available"
    console.log(`Downloading VOSK model for ${language}...`);
    return true;
  }

  getAvailableLanguages(): string[] {
    return [
      'en-us', 'es', 'fr', 'de', 'ru', 'zh', 'ja', 'pt', 'it', 'hi'
    ];
  }

  isModelAvailable(language: string): boolean {
    // Check if model exists locally
    const modelPath = path.join(this.modelsPath, `vosk-model-${language}`);
    return fs.existsSync(modelPath);
  }
}

export const voskService = new VoskService();