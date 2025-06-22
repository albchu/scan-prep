import React, { useState, useCallback } from 'react';
import { ThreeColumnLayout } from './components/Layout/ThreeColumnLayout';
import { FileExplorer } from './components/FileExplorer/FileExplorer';
import { ImagePreview } from './components/ImagePreview/ImagePreview';
import { SubImageGridPlaceholder } from './components/SubImageGrid/SubImageGridPlaceholder';
import { AppProvider } from './AppContext';

const App: React.FC = () => {
  const [selectedImagePath, setSelectedImagePath] = useState<string | null>(null);

  const handleFileSelect = useCallback((filePath: string) => {
    setSelectedImagePath(filePath);
    console.log('App: File selected:', filePath);
  }, []);

  return (
    <div className="app-container">
      <AppProvider onFileSelect={handleFileSelect}>
        <ThreeColumnLayout
          leftColumn={<FileExplorer />}
          middleColumn={<ImagePreview selectedImage={selectedImagePath} />}
          rightColumn={<SubImageGridPlaceholder />}
        />
      </AppProvider>
    </div>
  );
};

export default App; 