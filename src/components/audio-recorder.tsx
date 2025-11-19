import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next'; // Import the hook

type Props = {
  className?: string;
  timerClassName?: string;
  onRecordingComplete?: (audioBlob: Blob) => void;
};

const mimeType = "audio/webm"; // Define a mimeType

const AudioRecorder = ({ className, timerClassName, onRecordingComplete }: Props) => {
  const { t } = useTranslation(); // Initialize the hook
  const [permission, setPermission] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordingStatus, setRecordingStatus] = useState('inactive');
  const [audioChunks, setAudioChunks] = useState([]);
  const [audio, setAudio] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const getMicrophonePermission = async () => {
    if ('MediaRecorder' in window) {
      try {
        const streamData = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        setPermission(true);
        setStream(streamData);
      } catch (err: any) {
        alert(err.message);
      }
    } else {
      alert(t('The MediaRecorder API is not supported in your browser.'));
    }
  };

  const startRecording = async () => {
    if (!stream) return;
    setRecordingStatus('recording');
    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorderRef.current.start();

    let localAudioChunks: Blob[] = [];
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (typeof event.data === 'undefined') return;
      if (event.data.size === 0) return;
      localAudioChunks.push(event.data);
    };
    setAudioChunks(localAudioChunks);
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    setRecordingStatus('inactive');
    mediaRecorderRef.current.stop();

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: mimeType });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudio(audioUrl);
      if (onRecordingComplete) {
        onRecordingComplete(audioBlob);
      }
      setAudioChunks([]);
    };
  };

  // Clean up stream on component unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className={className}>
      <div className="flex flex-col items-center space-y-4">
        <h2 className="text-2xl font-bold">{t("Audio Recorder")}</h2>
        <div className="flex space-x-2">
          {!permission ? (
            <Button onClick={getMicrophonePermission}>{t("Get Microphone")}</Button>
          ) : null}
          {permission && recordingStatus === 'inactive' ? (
            <Button onClick={startRecording}>{t("Start Recording")}</Button>
          ) : null}
          {recordingStatus === 'recording' ? (
            <Button onClick={stopRecording}>{t("Stop Recording")}</Button>
          ) : null}
        </div>
        {audio ? (
          <div className="mt-4 flex flex-col items-center gap-4">
            <audio src={audio} controls></audio>
            <a download="recording.webm" href={audio}>
              <Button variant="outline" className="ml-2">{t("Download Recording")}</Button>
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AudioRecorder;