import React, { useEffect, useRef } from 'react';

export function AudioVisualizer({ mediaStream, isPaused }) {
  const canvasRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  // This ref will now hold the amplitude values for all bars currently visible on the canvas
  const waveformHistoryRef = useRef([]);

  useEffect(() => {
    if (!mediaStream || !canvasRef.current) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'closed') return;
    
    const source = audioContext.createMediaStreamSource(mediaStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    source.connect(analyser);

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    const centerX = Math.floor(WIDTH / 2);
    const centerY = Math.floor(HEIGHT / 2);

    const barWidth = 2;
    const barSpacing = 2;
    const totalBarWidth = barWidth + barSpacing;
    const numBars = Math.floor(WIDTH / totalBarWidth);

    const primaryColor = 'hsl(222.2 47.4% 11.2%)';
    const mutedColor = 'hsl(220 8.9% 46.1%)';
    const playheadColor = 'hsl(0 84.2% 60.2%)';

    // --- NEW: Initialize the history buffer ---
    // Pre-fill the array with zeros so it's full from the start
    if (waveformHistoryRef.current.length === 0) {
      waveformHistoryRef.current = new Array(numBars).fill(0);
    }

    const draw = () => {
      animationFrameIdRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const averageAmplitude = sum / bufferLength;

      // --- NEW: Ticker-tape animation logic ---
      // Remove the oldest value from the left
      waveformHistoryRef.current.shift();
      // Add the new, live value to the right
      waveformHistoryRef.current.push(averageAmplitude);

      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
      
      const history = waveformHistoryRef.current;
      
      // --- NEW: Draw all bars based on their position relative to the playhead ---
      for (let i = 0; i < history.length; i++) {
        const x = i * totalBarWidth;
        const barHeight = Math.max(2, (history[i] / 128) * HEIGHT * 0.9);
        
        // --- Core Coloring Logic ---
        // If the bar's x position is less than the center, it has "passed"
        if (x < centerX) {
          canvasCtx.fillStyle = primaryColor;
        } else {
          canvasCtx.fillStyle = mutedColor;
        }
        
        canvasCtx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
      }
      
      // Draw the central playhead last, so it's on top
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = playheadColor;
      canvasCtx.beginPath();
      canvasCtx.moveTo(centerX, 0);
      canvasCtx.lineTo(centerX, HEIGHT);
      canvasCtx.stroke();
    };

    if (isPaused) {
      cancelAnimationFrame(animationFrameIdRef.current);
    } else {
      draw();
    }

    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
      // Don't reset history on stop, just on unmount/stream change
      source.disconnect();
      analyser.disconnect();
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [mediaStream, isPaused]);

  // Reset the history when the component unmounts
  useEffect(() => {
    return () => {
      waveformHistoryRef.current = [];
    };
  }, []);

  return <canvas ref= {canvasRef} width="200" height="40" className="transition-opacity duration-300" />;
};
