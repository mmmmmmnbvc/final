import { motion } from 'framer-motion';
import { Files, HardDrive, Trash2 } from 'lucide-react';
import { FileItem, formatFileSize } from '@/lib/file-utils';

interface StatsBarProps {
  files: FileItem[];
}

const StatsBar = ({ files }: StatsBarProps) => {
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  const stats = [
    { label: 'จำนวนไฟล์', value: `${files.length} ไฟล์`, icon: Files, color: 'text-primary' },
    { label: 'ขนาดรวม', value: formatFileSize(totalSize), icon: HardDrive, color: 'text-accent' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 gap-4"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <stat.icon className={`h-8 w-8 ${stat.color}`} />
          <div>
            <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export default StatsBar;
