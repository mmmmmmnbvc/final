import { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
}

const DropZone = ({ onFilesAdded }: DropZoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFilesAdded(files);
    },
    [onFilesAdded]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length) onFilesAdded(files);
      e.target.value = '';
    },
    [onFilesAdded]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className="cursor-pointer rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-10 text-center transition-colors hover:border-primary/60 hover:bg-primary/10"
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      <Upload className="mx-auto mb-3 h-10 w-10 text-primary/60" />
      <p className="text-lg font-medium text-foreground">
        ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
      </p>
      <p className="mt-1 text-sm text-muted-foreground">รองรับไฟล์ทุกประเภท</p>
    </motion.div>
  );
};

export default DropZone;
