// Your component file, e.g., create-multi-note.tsx

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Trash } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AudioRecorderWithVisualizer } from "@/components/audio-recorder-visualiser";

// Define the shape of our recording state, now with status
type RecordingStatus = "recording" | "paused" | "inactive";
type Recording = {
  id: number;
  audioBlob: Blob | null;
  status: RecordingStatus;
};

const CreateMultiNote = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  
  const [recordings, setRecordings] = useState<Recording[]>([
    { id: Date.now(), audioBlob: null, status: "inactive" }, // Add initial status
  ]);

  const addRecorder = () => {
    setRecordings(prev => [...prev, { id: Date.now(), audioBlob: null, status: "inactive" }]);
  };

  const removeRecorder = (id: number) => {
    setRecordings(prev => prev.filter(rec => rec.id !== id));
  };
  
  const handleUpdateRecording = (id: number, audioBlob: Blob) => {
    setRecordings(prev => 
      prev.map(rec => rec.id === id ? { ...rec, audioBlob } : rec)
    );
  };

  // New handler to update the status of a specific recorder
  const handleStatusUpdate = (id: number, status: RecordingStatus) => {
    setRecordings(prev => 
      prev.map(rec => (rec.id === id ? { ...rec, status } : rec))
    );
  };
  
  const handleSave = () => {
    const completedRecordings = recordings.filter(rec => rec.audioBlob);
    console.log(`Saving ${completedRecordings.length} recordings:`, completedRecordings);
    handleClose();
  };
  
  const handleClose = () => {
    setRecordings([{ id: Date.now(), audioBlob: null, status: "inactive" }]);
    setIsOpen(false);
  };

  const canSave = recordings.some(rec => rec.audioBlob !== null);
  // Determine if any recorder is currently active (recording or paused)
  const isAnyRecordingActive = recordings.some(rec => rec.status !== 'inactive');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
          <Plus className="ml-2 h-4 w-4" />
      </DialogTrigger>

      <DialogContent className="w-6xl sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Multi-Note Recorder</DialogTitle>
        </DialogHeader>

        <div className="grid gap-8 py-4">
          {recordings.map((rec, index) => (
            <div key={rec.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <span className="font-bold text-lg text-muted-foreground">{index + 1}</span>
              <div className="flex-grow">
                <AudioRecorderWithVisualizer 
                  onRecordingComplete={(blob) => handleUpdateRecording(rec.id, blob)}
                  // Pass the new status handler to the child
                  onStatusChange={(status) => handleStatusUpdate(rec.id, status)}
                />
              </div>
              {recordings.length > 1 && (
                 <Tooltip>
                    <TooltipTrigger asChild>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         onClick={() => removeRecorder(rec.id)}
                         // Also disable removing while any recording is active
                         disabled={isAnyRecordingActive}
                         className="shrink-0"
                       >
                         <Trash className="h-4 w-4 text-destructive" />
                       </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Remove this recorder</p></TooltipContent>
                 </Tooltip>
              )}
            </div>
          ))}
          
          <Button 
            variant="outline" 
            onClick={addRecorder} 
            className="mt-4"
            // Disable this button if any recorder is currently active
            disabled={isAnyRecordingActive}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Record
          </Button>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={!canSave || isAnyRecordingActive}>
            Save {recordings.filter(r => r.audioBlob).length} Note(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMultiNote;