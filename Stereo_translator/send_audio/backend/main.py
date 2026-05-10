from fastapi import FastAPI, WebSocket
import asyncio
import uvicorn

app = FastAPI()


@app.websocket("/ws/stream")
async def stream_audio(websocket: WebSocket):
    await websocket.accept()
    with open("source_audio.raw", "rb") as f:
        while True:
            chunk = f.read(1024)
            if not chunk:
                break
            await websocket.send_bytes(chunk)
            await asyncio.sleep(0.01)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
