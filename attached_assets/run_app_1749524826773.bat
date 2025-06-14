@echo off
echo Starting Streamlit Vosk Speech-to-Text App...
echo Open your browser to http://localhost:8501
echo.

streamlit run app/main.py --server.port 8501
pause
