# Create the main Streamlit app code example

main_app_code = '''
import streamlit as st
import json
import io
import wave
import threading
from pathlib import Path

# Custom imports
from app.model_manager import ModelManager
from app.audio_processor import AudioProcessor
from app.speech_recognizer import VoskRecognizer
from streamlit_mic_recorder import mic_recorder

# Page configuration
st.set_page_config(
    page_title="Multi-Language Speech-to-Text",
    page_icon="🎤",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize components
@st.cache_resource
def initialize_model_manager():
    return ModelManager()

@st.cache_resource
def initialize_audio_processor():
    return AudioProcessor()

def main():
    st.title("🎤 Multi-Language Speech-to-Text with Vosk")
    st.markdown("Convert speech to text using offline Vosk models supporting 28+ languages")
    
    # Initialize managers
    model_manager = initialize_model_manager()
    audio_processor = initialize_audio_processor()
    
    # Sidebar for language selection
    with st.sidebar:
        st.header("🌍 Language Selection")
        
        # Get available languages
        available_languages = model_manager.get_available_languages()
        
        # Language selection
        selected_language = st.selectbox(
            "Choose language",
            available_languages,
            index=0,
            help="Select the language for speech recognition"
        )
        
        # Model type selection
        model_types = model_manager.get_model_types(selected_language)
        selected_model_type = st.selectbox(
            "Model type",
            model_types,
            help="Small models: faster, less accurate. Large models: slower, more accurate"
        )
        
        # Download model if needed
        model_info = model_manager.get_model_info(selected_language, selected_model_type)
        
        if not model_manager.is_model_downloaded(selected_language, selected_model_type):
            st.warning(f"Model not downloaded: {model_info['name']}")
            if st.button("📥 Download Model"):
                with st.spinner(f"Downloading {model_info['name']}..."):
                    try:
                        model_manager.download_model(selected_language, selected_model_type)
                        st.success("Model downloaded successfully!")
                        st.rerun()
                    except Exception as e:
                        st.error(f"Download failed: {str(e)}")
        else:
            st.success(f"✅ Model ready: {model_info['name']}")
            
            # Model details
            with st.expander("Model Details"):
                st.write(f"**Size:** {model_info['size']}")
                st.write(f"**WER:** {model_info.get('wer', 'N/A')}")
                st.write(f"**License:** {model_info['license']}")
    
    # Main content area
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.header("🎙️ Speech Recognition")
        
        # Check if model is available
        if model_manager.is_model_downloaded(selected_language, selected_model_type):
            # Initialize recognizer
            recognizer = VoskRecognizer(
                model_manager.get_model_path(selected_language, selected_model_type)
            )
            
            # Audio recording
            st.subheader("Record Audio")
            audio_data = mic_recorder(
                start_prompt="🎤 Start Recording",
                stop_prompt="⏹️ Stop Recording",
                just_once=False,
                use_container_width=True,
                key="speech_recorder"
            )
            
            if audio_data is not None:
                # Display audio player
                st.audio(audio_data['bytes'], format='audio/wav')
                
                # Process audio
                with st.spinner("Processing audio..."):
                    try:
                        # Convert audio for Vosk
                        processed_audio = audio_processor.prepare_for_vosk(audio_data['bytes'])
                        
                        # Recognize speech
                        result = recognizer.recognize(processed_audio)
                        
                        # Display results
                        if result and result.get('text'):
                            st.success("✅ Recognition completed!")
                            
                            # Display transcription
                            st.subheader("📝 Transcription")
                            transcript = result['text']
                            st.text_area(
                                "Recognized text:",
                                value=transcript,
                                height=100,
                                key="transcription_output"
                            )
                            
                            # Download transcription
                            if st.button("💾 Download Transcription"):
                                st.download_button(
                                    label="Download as TXT",
                                    data=transcript,
                                    file_name=f"transcription_{selected_language}.txt",
                                    mime="text/plain"
                                )
                            
                            # Confidence and details
                            if 'confidence' in result:
                                st.metric("Confidence", f"{result['confidence']:.2%}")
                                
                        else:
                            st.warning("No speech detected in the audio")
                            
                    except Exception as e:
                        st.error(f"Error processing audio: {str(e)}")
                        
            # File upload option
            st.subheader("📁 Upload Audio File")
            uploaded_file = st.file_uploader(
                "Choose an audio file",
                type=['wav', 'mp3', 'flac', 'm4a'],
                help="Upload an audio file for transcription"
            )
            
            if uploaded_file is not None:
                st.audio(uploaded_file, format='audio/' + uploaded_file.type.split('/')[-1])
                
                if st.button("🔄 Process Uploaded File"):
                    with st.spinner("Processing uploaded file..."):
                        try:
                            # Process uploaded audio
                            processed_audio = audio_processor.process_uploaded_file(uploaded_file)
                            result = recognizer.recognize(processed_audio)
                            
                            if result and result.get('text'):
                                st.success("✅ File processed successfully!")
                                st.text_area(
                                    "Transcription:",
                                    value=result['text'],
                                    height=150
                                )
                            else:
                                st.warning("No speech detected in the uploaded file")
                                
                        except Exception as e:
                            st.error(f"Error processing file: {str(e)}")
        else:
            st.info("Please download a model first using the sidebar")
    
    with col2:
        st.header("📊 Statistics")
        
        # Model statistics
        total_models = len(model_manager.get_all_models())
        downloaded_models = len(model_manager.get_downloaded_models())
        
        st.metric("Available Models", total_models)
        st.metric("Downloaded Models", downloaded_models)
        st.metric("Languages Supported", len(available_languages))
        
        # System info
        st.subheader("🖥️ System Information")
        st.write(f"**Streamlit Version:** {st.__version__}")
        st.write(f"**Project License:** Apache 2.0")
        
        # Recent activity
        if 'transcription_history' not in st.session_state:
            st.session_state.transcription_history = []
            
        if st.session_state.transcription_history:
            st.subheader("📋 Recent Transcriptions")
            for i, item in enumerate(st.session_state.transcription_history[-5:]):
                with st.expander(f"Transcription {len(st.session_state.transcription_history)-i}"):
                    st.write(f"**Language:** {item['language']}")
                    st.write(f"**Text:** {item['text'][:100]}...")
    
    # Footer
    st.markdown("---")
    st.markdown(
        "Built with ❤️ using [Streamlit](https://streamlit.io) and [Vosk](https://alphacephei.com/vosk/). "
        "Licensed under Apache 2.0."
    )

if __name__ == "__main__":
    main()
'''

# Save to file
with open("streamlit_main_app.py", "w") as f:
    f.write(main_app_code)

print("✅ Created main Streamlit app code")
print("File: streamlit_main_app.py")
print(f"Lines of code: {len(main_app_code.splitlines())}")