from sqlalchemy import create_engine, Column, String, Integer, Boolean, DateTime, Text, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/voxtailor")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class VoskModel(Base):
    __tablename__ = "vosk_models"
    
    id = Column(String, primary_key=True)
    language_code = Column(String(10), nullable=False)
    language_name = Column(String(100), nullable=False)
    model_name = Column(String(200), nullable=False)
    model_size = Column(String(20), nullable=False)  # small, medium, large
    download_url = Column(Text, nullable=False)
    file_size_mb = Column(Integer, nullable=False)
    is_downloaded = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    model_path = Column(Text, nullable=True)
    accuracy = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Initialize with 10 popular languages
    db = SessionLocal()
    
    initial_models = [
        {
            "id": "en-us-small",
            "language_code": "en-US",
            "language_name": "English (US)",
            "model_name": "vosk-model-en-us-0.22",
            "model_size": "small",
            "download_url": "https://alphacephei.com/vosk/models/vosk-model-en-us-0.22.zip",
            "file_size_mb": 40,
            "accuracy": 0.92
        },
        {
            "id": "es-small",
            "language_code": "es",
            "language_name": "Spanish",
            "model_name": "vosk-model-es-0.42",
            "model_size": "small", 
            "download_url": "https://alphacephei.com/vosk/models/vosk-model-es-0.42.zip",
            "file_size_mb": 39,
            "accuracy": 0.90
        },
        {
            "id": "fr-small",
            "language_code": "fr",
            "language_name": "French",
            "model_name": "vosk-model-fr-0.22",
            "model_size": "small",
            "download_url": "https://alphacephei.com/vosk/models/vosk-model-fr-0.22.zip", 
            "file_size_mb": 41,
            "accuracy": 0.89
        },
        {
            "id": "de-small",
            "language_code": "de",
            "language_name": "German",
            "model_name": "vosk-model-de-0.21",
            "model_size": "small",
            "download_url": "https://alphacephei.com/vosk/models/vosk-model-de-0.21.zip",
            "file_size_mb": 43,
            "accuracy": 0.88
        },
        {
            "id": "ru-small",
            "language_code": "ru", 
            "language_name": "Russian",
            "model_name": "vosk-model-ru-0.42",
            "model_size": "small",
            "download_url": "https://alphacephei.com/vosk/models/vosk-model-ru-0.42.zip",
            "file_size_mb": 45,
            "accuracy": 0.91
        },
        {
            "id": "zh-small",
            "language_code": "zh-CN",
            "language_name": "Chinese (Mandarin)",
            "model_name": "vosk-model-cn-0.22",
            "model_size": "small",
            "download_url": "https://alphacephei.com/vosk/models/vosk-model-cn-0.22.zip",
            "file_size_mb": 42,
            "accuracy": 0.87
        },
        {
            "id": "ja-small",
            "language_code": "ja",
            "language_name": "Japanese", 
            "model_name": "vosk-model-ja-0.22",
            "model_size": "small",
            "download_url": "https://alphacephei.com/vosk/models/vosk-model-ja-0.22.zip",
            "file_size_mb": 48,
            "accuracy": 0.86
        },
        {
            "id": "pt-small",
            "language_code": "pt-BR",
            "language_name": "Portuguese (Brazil)",
            "model_name": "vosk-model-pt-0.3",
            "model_size": "small",
            "download_url": "https://alphacephei.com/vosk/models/vosk-model-pt-0.3.zip",
            "file_size_mb": 44,
            "accuracy": 0.89
        },
        {
            "id": "it-small",
            "language_code": "it",
            "language_name": "Italian",
            "model_name": "vosk-model-it-0.22",
            "model_size": "small",
            "download_url": "https://alphacephei.com/vosk/models/vosk-model-it-0.22.zip",
            "file_size_mb": 40,
            "accuracy": 0.88
        },
        {
            "id": "hi-small", 
            "language_code": "hi",
            "language_name": "Hindi",
            "model_name": "vosk-model-hi-0.22",
            "model_size": "small",
            "download_url": "https://alphacephei.com/vosk/models/vosk-model-hi-0.22.zip",
            "file_size_mb": 46,
            "accuracy": 0.85
        }
    ]
    
    for model_data in initial_models:
        existing = db.query(VoskModel).filter(VoskModel.id == model_data["id"]).first()
        if not existing:
            model = VoskModel(**model_data)
            db.add(model)
    
    db.commit()
    db.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized with 10 language models")