import React, { useState, useEffect } from 'react';
import { DirectoryEntry, ViewMode, IPC_CHANNELS, APP_CONSTANTS } from '@shared/types';

interface EnhancedFileListProps {
  entries: DirectoryEntry[];
  selectedFile: string | null;
  onFileSelect: (filePath: string) => void;
  viewMode: ViewMode;
  isLoading?: boolean;
}

// Type declaration for electronAPI
declare global {
  interface Window {
    electronAPI: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
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

// Utility functions
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

const formatDimensions = (dimensions?: { width: number; height: number }): string => {
  if (!dimensions) return '';
  return `${dimensions.width} × ${dimensions.height}`;
};

// Thumbnail component
const ThumbnailImage: React.FC<{ entry: DirectoryEntry; size: number }> = ({ entry, size }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (entry.isSupported && !entry.isDirectory) {
      loadThumbnail();
    }
  }, [entry.path]);

  const loadThumbnail = async () => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      console.log('Loading thumbnail for:', entry.path, 'size:', size);
      const thumbnailData = await window.electronAPI.invoke(
        IPC_CHANNELS.FILE_GET_THUMBNAIL, 
        entry.path, 
        { size }
      );
      
      console.log('Thumbnail data received:', thumbnailData ? 'success' : 'no data');
      
      if (thumbnailData) {
        setThumbnail(thumbnailData);
      } else {
        console.warn('No thumbnail data received for:', entry.path);
        setHasError(true);
      }
    } catch (error) {
      console.error('Failed to load thumbnail for', entry.path, ':', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center bg-dark-700 rounded-md border border-dark-600"
        style={{ width: size, height: size }}
      >
        <div className="w-6 h-6 border-2 border-dark-400 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (hasError || !thumbnail) {
    return (
      <div 
        className="flex items-center justify-center bg-dark-700 rounded-md border border-dark-600"
        style={{ width: size, height: size }}
      >
        <ImageIcon className="w-8 h-8 text-dark-400" />
      </div>
    );
  }

  return (
    <div 
      className="bg-dark-700 rounded-md border border-dark-600 overflow-hidden"
      style={{ width: size, height: size }}
    >
      <img
        src={thumbnail}
        alt={entry.name}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
};

// Main component
export const EnhancedFileList: React.FC<EnhancedFileListProps> = ({
  entries,
  selectedFile,
  onFileSelect,
  viewMode,
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

  const getItemClassName = (entry: DirectoryEntry, isGridView: boolean = false) => {
    const isSelected = selectedFile === entry.path;
    const isClickable = !entry.isDirectory && entry.isSupported;
    
    let className = isGridView 
      ? 'flex flex-col items-center p-3 rounded-lg text-sm transition-all duration-150 border'
      : 'flex items-center px-3 py-2 rounded-md text-sm transition-colors duration-150';
    
    if (isSelected) {
      className = `${className} ${isGridView ? 'bg-blue-600 border-blue-500 text-white' : 'bg-blue-600 text-white'}`;
    } else if (isClickable) {
      className = `${className} ${isGridView ? 'hover:bg-dark-700 border-dark-600 text-dark-100 cursor-pointer' : 'hover:bg-dark-700 text-dark-100 cursor-pointer'}`;
    } else if (entry.isDirectory) {
      className = `${className} ${isGridView ? 'border-dark-700 text-dark-300 cursor-default' : 'text-dark-300 cursor-default'}`;
    } else {
      className = `${className} ${isGridView ? 'border-dark-700 text-dark-500 cursor-default' : 'text-dark-500 cursor-default'}`;
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

  // Thumbnail view
  if (viewMode === 'thumbnail') {
    const thumbnailSize = APP_CONSTANTS.THUMBNAIL_SIZES.MEDIUM;
    
    return (
      <div className="space-y-4">
        {/* Show count of supported images */}
        {supportedImages.length > 0 && (
          <div className="text-xs text-dark-400 px-3 py-1 border-b border-dark-700">
            {supportedImages.length} supported image{supportedImages.length !== 1 ? 's' : ''} found
          </div>
        )}

        {/* Thumbnail grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {entries.map((entry) => (
            <div
              key={entry.path}
              className={getItemClassName(entry, true)}
              onClick={() => handleItemClick(entry)}
              title={entry.isDirectory ? 'Directory' : entry.isSupported ? 'Click to select' : 'Unsupported file type'}
            >
              {/* Thumbnail or icon */}
              <div className="mb-2">
                {entry.isSupported && !entry.isDirectory ? (
                  <ThumbnailImage entry={entry} size={thumbnailSize} />
                ) : (
                  <div 
                    className="flex items-center justify-center bg-dark-700 rounded-md border border-dark-600"
                    style={{ width: thumbnailSize, height: thumbnailSize }}
                  >
                    {getItemIcon(entry)}
                  </div>
                )}
              </div>

              {/* File info */}
              <div className="text-center w-full min-w-0">
                <p className="font-medium truncate text-xs mb-1" title={entry.name}>
                  {entry.name}
                </p>
                
                <div className="text-xs text-dark-400 space-y-1">
                  {!entry.isDirectory && entry.size && (
                    <p>{formatFileSize(entry.size)}</p>
                  )}
                  {entry.dimensions && (
                    <p>{formatDimensions(entry.dimensions)}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show helpful message if no supported images */}
        {supportedImages.length === 0 && (
          <div className="text-center py-4 border-t border-dark-700">
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
  }

  // List view
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
            {entry.dimensions && (
              <span>{formatDimensions(entry.dimensions)}</span>
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