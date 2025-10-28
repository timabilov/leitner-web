import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button'; // Assuming you've added the Button component from Shadcn


type Props = {
  className?: string;
  timerClassName?: string;
  // Add this new prop to communicate with the parent
  onRecordingComplete?: (audioBlob: Blob) => void;
};


const AudioRecorder = ({ className, timerClassName, onRecordingComplete }: Props) => {
  const [permission, setPermission] = useState(false);
  const [stream, setStream] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('inactive');
  const [audioChunks, setAudioChunks] = useState([]);
  const [audio, setAudio] = useState(null);
  const mediaRecorder = useRef(null);

  // ... functions to handle recording will go here

  const getMicrophonePermission = async () => {
    if ('MediaRecorder' in window) {
      try {
        const streamData = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        setPermission(true);
        setStream(streamData);
      } catch (err) {
        alert(err.message);
      }
    } else {
      alert('The MediaRecorder API is not supported in your browser.');
    }
  };


  const startRecording = async () => {
    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(track => track.stop());
      cleanupWebAudioNodes(); 

      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // --- LIFT STATE UP ---
        // Call the callback function from the props with the final Blob
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob);
        }
        // ---------------------

        const arrayBuffer = await audioBlob.arrayBuffer();
        const decodingContext = new AudioContext();
        const decodedAudio = await decodingContext.decodeAudioData(arrayBuffer);
        audioBufferRef.current = decodedAudio;
        setDuration(decodedAudio.duration);
        await decodingContext.close();
      }
      setRecordingStatus("inactive");
    };

    mediaRecorder.start();
  };

  const stopRecording = () => {
    setRecordingStatus('inactive');
    mediaRecorder.current.stop();

    mediaRecorder.current.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudio(audioUrl);
      setAudioChunks([]);
    };
  };

  return (
    <div>
     <div className="flex flex-col items-center space-y-4">
      <h2 className="text-2xl font-bold">Audio Recorder</h2>
      <div className="flex space-x-2">
        {!permission ? (
          <Button onClick={getMicrophonePermission}>Get Microphone</Button>
        ) : null}
        {permission && recordingStatus === 'inactive' ? (
          <Button onClick={startRecording}>Start Recording</Button>
        ) : null}
        {recordingStatus === 'recording' ? (
          <Button onClick={stopRecording}>Stop Recording</Button>
        ) : null}
      </div>
      {audio ? (
        <div className="mt-4">
          <audio src={audio} controls></audio>
          <a download href={audio}>
            <Button variant="outline" className="ml-2">Download Recording</Button>
          </a>
        </div>
      ) : null}
    </div>
    </div>
  );
};

export default AudioRecorder;