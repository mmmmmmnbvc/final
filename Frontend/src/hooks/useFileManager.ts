import { useEffect, useState, useCallback } from 'react';

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  addedAt: Date;
  folder: string;
  url: string;
}

const API = 'http://localhost:4000/api/files';
const UPLOAD_API = 'http://localhost:4000/api/upload';
export const useFileManager = () => {
  const [folders, setFolders] = useState<string[]>([]);
const [filesInFolder, setFilesInFolder] = useState<FileItem[]>([]); 

  const [currentFolder, setCurrentFolder] = useState('/2568/');

useEffect(() => {
  fetch('http://localhost:4000/api/folders')
    .then(res => res.json())
    .then(setFolders);
}, []);

  // โหลดไฟล์จาก backend
useEffect(() => {
  if (!currentFolder) return;

  const folder = currentFolder.replace(/\//g, '');

  fetch(`${API}?folder=${folder}`)
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data)) {
        setFilesInFolder([]);
        return;
      }

      setFilesInFolder(
        data.map((f: any) => ({
          id: crypto.randomUUID(),
          name: f.name,
          size: f.size,
          type: f.type,
          addedAt: new Date(),
          folder: currentFolder,
          url: f.url,
        }))
      );
    });
}, [currentFolder]);

// ============================
// 🗑️ ลบไฟล์เดียว (Backend + State)
// ============================
const deleteFile = useCallback(async (id: string) => {
  const file = filesInFolder.find(f => f.id === id);
  if (!file) return;

  const folder = currentFolder.replace(/\//g, '');

  await fetch(
    `${API}?folder=${folder}&name=${encodeURIComponent(file.name)}`,
    { method: 'DELETE' }
  );

  // update state หลังลบ
  setFilesInFolder(prev => prev.filter(f => f.id !== id));
}, [filesInFolder, currentFolder]);

// ============================
// 🗑️ ลบไฟล์ทั้งหมดในโฟลเดอร์
// ============================
const deleteAll = useCallback(async () => {
  const folder = currentFolder.replace(/\//g, '');

  for (const file of filesInFolder) {
    await fetch(
      `${API}?folder=${folder}&name=${encodeURIComponent(file.name)}`,
      { method: 'DELETE' }
    );
  }

  setFilesInFolder([]);
}, [filesInFolder, currentFolder]);

// ============================
// 📤 Upload file
// ============================
const addFiles = useCallback(async (files: File[]) => {
  const folder = currentFolder.replace(/\//g, '');

  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    await fetch(UPLOAD_API, {
      method: "POST",
      body: formData
    });
  }

  // reload file list หลัง upload
  const res = await fetch(`${API}?folder=${folder}`);
  const data = await res.json();

  setFilesInFolder(
    data.map((f: any) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      type: f.type,
      addedAt: new Date(),
      folder: currentFolder,
      url: f.url,
    }))
  );

}, [currentFolder]);
return {
  files: folders,          // sidebar
  filesInFolder,           // กลางจอ
  currentFolder,
  setCurrentFolder,
  addFiles,
  deleteFile,              // ✅ ใส่ของจริง
  deleteAll,               // ✅ ใส่ของจริง
  createFolder: () => {},
};


};
