import os
import asyncio
import tempfile
from pathlib import Path
from typing import List
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import uvicorn

from database import get_db, init_db, VoskModel
from speech_service import speech_service
from models import (
    VoskModelResponse, 
    TranscriptionResult, 
    TranscriptionRequest,
    ModelDownloadRequest,
    ModelDownloadResponse
)

app = FastAPI(
    title="VoxTailor Speech API",
    description="VOSK-powered speech-to-text API with multi-language support",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize database and models on startup"""
    init_db()
    print("Speech API started successfully")

@app.get("/")
async def root():
    return {"message": "VoxTailor Speech API", "status": "running"}

@app.get("/models", response_model=List[VoskModelResponse])
async def get_available_models(db: Session = Depends(get_db)):
    """Get all available language models"""
    models = speech_service.get_available_models(db)
    return models

@app.get("/models/downloaded", response_model=List[VoskModelResponse])
async def get_downloaded_models(db: Session = Depends(get_db)):
    """Get only downloaded models"""
    models = speech_service.get_downloaded_models(db)
    return models

@app.post("/models/download", response_model=ModelDownloadResponse)
async def download_model(
    request: ModelDownloadRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Download a specific model"""
    try:
        success, message = await speech_service.download_model(request.model_id, db)
        return ModelDownloadResponse(success=success, message=message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe/file", response_model=TranscriptionResult)
async def transcribe_file(
    file: UploadFile = File(...),
    language: str = "en-US",
    enable_speaker_diarization: bool = False,
    db: Session = Depends(get_db)
):
    """Transcribe uploaded audio/video file"""
    
    # Validate file type
    if not file.content_type or not (
        file.content_type.startswith('audio/') or 
        file.content_type.startswith('video/')
    ):
        raise HTTPException(status_code=400, detail="Invalid file type. Only audio and video files are supported.")
    
    # Find appropriate model
    model = db.query(VoskModel).filter(
        VoskModel.language_code == language,
        VoskModel.is_downloaded == True
    ).first()
    
    if not model:
        # Try to find a downloaded model with similar language code
        model = db.query(VoskModel).filter(
            VoskModel.language_code.like(f"{language.split('-')[0]}%"),
            VoskModel.is_downloaded == True
        ).first()
        
        if not model:
            raise HTTPException(
                status_code=404, 
                detail=f"No downloaded model found for language {language}. Please download a model first."
            )
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
            contents = await file.read()
            tmp_file.write(contents)
            tmp_file_path = tmp_file.name
        
        # Transcribe audio
        result = speech_service.transcribe_audio(
            tmp_file_path,
            model.id,
            db,
            enable_speaker_diarization
        )
        
        # Clean up temporary file
        os.unlink(tmp_file_path)
        
        return result
        
    except Exception as e:
        # Clean up on error
        if 'tmp_file_path' in locals():
            try:
                os.unlink(tmp_file_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@app.get("/models/{model_id}/status")
async def get_model_status(model_id: str, db: Session = Depends(get_db)):
    """Get status of a specific model"""
    model = db.query(VoskModel).filter(VoskModel.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    return {
        "id": model.id,
        "language_name": model.language_name,
        "is_downloaded": model.is_downloaded,
        "is_active": model.is_active,
        "file_size_mb": model.file_size_mb,
        "accuracy": model.accuracy
    }

@app.delete("/models/{model_id}")
async def delete_model(model_id: str, db: Session = Depends(get_db)):
    """Delete a downloaded model"""
    model = db.query(VoskModel).filter(VoskModel.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    if not model.is_downloaded:
        raise HTTPException(status_code=400, detail="Model is not downloaded")
    
    try:
        # Remove model files
        if model.model_path and os.path.exists(model.model_path):
            import shutil
            shutil.rmtree(model.model_path)
        
        # Update database
        model.is_downloaded = False
        model.model_path = None
        db.commit()
        
        # Remove from loaded models cache
        if model_id in speech_service.loaded_models:
            del speech_service.loaded_models[model_id]
        
        return {"message": f"Model {model.language_name} deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete model: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "loaded_models": len(speech_service.loaded_models),
        "api_version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )