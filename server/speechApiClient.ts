import FormData from 'form-data';
import fetch from 'node-fetch';

const SPEECH_API_URL = process.env.SPEECH_API_URL || 'http://localhost:8000';

export interface SpeechModel {
  id: string;
  language_code: string;
  language_name: string;
  model_name: string;
  model_size: string;
  file_size_mb: number;
  is_downloaded: boolean;
  is_active: boolean;
  accuracy?: number;
  created_at: string;
}

export interface TranscriptionSegment {
  text: string;
  confidence: number;
  start_time: number;
  end_time: number;
  speaker_id?: string;
}

export interface TranscriptionResult {
  segments: TranscriptionSegment[];
  language: string;
  duration: number;
  processing_time: number;
}

export class SpeechApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = SPEECH_API_URL) {
    this.baseUrl = baseUrl;
  }

  async getAvailableModels(): Promise<SpeechModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch available models:', error);
      throw error;
    }
  }

  async getDownloadedModels(): Promise<SpeechModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models/downloaded`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch downloaded models:', error);
      throw error;
    }
  }

  async downloadModel(modelId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/models/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model_id: modelId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to download model:', error);
      throw error;
    }
  }

  async transcribeFile(
    fileBuffer: Buffer,
    filename: string,
    language: string = 'en-US',
    enableSpeakerDiarization: boolean = false
  ): Promise<TranscriptionResult> {
    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, filename);
      formData.append('language', language);
      formData.append('enable_speaker_diarization', enableSpeakerDiarization.toString());

      const response = await fetch(`${this.baseUrl}/transcribe/file`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to transcribe file:', error);
      throw error;
    }
  }

  async getModelStatus(modelId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/models/${modelId}/status`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get model status:', error);
      throw error;
    }
  }

  async deleteModel(modelId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/models/${modelId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to delete model:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Speech API health check failed:', error);
      throw error;
    }
  }
}

export const speechApiClient = new SpeechApiClient();