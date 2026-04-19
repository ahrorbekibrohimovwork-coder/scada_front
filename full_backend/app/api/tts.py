import os
import uuid
import asyncio
from functools import lru_cache
from fastapi import APIRouter
from fastapi.responses import FileResponse
import edge_tts

router = APIRouter()

UZ_VOICE = "uz-UZ-MadinaNeural"


@lru_cache(maxsize=1)
def get_ru_model():
    import torch
    local_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'model.pt')
    if not os.path.isfile(local_file):
        torch.hub.download_url_to_file('https://models.silero.ai/models/tts/ru/v4_ru.pt', local_file)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = torch.package.PackageImporter(local_file).load_pickle("tts_models", "model")
    model.to(device)
    return model


@router.get("/tts")
@router.post("/tts")
async def tts_ru(text: str = ''):
    if not text:
        return {"error": "text is required"}

    filename = f"ru_{uuid.uuid4().hex}.wav"

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: get_ru_model().save_wav(text=text, speaker='kseniya', sample_rate=48000, audio_path=filename)
    )

    return FileResponse(filename, media_type="audio/wav", background=_cleanup(filename))


@router.get("/tts_uz")
@router.post("/tts_uz")
async def tts_uz(text: str = ''):
    if not text:
        return {"error": "text is required"}

    filename = f"uz_{uuid.uuid4().hex}.mp3"
    communicate = edge_tts.Communicate(text, UZ_VOICE)
    await communicate.save(filename)

    return FileResponse(filename, media_type="audio/mpeg", background=_cleanup(filename))


class _cleanup:
    """Background task to delete temp audio file after response is sent."""
    def __init__(self, path: str):
        self.path = path

    async def __call__(self):
        try:
            os.remove(self.path)
        except Exception:
            pass
