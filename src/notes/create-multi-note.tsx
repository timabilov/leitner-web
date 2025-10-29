"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash, UploadCloud, X, FileText, File, CircleAlert, Volume2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { AudioRecorderWithVisualizer } from "@/components/audio-recorder-visualiser"; // Adjust path if needed
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'



// --- Type Definitions ---
type RecordingStatus = "recording" | "paused" | "inactive";
type Recording = {
  id: number;
  audioBlob: Blob | null;
  status: RecordingStatus;
};

// --- Main Component ---
const CreateMultiNote = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  
  // --- State Management ---
  const [noteText, setNoteText] = useState<string>("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([
    { id: Date.now(), audioBlob: null, status: "inactive" },
  ]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null); // For PDF preview dialog
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---
  const addRecorder = () => setRecordings(prev => [...prev, { id: Date.now(), audioBlob: null, status: "inactive" }]);
  const removeRecorder = (id: number) => setRecordings(prev => prev.filter(rec => rec.id !== id));
  const handleUpdateRecording = (id: number, audioBlob: Blob) => setRecordings(prev => prev.map(rec => rec.id === id ? { ...rec, audioBlob } : rec));
  const handleStatusUpdate = (id: number, status: RecordingStatus) => setRecordings(prev => prev.map(rec => (rec.id === id ? { ...rec, status } : rec)));
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const acceptedFiles = Array.from(files).filter(file => 
      file.type.startsWith("image/") || 
      file.type.startsWith("audio/") || 
      file.type === "application/pdf"
    );
    setAttachedFiles(prev => [...prev, ...acceptedFiles]);
  };
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => handleFiles(event.target.files);
  const handleRemoveFile = (fileIndex: number) => setAttachedFiles(prev => prev.filter((_, index) => index !== fileIndex));
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(false); };
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(false); handleFiles(event.dataTransfer.files); };
  
  const handleSave = () => {
    const finalNote = {
      text: noteText,
      attachedFiles: attachedFiles,
      liveRecordings: recordings.filter(rec => rec.audioBlob),
    };
    console.log("Saving Note:", finalNote);
    handleClose();
  };
  
  const handleClose = () => {
    setNoteText("");
    setAttachedFiles([]);
    setRecordings([{ id: Date.now(), audioBlob: null, status: "inactive" }]);
    setIsOpen(false);
  };

  const isAnyRecordingActive = recordings.some(rec => rec.status !== 'inactive');
  const canSave = !isAnyRecordingActive && (noteText.trim() !== '' || attachedFiles.length > 0 || recordings.some(r => r.audioBlob));

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
            <Plus className="ml-2 h-4 w-4" />
        </DialogTrigger>

        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create a New Note</DialogTitle></DialogHeader>

          <div className="grid gap-8 py-4">
            {/* Textarea Section */}
            <div className="grid gap-2">
              <Label htmlFor="note-text" className="font-semibold">Note Content</Label>
              <Textarea id="note-text" placeholder="Type your notes here..." value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} disabled={isAnyRecordingActive} />
            </div>

            {/* File Attachment Section */}
            <div className="grid gap-2">
              <Label className="font-semibold">Attach Files</Label>
              <div
                className={cn("flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors", isDragging ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50")}
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="w-8 h-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-muted-foreground">Images, Audio, or PDF files</p>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,audio/*" multiple onChange={handleFileSelect} />
              </div>
              {attachedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium text-sm">Attached files:</h4>
                  <ul className="grid gap-3">
                    {attachedFiles.map((file, index) => (
                      <FilePreview 
                        key={`${file.name}-${index}`} 
                        file={file} 
                        onRemove={() => handleRemoveFile(index)} 
                        onPreview={() => setPreviewFile(file)} 
                      />
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Live Recorders Section */}
            <div className="grid gap-2">
              <Label className="font-semibold">Live Recordings</Label>
              {
                recordings.find(recording => recording.status === 'recording') && (
                    <Alert className='border-sky-700/10 bg-sky-600/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400'>
                        <Volume2 />
                        <AlertTitle>Hey, can you speak up a bit?  We’ll ping you if we miss anything!</AlertTitle>
                        </Alert>
                )
              }

              {recordings.map((rec, index) => (
                <div key={rec.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-grow">
                    <AudioRecorderWithVisualizer onRecordingComplete={(blob) => handleUpdateRecording(rec.id, blob)} onStatusChange={(status) => handleStatusUpdate(rec.id, status)} />
                  </div>
                  {recordings.length > 1 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => removeRecorder(rec.id)} disabled={isAnyRecordingActive} className="shrink-0">
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Remove recorder</p></TooltipContent>
                    </Tooltip>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={addRecorder} className="mt-4" disabled={isAnyRecordingActive}>
                <Plus className="mr-2 h-4 w-4" />
                Add Another Record
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={!canSave}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <FilePreviewDialog
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </>
  );
};


const FilePreview = ({ file, onRemove, onPreview }: { file: File; onRemove: () => void; onPreview: () => void; }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isPdf = file.type === "application/pdf";
  const isImage = file.type.startsWith("image/");
  
  useEffect(() => {
    if (isImage || file.type.startsWith("audio/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const renderPreview = () => {
    if (isImage && previewUrl) {
      return ( 
        <Zoom>
          <img src={previewUrl} alt={file.name} className="w-16 h-16 object-cover rounded-md" />
        </Zoom>
      );
    }
    if (file.type.startsWith("audio/") && previewUrl) {
      return <audio src={previewUrl} controls className="h-10 w-full max-w-xs" />;
    }
    const Icon = isPdf ? FileText : File;
    return (
      <div 
        onClick={isPdf ? onPreview : undefined}
        className={cn("w-16 h-16 flex items-center justify-center bg-secondary rounded-md", isPdf && "cursor-pointer hover:bg-secondary/80")}
      >
        <Icon className="w-8 h-8 text-secondary-foreground" />
      </div>
    );
  };

  return (
    <li className="flex items-center justify-between p-2 bg-muted rounded-lg gap-4">
      <div className="shrink-0">{renderPreview()}</div>
      <div className="flex-grow min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Remove file</p></TooltipContent>
      </Tooltip>
    </li>
  );
};

const FilePreviewDialog = ({ file, onClose }: { file: File | null; onClose: () => void; }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file && file.type === "application/pdf") {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  if (!file || !previewUrl || file.type !== "application/pdf") return null;

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-6xl w-6xl h-[90vh] flex flex-col">
        <DialogHeader><DialogTitle className="truncate">{file.name}</DialogTitle></DialogHeader>
        <div className="py-4 flex-1 h-0">
          <embed src={previewUrl} type="application/pdf" className="w-full h-full z-50" />
         </div>
       </DialogContent>
        </Dialog>
  );
};

export default CreateMultiNote;
