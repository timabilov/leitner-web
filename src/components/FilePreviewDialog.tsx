import { useEffect, useState } from "react";
import { DialogHeader, DialogTitle, Dialog, DialogContent } from "./ui/dialog";

export const FilePreviewDialog = ({ file, onClose, url, name, renderAsBlobUrl }: { file: File | null; onClose: () => void; renderAsBlobUrl?: boolean }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file && file.type === "application/pdf" && !url) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  if ((renderAsBlobUrl && !url) || (!renderAsBlobUrl && !file)) return null;

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-6xl w-6xl h-[90vh] flex flex-col">
        <DialogHeader><DialogTitle className="truncate">{name || file.name}</DialogTitle></DialogHeader>
        <div className="py-4 flex-1 h-0">
          <embed src={url || previewUrl} type="application/pdf" className="w-full h-full z-50" />
         </div>
       </DialogContent>
      </Dialog>
  );
};