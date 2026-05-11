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

audio_queue = asyncio.Queue()


@app.websocket("/ws/record")
async def record_audio(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_bytes()
        samples = np.frombuffer(data, dtype=np.int16)
        inverted = (samples * -1).astype(np.int16)
        await audio_queue.put(inverted.tobytes())


@app.websocket("/ws/stream")
async def stream_audio(websocket: WebSocket):
    await websocket.accept()
    while True:
        chunk = await audio_queue.get()
        await websocket.send_bytes(chunk)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)