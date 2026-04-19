import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

import {
  getFileIcon,
  formatFileSize,
} from '../lib/file-utils';

import type { FileItem } from '../lib/file-utils';

interface FileCardProps {
  file: FileItem;
  index: number;
  onDelete: (id: string) => void;
}

const FileCard = forwardRef<HTMLAnchorElement, FileCardProps>(
  ({ file, index, onDelete }, ref) => {
    return (
      <motion.a
        ref={ref}
        href={file.url}
        download
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8, y: -10 }}
        transition={{ delay: index * 0.03 }}
        className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md"
      >
        {/* Icon */}
        <span className="text-2xl">
          {getFileIcon(file.type)}
        </span>

        {/* File info */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </p>
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.preventDefault();   
            e.stopPropagation();  
            onDelete(file.id);
          }}
          className="opacity-0 transition group-hover:opacity-100 text-destructive hover:text-destructive/80"
          title="ลบไฟล์"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </motion.a>
    );
  }
);

export default FileCard;
