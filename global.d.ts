declare global {
  interface Window {
    showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>;
  }
  // Add types for File System Access API handles
  interface FileSystemHandle {
    readonly kind: 'file' | 'directory';
    readonly name: string;
  }
  interface FileSystemFileHandle extends FileSystemHandle {
    readonly kind: 'file';
    getFile: () => Promise<File>;
    createWritable: (options?: { keepExistingData?: boolean }) => Promise<FileSystemWritableFileStream>;
  }
  interface FileSystemDirectoryHandle extends FileSystemHandle {
    readonly kind: 'directory';
    values: () => AsyncIterableIterator<FileSystemHandle>;
    getDirectoryHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemDirectoryHandle>;
    getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemFileHandle>;
  }
}
