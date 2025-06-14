import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

interface LanguageDetectionResult {
  language: string;
  confidence: number;
  detectedLanguages: Array<{
    language: string;
    confidence: number;
  }>;
}

export class LanguageDetectionService {
  private readonly supportedLanguages = [
    { code: 'en-us', name: 'English (US)', voskModel: 'en-us-small' },
    { code: 'es', name: 'Spanish', voskModel: 'es-small' },
    { code: 'fr', name: 'French', voskModel: 'fr-small' },
    { code: 'de', name: 'German', voskModel: 'de-small' },
    { code: 'it', name: 'Italian', voskModel: 'it-small' },
    { code: 'pt', name: 'Portuguese', voskModel: 'pt-small' },
    { code: 'ru', name: 'Russian', voskModel: 'ru-small' },
    { code: 'zh', name: 'Chinese', voskModel: 'cn-small' },
    { code: 'ja', name: 'Japanese', voskModel: 'ja-small' },
    { code: 'ko', name: 'Korean', voskModel: 'ko-small' },
    { code: 'ar', name: 'Arabic', voskModel: 'ar-small' },
    { code: 'hi', name: 'Hindi', voskModel: 'hi-small' },
    { code: 'tr', name: 'Turkish', voskModel: 'tr-small' },
    { code: 'nl', name: 'Dutch', voskModel: 'nl-small' },
    { code: 'pl', name: 'Polish', voskModel: 'pl-small' },
    { code: 'uk', name: 'Ukrainian', voskModel: 'uk-small' },
    { code: 'fa', name: 'Persian', voskModel: 'fa-small' },
    { code: 'ca', name: 'Catalan', voskModel: 'ca-small' },
    { code: 'eu', name: 'Basque', voskModel: 'eu-small' },
    { code: 'gl', name: 'Galician', voskModel: 'gl-small' }
  ];

  /**
   * Extract a 30-second sample from the audio/video file for language detection
   */
  private async extractAudioSample(filePath: string): Promise<string> {
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const samplePath = path.join(tempDir, `sample-${Date.now()}.wav`);
    
    return new Promise((resolve, reject) => {
      // Extract 30 seconds of audio starting from 10 seconds into the file
      // Convert to 16kHz mono WAV for better language detection
      const ffmpeg = spawn('ffmpeg', [
        '-i', filePath,
        '-ss', '10',        // Start at 10 seconds
        '-t', '30',         // Duration of 30 seconds
        '-ar', '16000',     // Sample rate 16kHz
        '-ac', '1',         // Mono channel
        '-f', 'wav',        // WAV format
        '-y',               // Overwrite output file
        samplePath
      ]);

      let stderr = '';
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(samplePath);
        } else {
          console.error('FFmpeg error:', stderr);
          reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Use audio analysis and language patterns to detect language
   */
  private async detectLanguageWithVosk(samplePath: string): Promise<LanguageDetectionResult> {
    try {
      // Run Python script for language detection
      const voskProcess = spawn('python3', [
        path.join(process.cwd(), 'scripts', 'detect_language.py'),
        samplePath
      ]);

      let stdout = '';
      let stderr = '';

      voskProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      voskProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      return new Promise((resolve) => {
        voskProcess.on('close', (code) => {
          if (code === 0 && stdout.trim()) {
            try {
              const result = JSON.parse(stdout);
              
              // Enhance the result with additional language candidates
              const enhancedResult = this.enhanceLanguageDetection(result);
              resolve(enhancedResult);
            } catch (parseError) {
              console.error('Failed to parse language detection result:', parseError);
              resolve(this.getFallbackResult());
            }
          } else {
            console.error('Language detection script error:', stderr);
            resolve(this.getFallbackResult());
          }
        });

        voskProcess.on('error', (error) => {
          console.error('Language detection process error:', error);
          resolve(this.getFallbackResult());
        });
      });
    } catch (error) {
      console.error('Language detection error:', error);
      return this.getFallbackResult();
    }
  }

  /**
   * Enhance language detection with additional logic and confidence scoring
   */
  private enhanceLanguageDetection(result: any): LanguageDetectionResult {
    const { language, confidence, detectedLanguages } = result;
    
    // Map detected language to supported VOSK models
    const mappedLanguage = this.mapToSupportedLanguage(language);
    
    // Generate alternative language suggestions based on common patterns
    const alternatives = this.generateLanguageAlternatives(mappedLanguage, confidence);
    
    return {
      language: mappedLanguage,
      confidence: Math.min(0.9, Math.max(0.3, confidence)), // Clamp confidence between 0.3-0.9
      detectedLanguages: [
        { language: mappedLanguage, confidence },
        ...alternatives
      ].slice(0, 3) // Top 3 candidates
    };
  }

  /**
   * Map detected language to supported VOSK models
   */
  private mapToSupportedLanguage(detectedLang: string): string {
    const mapping: Record<string, string> = {
      'en': 'en-us',
      'english': 'en-us',
      'es': 'es',
      'spanish': 'es',
      'fr': 'fr',
      'french': 'fr',
      'de': 'de',
      'german': 'de',
      'it': 'it',
      'italian': 'it',
      'pt': 'pt',
      'portuguese': 'pt',
      'ru': 'ru',
      'russian': 'ru',
      'zh': 'cn',
      'chinese': 'cn',
      'ja': 'ja',
      'japanese': 'ja',
      'ko': 'ko',
      'korean': 'ko',
      'ar': 'ar',
      'arabic': 'ar',
      'hi': 'hi',
      'hindi': 'hi'
    };
    
    return mapping[detectedLang.toLowerCase()] || 'en-us';
  }

  /**
   * Generate alternative language suggestions
   */
  private generateLanguageAlternatives(primaryLang: string, confidence: number): Array<{language: string, confidence: number}> {
    const alternatives: Array<{language: string, confidence: number}> = [];
    
    // Common language families and geographic clusters
    const languageClusters: Record<string, string[]> = {
      'en-us': ['es', 'fr'],
      'es': ['en-us', 'pt', 'fr'],
      'fr': ['en-us', 'es', 'de'],
      'de': ['en-us', 'fr', 'nl'],
      'it': ['es', 'fr', 'en-us'],
      'pt': ['es', 'en-us', 'fr'],
      'ru': ['en-us', 'uk'],
      'zh': ['ja', 'ko', 'en-us'],
      'ja': ['zh', 'ko', 'en-us'],
      'ko': ['zh', 'ja', 'en-us']
    };
    
    const cluster = languageClusters[primaryLang] || ['en-us'];
    const altConfidence = Math.max(0.1, confidence * 0.4);
    
    cluster.forEach(lang => {
      if (lang !== primaryLang) {
        alternatives.push({ language: lang, confidence: altConfidence });
      }
    });
    
    return alternatives;
  }

  /**
   * Get fallback result when detection fails
   */
  private getFallbackResult(): LanguageDetectionResult {
    return {
      language: 'en-us',
      confidence: 0.5,
      detectedLanguages: [
        { language: 'en-us', confidence: 0.5 },
        { language: 'es', confidence: 0.2 },
        { language: 'fr', confidence: 0.1 }
      ]
    };
  }

  /**
   * Clean up temporary files
   */
  private cleanupTempFiles(filePaths: string[]) {
    filePaths.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error('Failed to cleanup temp file:', filePath, error);
      }
    });
  }

  /**
   * Detect language from audio/video file
   */
  async detectLanguage(filePath: string): Promise<LanguageDetectionResult> {
    let samplePath: string | null = null;
    
    try {
      console.log('Extracting audio sample for language detection...');
      samplePath = await this.extractAudioSample(filePath);
      
      console.log('Detecting language from audio sample...');
      const result = await this.detectLanguageWithVosk(samplePath);
      
      console.log('Language detection result:', result);
      return result;
      
    } catch (error) {
      console.error('Language detection failed:', error);
      // Return English as fallback
      return {
        language: 'en-us',
        confidence: 0.5,
        detectedLanguages: [{ language: 'en-us', confidence: 0.5 }]
      };
    } finally {
      // Cleanup temporary files
      if (samplePath) {
        this.cleanupTempFiles([samplePath]);
      }
    }
  }

  /**
   * Get VOSK model name for detected language
   */
  getVoskModelForLanguage(languageCode: string): string {
    const language = this.supportedLanguages.find(lang => 
      lang.code === languageCode || lang.code.startsWith(languageCode.split('-')[0])
    );
    
    return language ? language.voskModel : 'en-us-small';
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages() {
    return this.supportedLanguages;
  }
}

export const languageDetectionService = new LanguageDetectionService();