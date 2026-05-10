import React, { useState, useRef } from 'react';

const Recorder = () => {
  const [recording, setRecording] = useState(false);
  const ws = useRef(null);
  const mediaRecorder = useRef(null);

  const start = async () => {
    ws.current = new WebSocket('ws://localhost:8000/ws/record');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    
    mediaRecorder.current.ondataavailable = (e) => {
      if (e.data.size > 0 && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(e.data);
      }
    };

    mediaRecorder.current.start(100);
    setRecording(true);
  };

  const stop = () => {
    mediaRecorder.current.stop();
    ws.current.close();
    setRecording(false);
  };

  return (
    <div>
      <button onClick={recording ? stop : start}>
        {recording ? 'Stop Recording' : 'Start Recording'}
      </button>
    </div>
  );
};

export default Recorder;