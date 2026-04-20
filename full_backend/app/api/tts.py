import os
import uuid
import asyncio
from fastapi import APIRouter
from fastapi.responses import FileResponse
import edge_tts

router = APIRouter()

RU_VOICE = "ru-RU-SvetlanaNeural"
UZ_VOICE = "uz-UZ-MadinaNeural"


@router.get("/tts")
@router.post("/tts")
async def tts_ru(text: str = ''):
    if not text:
        return {"error": "text is required"}

    filename = f"/tmp/ru_{uuid.uuid4().hex}.mp3"
    communicate = edge_tts.Communicate(text, RU_VOICE)
    await communicate.save(filename)

    return FileResponse(filename, media_type="audio/mpeg", background=_cleanup(filename))


@router.get("/tts_uz")
@router.post("/tts_uz")
async def tts_uz(text: str = ''):
    if not text:
        return {"error": "text is required"}

    filename = f"/tmp/uz_{uuid.uuid4().hex}.mp3"
    communicate = edge_tts.Communicate(text, UZ_VOICE)
    await communicate.save(filename)

    return FileResponse(filename, media_type="audio/mpeg", background=_cleanup(filename))


class _cleanup:
    def __init__(self, path: str):
        self.path = path

    async def __call__(self):
        try:
            os.remove(self.path)
        except Exception:
            pass
