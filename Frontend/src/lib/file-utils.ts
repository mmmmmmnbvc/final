export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  addedAt: Date;
  folder: string; // e.g. "/public/2568/204"
}

export const ROOT_FOLDER = '/';


export const extractFolders = (files: FileItem[]): string[] => {
  const folderSet = new Set<string>();
  folderSet.add(ROOT_FOLDER);
  files.forEach((f) => {
    // Add every ancestor folder
    const parts = f.folder.split('/').filter(Boolean);
    let path = '';
    parts.forEach((p) => {
      path += '/' + p;
      folderSet.add(path);
    });
  });
  return Array.from(folderSet).sort();
};

export interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
}

export const buildFolderTree = (folders: string[]): FolderNode => {
  const root: FolderNode = { name: 'Files', path: ROOT_FOLDER, children: [] };


  const sorted = folders.filter((f) => f !== ROOT_FOLDER).sort();
  sorted.forEach((folderPath) => {
    const relative = folderPath.replace(ROOT_FOLDER, '');
    if (!relative) return;
    const parts = relative.split('/').filter(Boolean);
    let current = root;
    let currentPath = '';
    parts.forEach((part) => {
      currentPath += '/' + part;
      let child = current.children.find((c) => c.name === part);
      if (!child) {
        child = { name: part, path: currentPath, children: [] };
        current.children.push(child);
      }
      current = child;
    });
  });

  return root;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const getFileIcon = (type: string): string => {
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎬';
  if (type.startsWith('audio/')) return '🎵';
  if (type.includes('pdf')) return '📄';
  if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
  if (type.includes('document') || type.includes('word')) return '📝';
  if (type.includes('zip') || type.includes('archive')) return '📦';
  return '📎';
};
