import React, { useState, useRef } from 'react';

const SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4096;
const WS_BASE = 'ws://localhost:8000';

const AudioApp = () => {
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const recorderRefs = useRef({});
  const playerRefs = useRef({});

  const startRecording = async () => {
    const audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioCtx.createMediaStreamSource(stream);
    const processor = audioCtx.createScriptProcessor(BUFFER_SIZE, 1, 1);
    const silencer = audioCtx.createGain();
    silencer.gain.value = 0;

    const ws = new WebSocket(`${WS_BASE}/ws/record`);
    ws.binaryType = 'arraybuffer';

    processor.onaudioprocess = (e) => {
      const float32 = e.inputBuffer.getChannelData(0);
      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(int16.buffer);
      }
    };

    source.connect(processor);
    processor.connect(silencer);
    silencer.connect(audioCtx.destination);

    recorderRefs.current = { audioCtx, stream, source, processor, silencer, ws };
    setRecording(true);
  };

  const stopRecording = () => {
    const { audioCtx, stream, source, processor, silencer, ws } = recorderRefs.current;
    source.disconnect();
    processor.disconnect();
    silencer.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    ws.close();
    audioCtx.close();
    setRecording(false);
  };

  const startPlaying = () => {
    const audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
    let nextStartTime = 0;

    const ws = new WebSocket(`${WS_BASE}/ws/stream`);
    ws.binaryType = 'arraybuffer';

    ws.onmessage = (event) => {
      const int16 = new Int16Array(event.data);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768;
      }
      const audioBuffer = audioCtx.createBuffer(1, float32.length, SAMPLE_RATE);
      audioBuffer.copyToChannel(float32, 0);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      const startAt = Math.max(audioCtx.currentTime, nextStartTime);
      source.start(startAt);
      nextStartTime = startAt + audioBuffer.duration;
    };

    ws.onclose = () => setPlaying(false);

    playerRefs.current = { audioCtx, ws };
    setPlaying(true);
  };

  const stopPlaying = () => {
    const { audioCtx, ws } = playerRefs.current;
    ws.close();
    audioCtx.close();
    setPlaying(false);
  };

  return (
    <div>
      <button onClick={recording ? stopRecording : startRecording}>
        {recording ? 'Stop Recording' : 'Start Recording'}
      </button>
      <button
        onClick={playing ? stopPlaying : startPlaying}
        disabled={recording}
      >
        {playing ? 'Stop Playback' : 'Play Inverted Audio'}
      </button>
    </div>
  );
};

export default AudioApp;