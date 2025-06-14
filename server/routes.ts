import type { Express } from "express";
import express, { static as expressStatic } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadFile, getPublicUrl } from "./supabase";
import { insertProjectSchema, insertTranscriptionSegmentSchema, insertUserSettingsSchema } from "@shared/schema";
import { voskService } from "./voskService";
import { languageDetectionService } from "./languageDetection";
import { speechApiClient } from "./speechApiClient";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/flac',
      'video/mp4', 'video/avi', 'video/mov', 'video/quicktime'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio and video files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  app.use('/uploads', expressStatic('uploads'));
  
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Subscription routes
  app.get('/api/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let subscription = await storage.getUserSubscription(userId);
      
      // Create default free subscription if none exists
      if (!subscription) {
        subscription = await storage.createSubscription({
          userId,
          plan: "free",
          status: "active"
        });
      }
      
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.post('/api/subscription/upgrade', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { plan } = req.body;
      
      if (!plan || !["free", "pro"].includes(plan)) {
        return res.status(400).json({ message: "Invalid plan" });
      }
      
      let subscription = await storage.getUserSubscription(userId);
      
      if (!subscription) {
        // Create new subscription
        subscription = await storage.createSubscription({
          userId,
          plan,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });
      } else {
        // Update existing subscription
        subscription = await storage.updateSubscription(subscription.id, {
          plan,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      }
      
      res.json({ success: true, subscription });
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      res.status(500).json({ message: "Failed to upgrade subscription" });
    }
  });

  // User settings routes
  app.get('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let settings = await storage.getUserSettings(userId);
      
      if (!settings) {
        settings = await storage.upsertUserSettings({
          userId,
          hasCompletedOnboarding: false
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      
      const settings = await storage.upsertUserSettings({
        userId,
        ...updates
      });
      
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Projects routes
  app.get('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getUserProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectData = insertProjectSchema.parse({
        ...req.body,
        userId
      });
      
      const project = await storage.createProject(projectData);
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.id, userId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.updateProject(req.params.id, userId, req.body);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const success = await storage.deleteProject(req.params.id, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // File upload routes
  app.post('/api/upload', isAuthenticated, (req: any, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  }, async (req: any, res) => {
    try {
      console.log('Upload request received:', {
        file: req.file,
        body: req.body,
        headers: req.headers['content-type']
      });
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;
      const file = req.file;
      const fileBuffer = fs.readFileSync(file.path);
      
      // For local development, keep files in uploads directory
      const fileName = `${userId}-${Date.now()}-${file.originalname}`;
      const permanentPath = `uploads/${fileName}`;
      fs.renameSync(file.path, permanentPath);
      const fileUrl = `/uploads/${fileName}`;
      
      // Create project for uploaded file with initial language detection status
      const projectData = insertProjectSchema.parse({
        userId,
        name: file.originalname,
        type: file.mimetype.startsWith('video/') ? 'video' : 'audio',
        originalFileName: file.originalname,
        filePath: fileUrl,
        language: req.body.language || 'detecting',
        status: 'processing'
      });
      
      const project = await storage.createProject(projectData);
      
      // Start language detection and transcription process in background
      setTimeout(async () => {
        try {
          let detectedLanguage = req.body.language;
          
          // Auto-detect language if not provided
          if (!detectedLanguage || detectedLanguage === 'auto') {
            console.log(`Auto-detecting language for project ${project.id}...`);
            const languageResult = await languageDetectionService.detectLanguage(permanentPath);
            detectedLanguage = languageResult.language;
            
            console.log(`Detected language: ${detectedLanguage} (confidence: ${languageResult.confidence})`);
            
            // Update project with detected language
            await storage.updateProject(project.id, userId, { 
              language: detectedLanguage 
            });
          }
          
          // Get the required VOSK model for the detected language
          const requiredModel = languageDetectionService.getVoskModelForLanguage(detectedLanguage);
          console.log(`Required VOSK model: ${requiredModel}`);
          
          // Check if model is available, download if not
          try {
            const downloadedModels = await speechApiClient.getDownloadedModels();
            const isModelAvailable = downloadedModels.some(model => model.id === requiredModel);
            
            if (!isModelAvailable) {
              console.log(`Model ${requiredModel} not available, downloading...`);
              
              // Update project status to indicate model download
              await storage.updateProject(project.id, userId, { 
                status: 'downloading_model' 
              });
              
              const downloadResult = await speechApiClient.downloadModel(requiredModel);
              if (!downloadResult.success) {
                throw new Error(`Failed to download model ${requiredModel}: ${downloadResult.message}`);
              }
              
              console.log(`Successfully downloaded model ${requiredModel}`);
              
              // Wait a moment for model to be ready
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          } catch (modelError) {
            console.error('Model download error:', modelError);
            // Continue with English as fallback
            detectedLanguage = 'en-us';
          }
          
          // Update status back to processing for transcription
          await storage.updateProject(project.id, userId, { 
            status: 'processing' 
          });
          
          const transcriptionResult = await voskService.transcribeAudioFile(
            permanentPath,
            detectedLanguage
          );
          
          // Save transcription segments to database
          for (const segment of transcriptionResult.segments) {
            await storage.createTranscriptionSegment({
              projectId: project.id,
              text: segment.text,
              startTime: segment.start,
              endTime: segment.end,
              confidence: segment.conf,
              speakerId: null
            });
          }
          
          // Update project status to completed
          await storage.updateProject(project.id, userId, { 
            status: 'completed',
            duration: transcriptionResult.duration 
          });
          
        } catch (transcriptionError) {
          console.error('Transcription failed:', transcriptionError);
          await storage.updateProject(project.id, userId, { status: 'failed' });
        }
      }, 100);
      
      res.json({
        project,
        fileUrl,
        message: "File uploaded successfully and transcription started"
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Start transcription for uploaded file
  app.post('/api/projects/:id/transcribe', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { language = 'en-US', enableSpeakerDiarization = false } = req.body;
      
      const project = await storage.getProject(req.params.id, userId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (!project.filePath) {
        return res.status(400).json({ message: "No file associated with project" });
      }

      // Update project status
      await storage.updateProject(req.params.id, userId, { status: 'processing' });

      // Get file path for transcription
      const filePath = project.filePath?.replace('/uploads/', 'uploads/');
      if (!filePath || !fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      // Use VOSK service for transcription
      const transcriptionResult = await voskService.transcribeAudioFile(
        filePath,
        language
      );

      // Save transcription segments to database
      for (const segment of transcriptionResult.segments) {
        await storage.createTranscriptionSegment({
          projectId: req.params.id,
          text: segment.text,
          startTime: segment.start,
          endTime: segment.end,
          confidence: segment.conf,
          speakerId: null
        });
      }

      // Update project with completion status
      await storage.updateProject(req.params.id, userId, {
        status: 'completed',
        language: language,
        duration: Math.round(transcriptionResult.duration)
      });

      res.json({
        message: "Transcription completed successfully",
        transcriptionResult,
        processingTime: transcriptionResult.processing_time
      });

    } catch (error) {
      console.error("Transcription error:", error);
      // Update project status to failed
      try {
        await storage.updateProject(req.params.id, req.user.claims.sub, { status: 'failed' });
      } catch (updateError) {
        console.error("Failed to update project status:", updateError);
      }
      res.status(500).json({ message: `Transcription failed: ${error.message}` });
    }
  });

  // Speech models routes
  app.get('/api/speech/models', async (req, res) => {
    try {
      const languages = voskService.getAvailableLanguages();
      const models = languages.map(lang => ({
        id: `${lang}-small`,
        language_code: lang,
        language_name: lang.toUpperCase(),
        model_name: `VOSK ${lang} Small`,
        model_size: 'small',
        file_size_mb: 50,
        is_downloaded: voskService.isModelAvailable(lang),
        is_active: true,
        accuracy: 90,
        created_at: new Date().toISOString()
      }));
      res.json(models);
    } catch (error) {
      console.error("Error fetching speech models:", error);
      res.status(500).json({ message: "Failed to fetch speech models" });
    }
  });

  app.get('/api/speech/models/downloaded', async (req, res) => {
    try {
      const languages = voskService.getAvailableLanguages();
      const models = languages
        .filter(lang => voskService.isModelAvailable(lang))
        .map(lang => ({
          id: `${lang}-small`,
          language_code: lang,
          language_name: lang.toUpperCase(),
          model_name: `VOSK ${lang} Small`,
          model_size: 'small',
          file_size_mb: 50,
          is_downloaded: true,
          is_active: true,
          accuracy: 90,
          created_at: new Date().toISOString()
        }));
      res.json(models);
    } catch (error) {
      console.error("Error fetching downloaded models:", error);
      res.status(500).json({ message: "Failed to fetch downloaded models" });
    }
  });

  app.post('/api/speech/models/:id/download', async (req, res) => {
    try {
      const language = req.params.id.replace('-small', '');
      const success = await voskService.downloadModel(language);
      res.json({ 
        success, 
        message: success ? `Model ${language} downloaded successfully` : `Failed to download model ${language}`
      });
    } catch (error) {
      console.error("Error downloading model:", error);
      res.status(500).json({ message: "Failed to download model" });
    }
  });

  app.get('/api/speech/health', async (req, res) => {
    try {
      res.json({ 
        status: 'healthy',
        service: 'vosk',
        available_languages: voskService.getAvailableLanguages().length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Speech service health check failed:", error);
      res.status(503).json({ message: "Speech service unavailable" });
    }
  });

  // Transcription segments routes
  app.get('/api/projects/:id/segments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.id, userId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const segments = await storage.getTranscriptionSegments(req.params.id);
      console.log(`Segments API - Project ${req.params.id}: Found ${segments.length} segments`);
      console.log('Sample segment structure:', segments[0]);
      res.json(segments);
    } catch (error) {
      console.error("Error fetching segments:", error);
      res.status(500).json({ message: "Failed to fetch segments" });
    }
  });

  app.post('/api/projects/:id/segments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.id, userId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const segmentData = insertTranscriptionSegmentSchema.parse({
        ...req.body,
        projectId: req.params.id
      });
      
      const segment = await storage.createTranscriptionSegment(segmentData);
      res.json(segment);
    } catch (error) {
      console.error("Error creating segment:", error);
      res.status(500).json({ message: "Failed to create segment" });
    }
  });

  // Language models routes
  app.get('/api/language-models', async (req, res) => {
    try {
      const models = await storage.getLanguageModels();
      res.json(models);
    } catch (error) {
      console.error("Error fetching language models:", error);
      res.status(500).json({ message: "Failed to fetch language models" });
    }
  });

  // User settings routes
  app.get('/api/user/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch user settings" });
    }
  });

  app.put('/api/user/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settingsData = insertUserSettingsSchema.parse({
        ...req.body,
        userId
      });
      
      const settings = await storage.upsertUserSettings(settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update user settings" });
    }
  });

  // Generate SRT file from project
  app.get('/api/projects/:id/srt', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.id, userId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const segments = await storage.getTranscriptionSegments(req.params.id);
      
      // Generate SRT content
      let srtContent = '';
      segments.forEach((segment, index) => {
        const startTime = formatTime(segment.startTime);
        const endTime = formatTime(segment.endTime);
        
        srtContent += `${index + 1}\n`;
        srtContent += `${startTime} --> ${endTime}\n`;
        srtContent += `${segment.text}\n\n`;
      });
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${project.name}.srt"`);
      res.send(srtContent);
    } catch (error) {
      console.error("Error generating SRT:", error);
      res.status(500).json({ message: "Failed to generate SRT file" });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to format time for SRT
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
}
