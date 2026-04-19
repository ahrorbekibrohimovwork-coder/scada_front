import os
import torch
import uuid
import asyncio
import edge_tts
from flask import Flask, request, send_file, jsonify

app = Flask(__name__)

# --- РУССКИЙ (Silero - Полностью локально) ---
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
local_file = 'model.pt'
if not os.path.isfile(local_file):
    torch.hub.download_url_to_file('https://models.silero.ai/models/tts/ru/v4_ru.pt', local_file)

model_ru = torch.package.PackageImporter(local_file).load_pickle("tts_models", "model")
model_ru.to(device)

# --- УЗБЕКСКИЙ (Edge TTS - Высокое качество) ---
UZ_VOICE = "uz-UZ-MadinaNeural" 

@app.route('/tts', methods=['GET', 'POST'])
def tts_ru():
    text = request.args.get('text', '') if request.method == 'GET' else request.get_json().get('text', '')
    filename = f"ru_{uuid.uuid4().hex}.wav"
    model_ru.save_wav(text=text, speaker='kseniya', sample_rate=48000, audio_path=filename)
    return send_file(filename, mimetype="audio/wav")

@app.route('/tts_uz', methods=['GET', 'POST'])
def tts_uz():
    text = request.args.get('text', '') if request.method == 'GET' else request.get_json().get('text', '')
    if not text: return jsonify({"error": "Matn kiritilmadi"}), 400

    filename = f"uz_{uuid.uuid4().hex}.mp3" # Edge выдает mp3
    
    # Запускаем асинхронную генерацию речи
    async def generate():
        communicate = edge_tts.Communicate(text, UZ_VOICE)
        await communicate.save(filename)

    try:
        asyncio.run(generate())
        return send_file(filename, mimetype="audio/mpeg")
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)