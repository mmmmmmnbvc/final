import { AnimatePresence, motion } from 'framer-motion';
import { FolderOpen, Trash2, ChevronRight } from 'lucide-react';
import { useFileManager as useFileManager } 
  from '@/hooks/useFileManager';

import DropZone from '@/components/DropZone';
import FileCard from '@/components/FileCard';
import StatsBar from '@/components/StatsBar';
import FolderSidebar from '@/components/FolderSidebar';
import { Button } from '@/components/ui/button';
import { ROOT_FOLDER } from '@/lib/file-utils';
import { useEffect } from "react";
const Updates = () => {
  const {
    files,
    filesInFolder,
    currentFolder,
    setCurrentFolder,
    addFiles,
    deleteFile,
    deleteAll,
    createFolder,
  } = useFileManager();

  // Breadcrumb parts
  const breadcrumbParts = currentFolder.split('/').filter(Boolean);
   useEffect(() => {
    // เปิด Light Mode ตอนเข้า page
    document.documentElement.classList.add("station-light");

    // ลบออกตอนออกจาก page (สำคัญมาก)
    return () => {
      document.documentElement.classList.remove("station-light");
    };
  }, []);
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <FolderSidebar
        files={files}
        currentFolder={currentFolder}
        onFolderSelect={setCurrentFolder}
        onCreateFolder={createFolder}
      />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                <FolderOpen className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">จัดการไฟล์</h1>
                <p className="text-xl text-muted-foreground">เพิ่ม ลบ และดูรายการไฟล์ตามโฟลเดอร์</p>
              </div>
            </div>
            {filesInFolder.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={deleteAll}
                className="gap-1.5 text-destructive text-xl border-destructive/30 hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 " />
                ลบทั้งหมด
              </Button>
            )}
            {filesInFolder.length > 0 && (
<Button
  variant="outline"
  size="sm"
  onClick={async () => {
    try {
      // const res = await fetch("http://localhost:4000/api/convert", {
      const res = await fetch("https://covered-telephone-editorials-sheep.trycloudflare.com/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // folder: currentFolder, // ✅ สำคัญ
          folder: currentFolder.replace(/^\//, '')
        }),
      });

      const data = await res.json();
      console.log(data);

      alert(`✅ สำเร็จ\n\n${data.output}`);

    } catch (err) {
      console.error(err);
      alert("❌ แปลงไม่สำเร็จ");
    }
  }}
  className="gap-1.5 text-sky-600 border-sky-600 hover:bg-destructive/10 text-xl"
>
  {/* <Trash2 className="h-4 w-4" /> */}
  แปลงข้อมูลเป็น CSV
</Button>
            )}
          </motion.div>

          {/* Breadcrumb */}
          <div className="mb-4 flex items-center gap-1 text-sm">
            {breadcrumbParts.map((part, i) => {
              const path = '/' + breadcrumbParts.slice(0, i + 1).join('/');
              const isLast = i === breadcrumbParts.length - 1;
              return (
                <span key={path} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  <button
                    onClick={() => setCurrentFolder(path)}
                    className={
                      isLast
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground hover:text-foreground transition-colors'
                    }
                  >
                    {part}
                  </button>
                </span>
              );
            })}
          </div>

          {/* Stats */}
          <div className="mb-6">
            <StatsBar files={filesInFolder} />
          </div>

          {/* Drop Zone */}
          <div className="mb-6">
            <DropZone onFilesAdded={addFiles} />
          </div>

          {/* File List */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filesInFolder.map((file, i) => (
                <FileCard key={file.id} file={file} index={i} onDelete={deleteFile} />
              ))}
            </AnimatePresence>

            {filesInFolder.length === 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center text-muted-foreground"
              >
              </motion.p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Updates;
