import React, { useRef } from 'react';

const Player = () => {
  const audioContext = useRef(new (window.AudioContext || window.webkitAudioContext)());

  const playStream = () => {
    const socket = new WebSocket('ws://localhost:8001/ws/stream');
    socket.binaryType = 'arraybuffer';

    socket.onmessage = async (event) => {
      const buffer = await audioContext.current.decodeAudioData(event.data);
      const source = audioContext.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.current.destination);
      source.start();
    };
  };

  return (
    <div>
      <button onClick={playStream}>Start Listening</button>
    </div>
  );
};

export default Player;