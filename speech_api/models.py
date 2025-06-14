from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class VoskModelResponse(BaseModel):
    id: str
    language_code: str
    language_name: str
    model_name: str
    model_size: str
    file_size_mb: int
    is_downloaded: bool
    is_active: bool
    accuracy: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True

class TranscriptionSegment(BaseModel):
    text: str
    confidence: float
    start_time: float
    end_time: float
    speaker_id: Optional[str] = None

class TranscriptionResult(BaseModel):
    segments: List[TranscriptionSegment]
    language: str
    duration: float
    processing_time: float

class TranscriptionRequest(BaseModel):
    language: str = "en-US"
    enable_speaker_diarization: bool = False
    project_id: Optional[str] = None

class ModelDownloadRequest(BaseModel):
    model_id: str

class ModelDownloadResponse(BaseModel):
    success: bool
    message: str
    progress: Optional[float] = None