import React, { useState, useCallback } from 'react';
import { ThreeColumnLayout } from './components/Layout/ThreeColumnLayout';
import { FileExplorer } from './components/FileExplorer/FileExplorer';
import { ImagePreviewPlaceholder } from './components/ImagePreview/ImagePreviewPlaceholder';
import { SubImageGridPlaceholder } from './components/SubImageGrid/SubImageGridPlaceholder';

const App: React.FC = () => {
  const [selectedImagePath, setSelectedImagePath] = useState<string | null>(null);

  const handleFileSelect = useCallback((filePath: string) => {
    setSelectedImagePath(filePath);
    console.log('App: File selected:', filePath);
  }, []);

  return (
    <div className="app-container">
      <ThreeColumnLayout
        leftColumn={<FileExplorer onFileSelect={handleFileSelect} />}
        middleColumn={<ImagePreviewPlaceholder selectedImage={selectedImagePath} />}
        rightColumn={<SubImageGridPlaceholder />}
      />
    </div>
  );
};

export default App; 