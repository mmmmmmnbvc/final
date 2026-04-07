import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, FolderOpen, Folder, Plus, PanelLeftClose, PanelLeft } from 'lucide-react';
import { FolderNode, buildFolderTree, extractFolders, FileItem, ROOT_FOLDER } from '@/lib/file-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FolderSidebarProps {
  files: string[];
  currentFolder: string;
  onFolderSelect: (path: string) => void;
  onCreateFolder: (path: string) => void;
}

const FolderTreeItem = ({
  node,
  currentFolder,
  onSelect,
  depth = 0,
}: {
  node: FolderNode;
  currentFolder: string;
  onSelect: (path: string) => void;
  depth?: number;
}) => {
  const isActive = currentFolder === node.path;
  const isAncestor = currentFolder.startsWith(node.path + '/');
  const [expanded, setExpanded] = useState(isActive || isAncestor || depth === 0);

  const hasChildren = node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => {
          onSelect(node.path);
          if (hasChildren) setExpanded((e) => !e);
        }}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent',
          isActive && 'bg-primary/10 text-primary font-medium',
          !isActive && 'text-sidebar-foreground'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 shrink-0 transition-transform',
              expanded && 'rotate-90'
            )}
          />
        ) : (
          <span className="w-3.5" />
        )}
        {isActive || isAncestor ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate">{node.name}</span>
      </button>

      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <FolderTreeItem
                key={child.path}
                node={child}
                currentFolder={currentFolder}
                onSelect={onSelect}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FolderSidebar = ({
  files,
  currentFolder,
  onFolderSelect,
  onCreateFolder,
}: FolderSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');



const handleCreate = () => {
  if (!newFolderName.trim()) return;

  const name = newFolderName.trim();

  onCreateFolder(name); // ✅ ส่งแค่ชื่อ

  const newPath = currentFolder + '/' + name;

  setNewFolderName('');
  setShowNewFolder(false);
  onFolderSelect(newPath);
};

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 border-r border-sidebar-border bg-sidebar-background px-2 py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(false)}
          className="text-sidebar-foreground"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onFolderSelect(ROOT_FOLDER)}
          className={cn(
            currentFolder === ROOT_FOLDER && 'bg-primary/10 text-primary'
          )}
        >
          <FolderOpen className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 260, opacity: 1 }}
      className="flex h-full w-[260px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar-background"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sidebar-border px-3 py-3">
        <h2 className="text-sm font-semibold text-sidebar-foreground">โฟลเดอร์</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-sidebar-foreground"
            onClick={() => setShowNewFolder((v) => !v)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-sidebar-foreground"
            onClick={() => setCollapsed(true)}
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* New folder input */}
      <AnimatePresence>
        {showNewFolder && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-sidebar-border px-3 py-2"
          >
            <p className="mb-1 text-xs text-muted-foreground">
              สร้างใน: {currentFolder}
            </p>
            <div className="flex gap-1">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="ชื่อโฟลเดอร์"
                className="h-8 text-sm"
                autoFocus
              />
              <Button size="sm" className="h-8 px-3" onClick={handleCreate}>
                สร้าง
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

<div className="flex-1 overflow-y-auto px-2 py-2">
  {files.map(folder => {
    const path = `/${folder}`;
    return (
      <button
        key={folder}
        onClick={() => onFolderSelect(path)}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm',
          path === currentFolder
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-sidebar-foreground hover:bg-sidebar-accent'
        )}
      >
        <FolderOpen className="h-4 w-4" />
        {folder}
      </button>
    );
  })}
</div>

    </motion.aside>
  );
};

export default FolderSidebar;
