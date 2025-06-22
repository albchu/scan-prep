import React from 'react';
import { ThreeColumnLayout } from './components/Layout/ThreeColumnLayout';
import { FileExplorerPlaceholder } from './components/FileExplorer/FileExplorerPlaceholder';
import { ImagePreviewPlaceholder } from './components/ImagePreview/ImagePreviewPlaceholder';
import { SubImageGridPlaceholder } from './components/SubImageGrid/SubImageGridPlaceholder';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <ThreeColumnLayout
        leftColumn={<FileExplorerPlaceholder />}
        middleColumn={<ImagePreviewPlaceholder />}
        rightColumn={<SubImageGridPlaceholder />}
      />
    </div>
  );
};

export default App; 