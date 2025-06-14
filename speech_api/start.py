#!/usr/bin/env python3
import os
import sys
from pathlib import Path

# Add the speech_api directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# Set environment variables
os.environ.setdefault('DATABASE_URL', os.getenv('DATABASE_URL', 'postgresql://localhost/voxtailor'))

if __name__ == "__main__":
    # Initialize database first
    from database import init_db
    print("Initializing database...")
    init_db()
    
    # Start the FastAPI server
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )