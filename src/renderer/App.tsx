import React, { useState, useCallback } from 'react';
import { ThreeColumnLayout } from './components/Layout/ThreeColumnLayout';
import { FileExplorer } from './components/FileExplorer/FileExplorer';
import { ImagePreview } from './components/ImagePreview/ImagePreview';
import { SubImageGrid } from './components/SubImageGrid/SubImageGrid';
import { AppProvider } from './AppContext';
import { useImageStore, ImageStoreProvider } from './stores/imageStore';

const AppContent: React.FC = () => {
  const [selectedImagePath, setSelectedImagePath] = useState<string | null>(null);
  const { viewportPreviews } = useImageStore();

  console.log('App: viewport previews from store:', viewportPreviews.length, viewportPreviews);

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
          rightColumn={<SubImageGrid viewportPreviews={viewportPreviews} />}
          minLeftWidth={250}
          minMiddleWidth={400}
          minRightWidth={300}
          initialLeftWidth={25}
          initialMiddleWidth={45}
          initialRightWidth={30}
        />
      </AppProvider>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ImageStoreProvider>
      <AppContent />
    </ImageStoreProvider>
  );
};

export default App; 