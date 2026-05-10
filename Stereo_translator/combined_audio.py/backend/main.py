from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import numpy as np
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

AUDIO_FILE = "shared_audio.raw"


@app.websocket("/ws/record")
async def record_audio(websocket: WebSocket):
    await websocket.accept()
    with open(AUDIO_FILE, "wb") as f:
        while True:
            data = await websocket.receive_bytes()
            samples = np.frombuffer(data, dtype=np.int16)
            inverted = (samples * -1).astype(np.int16)
            f.write(inverted.tobytes())


@app.websocket("/ws/stream")
async def stream_audio(websocket: WebSocket):
    await websocket.accept()
    with open(AUDIO_FILE, "rb") as f:
        while True:
            chunk = f.read(4096)
            if not chunk:
                break
            await websocket.send_bytes(chunk)
            await asyncio.sleep(0.01)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
