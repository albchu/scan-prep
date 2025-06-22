import React from 'react';
import { DirectoryEntry } from '@shared/types';

interface BasicFileListProps {
  entries: DirectoryEntry[];
  selectedFile: string | null;
  onFileSelect: (filePath: string) => void;
  isLoading?: boolean;
}

// File type icons
const FileIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const ImageIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const FolderIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z"
    />
  </svg>
);

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (date: Date): string => {
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

export const BasicFileList: React.FC<BasicFileListProps> = ({
  entries,
  selectedFile,
  onFileSelect,
  isLoading = false
}) => {
  const handleItemClick = (entry: DirectoryEntry) => {
    // Only allow selection of supported image files
    if (!entry.isDirectory && entry.isSupported) {
      onFileSelect(entry.path);
    }
  };

  const getItemIcon = (entry: DirectoryEntry) => {
    if (entry.isDirectory) {
      return <FolderIcon className="w-5 h-5 text-blue-400" />;
    }
    
    if (entry.isSupported) {
      return <ImageIcon className="w-5 h-5 text-green-400" />;
    }
    
    return <FileIcon className="w-5 h-5 text-dark-400" />;
  };

  const getItemClassName = (entry: DirectoryEntry) => {
    const isSelected = selectedFile === entry.path;
    const isClickable = !entry.isDirectory && entry.isSupported;
    
    let className = 'flex items-center px-3 py-2 rounded-md text-sm transition-colors duration-150';
    
    if (isSelected) {
      className = `${className} bg-blue-600 text-white`;
    } else if (isClickable) {
      className = `${className} hover:bg-dark-700 text-dark-100 cursor-pointer`;
    } else if (entry.isDirectory) {
      className = `${className} text-dark-300 cursor-default`;
    } else {
      className = `${className} text-dark-500 cursor-default`;
    }
    
    return className;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-2 border-dark-300 border-t-blue-500 rounded-full" />
        <span className="ml-3 text-dark-300">Loading directory...</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <FolderIcon className="w-12 h-12 text-dark-500 mx-auto mb-3" />
        <p className="text-dark-400">No files found in this directory</p>
      </div>
    );
  }

  // Separate supported images for easier viewing
  const supportedImages = entries.filter(entry => !entry.isDirectory && entry.isSupported);

  return (
    <div className="space-y-1">
      {/* Show count of supported images */}
      {supportedImages.length > 0 && (
        <div className="text-xs text-dark-400 px-3 py-1 border-b border-dark-700 mb-2">
          {supportedImages.length} supported image{supportedImages.length !== 1 ? 's' : ''} found
        </div>
      )}

      {/* Render all entries */}
      {entries.map((entry) => (
        <div
          key={entry.path}
          className={getItemClassName(entry)}
          onClick={() => handleItemClick(entry)}
          title={entry.isDirectory ? 'Directory' : entry.isSupported ? 'Click to select' : 'Unsupported file type'}
        >
          <div className="flex items-center flex-1 min-w-0">
            {getItemIcon(entry)}
            <span className="ml-3 truncate font-medium">
              {entry.name}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-dark-400 ml-3">
            {!entry.isDirectory && entry.size && (
              <span>{formatFileSize(entry.size)}</span>
            )}
            {entry.lastModified && (
              <span>{formatDate(entry.lastModified)}</span>
            )}
          </div>
        </div>
      ))}

      {/* Show helpful message if no supported images */}
      {supportedImages.length === 0 && (
        <div className="text-center py-4 border-t border-dark-700 mt-4">
          <ImageIcon className="w-8 h-8 text-dark-500 mx-auto mb-2" />
          <p className="text-dark-500 text-sm">
            No supported image files found
          </p>
          <p className="text-dark-600 text-xs mt-1">
            Supported formats: JPEG, PNG, TIFF
          </p>
        </div>
      )}
    </div>
  );
}; 