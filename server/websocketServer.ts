import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { speechService } from './speechService';
import fs from 'fs';
import path from 'path';

interface AudioSession {
  ws: WebSocket;
  userId: string;
  sessionId: string;
  language: string;
  audioBuffer: Buffer[];
  isRecording: boolean;
}

export class AudioWebSocketServer {
  private wss: WebSocketServer;
  private sessions: Map<string, AudioSession>;

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/audio'
    });
    this.sessions = new Map();
    this.setupWebSocketHandlers();
  }

  private setupWebSocketHandlers() {
    this.wss.on('connection', (ws: WebSocket, request) => {
      console.log('New WebSocket connection established');

      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      ws.on('close', () => {
        this.cleanupSession(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.cleanupSession(ws);
      });
    });
  }

  private async handleMessage(ws: WebSocket, message: any) {
    switch (message.type) {
      case 'start_recording':
        await this.startRecording(ws, message);
        break;
      
      case 'audio_chunk':
        await this.handleAudioChunk(ws, message);
        break;
      
      case 'stop_recording':
        await this.stopRecording(ws, message);
        break;
      
      case 'transcribe_file':
        await this.transcribeFile(ws, message);
        break;
      
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
    }
  }

  private async startRecording(ws: WebSocket, message: any) {
    const sessionId = this.generateSessionId();
    const session: AudioSession = {
      ws,
      userId: message.userId,
      sessionId,
      language: message.language || 'en-us',
      audioBuffer: [],
      isRecording: true
    };

    this.sessions.set(sessionId, session);

    ws.send(JSON.stringify({
      type: 'recording_started',
      sessionId,
      message: 'Recording started'
    }));
  }

  private async handleAudioChunk(ws: WebSocket, message: any) {
    const session = this.findSessionByWebSocket(ws);
    if (!session || !session.isRecording) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'No active recording session'
      }));
      return;
    }

    // Convert base64 audio data to buffer
    const audioData = Buffer.from(message.audioData, 'base64');
    session.audioBuffer.push(audioData);

    // For real-time transcription, process smaller chunks
    if (session.audioBuffer.length >= 10) { // Process every 10 chunks
      await this.processAudioChunks(session);
    }
  }

  private async stopRecording(ws: WebSocket, message: any) {
    const session = this.findSessionByWebSocket(ws);
    if (!session) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'No recording session found'
      }));
      return;
    }

    session.isRecording = false;

    // Process remaining audio data
    if (session.audioBuffer.length > 0) {
      await this.processAudioChunks(session, true);
    }

    ws.send(JSON.stringify({
      type: 'recording_stopped',
      sessionId: session.sessionId,
      message: 'Recording completed'
    }));

    this.sessions.delete(session.sessionId);
  }

  private async processAudioChunks(session: AudioSession, isFinal: boolean = false) {
    try {
      // Combine audio buffers
      const combinedBuffer = Buffer.concat(session.audioBuffer);
      
      // Save temporary audio file
      const tempFilePath = path.join('/tmp', `audio_${session.sessionId}_${Date.now()}.wav`);
      fs.writeFileSync(tempFilePath, combinedBuffer);

      // Transcribe audio
      const results = await speechService.transcribeAudioFile(tempFilePath, {
        language: session.language,
        enableSpeakerDiarization: true
      });

      // Send transcription results
      session.ws.send(JSON.stringify({
        type: 'transcription_result',
        sessionId: session.sessionId,
        results,
        isFinal
      }));

      // Clear processed audio buffer
      session.audioBuffer = [];

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);

    } catch (error) {
      console.error('Audio processing error:', error);
      session.ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process audio'
      }));
    }
  }

  private async transcribeFile(ws: WebSocket, message: any) {
    try {
      const { filePath, language, projectId } = message;
      
      const results = await speechService.transcribeAudioFile(filePath, {
        language: language || 'en-us',
        enableSpeakerDiarization: true
      });

      ws.send(JSON.stringify({
        type: 'file_transcription_result',
        projectId,
        results
      }));

    } catch (error) {
      console.error('File transcription error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to transcribe file'
      }));
    }
  }

  private findSessionByWebSocket(ws: WebSocket): AudioSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.ws === ws) {
        return session;
      }
    }
    return undefined;
  }

  private cleanupSession(ws: WebSocket) {
    const session = this.findSessionByWebSocket(ws);
    if (session) {
      this.sessions.delete(session.sessionId);
      console.log(`Cleaned up session: ${session.sessionId}`);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getActiveSessionCount(): number {
    return this.sessions.size;
  }
}