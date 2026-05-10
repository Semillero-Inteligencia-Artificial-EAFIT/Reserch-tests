from fastapi import FastAPI, WebSocket
import uvicorn

app = FastAPI()


@app.websocket("/ws/record")
async def record_audio(websocket: WebSocket):
    await websocket.accept()
    with open("recorded_audio.raw", "wb") as f:
        while True:
            data = await websocket.receive_bytes()
            print(data)
            f.write(data)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
