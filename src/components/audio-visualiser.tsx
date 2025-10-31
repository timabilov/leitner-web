import React, { useEffect, useRef } from 'react';

export function AudioVisualizer({ mediaStream, isPaused }) {
  const canvasRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  useEffect(() => {
    if (!mediaStream || !canvasRef.current) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'closed') return;
    
    const source = audioContext.createMediaStreamSource(mediaStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    source.connect(analyser);

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;

    // --- NEW: Create a color gradient ---
    const gradient = canvasCtx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, 'hsl(222.2 47.4% 11.2%)'); // Primary color (top)
    gradient.addColorStop(1, 'hsl(215.4 16.3% 46.9%)'); // Muted color (bottom)

    const draw = () => {
      animationFrameIdRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      
      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
      
      const barWidth = 2.5;
      const spacing = 1.5;
      const numBars = Math.floor(centerX / (barWidth + spacing));

      // --- NEW: Mirrored drawing logic ---
      for (let i = 0; i < numBars; i++) {
        // We use a value from the lower frequencies for a more "bassy" and stable visual
        const barHeight = (dataArray[i * 2] / 255) * HEIGHT * 0.8;
        
        // Use the gradient for the fill color
        canvasCtx.fillStyle = gradient;

        const x = i * (barWidth + spacing);

        // Draw the right bar, expanding from the center
        canvasCtx.fillRect(centerX + x, centerY - barHeight / 2, barWidth, barHeight);
        
        // Draw the left (mirrored) bar
        canvasCtx.fillRect(centerX - x - barWidth, centerY - barHeight / 2, barWidth, barHeight);
      }
    };

    if (isPaused) {
      cancelAnimationFrame(animationFrameIdRef.current);
      // Clear canvas to show it has stopped
      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    } else {
      draw();
    }

    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
      source.disconnect();
      analyser.disconnect();
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [mediaStream, isPaused]);

  return <canvas ref={canvasRef} width="150" height="32" className="transition-opacity duration-300" />;
};