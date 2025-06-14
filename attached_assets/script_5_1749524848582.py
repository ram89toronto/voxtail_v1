# Create chart data for model comparison
import pandas as pd
import json

# Read the models data
df = pd.read_csv("vosk_apache2_models.csv")

# Filter out TBD values and prepare data for chart
chart_data = df[df['WER'] != 'TBD'].copy()
chart_data['WER'] = chart_data['WER'].astype(float)

# Create simplified data for chart
chart_json_data = []
for _, row in chart_data.iterrows():
    chart_json_data.append({
        "Language": row['Language'],
        "Model_Type": row['Type'],
        "WER": row['WER'],
        "Size": row['Size'],
        "Model_Name": row['Model Name']
    })

# Save as JSON for chart creation
with open("model_comparison_data.json", "w") as f:
    json.dump(chart_json_data, f, indent=2)

print("Chart data prepared:")
print(f"Total models with WER data: {len(chart_json_data)}")
print("\nSample data:")
for item in chart_json_data[:5]:
    print(f"  {item['Language']} ({item['Model_Type']}): {item['WER']}% WER")

# Create a summary table for the best models per language
best_models = []
languages_with_data = chart_data['Language'].unique()

for language in languages_with_data:
    lang_data = chart_data[chart_data['Language'] == language]
    
    # Get best small and large models
    small_models = lang_data[lang_data['Type'] == 'Small']
    large_models = lang_data[lang_data['Type'].isin(['Big', 'Large'])]
    
    if not small_models.empty:
        best_small = small_models.loc[small_models['WER'].idxmin()]
        best_models.append({
            'Language': language,
            'Model_Type': 'Best Small',
            'Model_Name': best_small['Model Name'],
            'WER': best_small['WER'],
            'Size': best_small['Size']
        })
    
    if not large_models.empty:
        best_large = large_models.loc[large_models['WER'].idxmin()]
        best_models.append({
            'Language': language,
            'Model_Type': 'Best Large',
            'Model_Name': best_large['Model Name'],
            'WER': best_large['WER'],
            'Size': best_large['Size']
        })

# Save best models summary
best_models_df = pd.DataFrame(best_models)
best_models_df.to_csv("best_models_summary.csv", index=False)

print(f"\n📊 Best models per language:")
print(best_models_df.to_string(index=False))

# Create deployment timeline data
deployment_steps = [
    {"Step": 1, "Phase": "Setup", "Task": "Clone repository", "Duration": "5 min", "Description": "Clone the project repository from GitHub"},
    {"Step": 2, "Phase": "Setup", "Task": "Install dependencies", "Duration": "10 min", "Description": "Install Python packages from requirements.txt"},
    {"Step": 3, "Phase": "Configuration", "Task": "Configure models", "Duration": "5 min", "Description": "Set up model configuration and language selection"},
    {"Step": 4, "Phase": "Development", "Task": "Download test model", "Duration": "15 min", "Description": "Download a small model for testing (e.g., English small)"},
    {"Step": 5, "Phase": "Development", "Task": "Test local app", "Duration": "10 min", "Description": "Run Streamlit app locally and test functionality"},
    {"Step": 6, "Phase": "Production", "Task": "Deploy to cloud", "Duration": "20 min", "Description": "Deploy to Streamlit Cloud or other hosting platform"},
    {"Step": 7, "Phase": "Production", "Task": "Download production models", "Duration": "30-60 min", "Description": "Download additional models as needed for production"},
    {"Step": 8, "Phase": "Optimization", "Task": "Performance tuning", "Duration": "Variable", "Description": "Optimize caching and model loading"}
]

deployment_df = pd.DataFrame(deployment_steps)
deployment_df.to_csv("deployment_timeline.csv", index=False)

print(f"\n🚀 Deployment timeline saved to deployment_timeline.csv")
print("Total estimated setup time: 95-125 minutes")

# Create feature comparison matrix
features = [
    {"Feature": "Offline Recognition", "Vosk": "✅ Yes", "Google Cloud": "❌ No", "Amazon Transcribe": "❌ No", "OpenAI Whisper": "✅ Yes"},
    {"Feature": "Real-time Processing", "Vosk": "✅ Yes", "Google Cloud": "✅ Yes", "Amazon Transcribe": "✅ Yes", "OpenAI Whisper": "⚠️ Limited"},
    {"Feature": "Multiple Languages", "Vosk": "✅ 28+ languages", "Google Cloud": "✅ 125+ languages", "Amazon Transcribe": "✅ 35+ languages", "OpenAI Whisper": "✅ 100+ languages"},
    {"Feature": "Apache 2.0 License", "Vosk": "✅ Yes", "Google Cloud": "❌ Proprietary", "Amazon Transcribe": "❌ Proprietary", "OpenAI Whisper": "✅ MIT"},
    {"Feature": "No API Costs", "Vosk": "✅ Free", "Google Cloud": "💰 Pay per use", "Amazon Transcribe": "💰 Pay per use", "OpenAI Whisper": "✅ Free"},
    {"Feature": "Privacy (No Data Upload)", "Vosk": "✅ Complete", "Google Cloud": "❌ Data uploaded", "Amazon Transcribe": "❌ Data uploaded", "OpenAI Whisper": "✅ Complete"},
    {"Feature": "Model Size", "Vosk": "40MB - 4.4GB", "Google Cloud": "N/A (Cloud)", "Amazon Transcribe": "N/A (Cloud)", "OpenAI Whisper": "39MB - 1.5GB"},
    {"Feature": "Internet Required", "Vosk": "❌ No", "Google Cloud": "✅ Yes", "Amazon Transcribe": "✅ Yes", "OpenAI Whisper": "❌ No"}
]

features_df = pd.DataFrame(features)
features_df.to_csv("feature_comparison.csv", index=False)

print(f"\n🔄 Feature comparison saved to feature_comparison.csv")
print("\n✅ All data files created successfully!")

# Summary
print("\n" + "="*60)
print("DATA GENERATION SUMMARY")
print("="*60)
print("📊 vosk_apache2_models.csv - Complete model catalog (50 models)")
print("🏆 best_models_summary.csv - Best performing models per language")
print("📈 model_comparison_data.json - Chart-ready model performance data")
print("🚀 deployment_timeline.csv - Step-by-step deployment guide")
print("⚖️ feature_comparison.csv - Vosk vs competitors comparison")
print("\n🎯 Ready for comprehensive project documentation!")