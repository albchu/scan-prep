import React from 'react';
import { ViewportPreviewResult } from '@shared/types';
import { ViewportPreview } from './ViewportPreview';
import { SubImageGridPlaceholder } from './SubImageGridPlaceholder';

interface SubImageGridProps {
  viewportPreviews: ViewportPreviewResult[];
}

export const SubImageGrid: React.FC<SubImageGridProps> = ({
  viewportPreviews
}) => {
  console.log('SubImageGrid received viewport previews:', viewportPreviews.length, viewportPreviews);
  
  if (viewportPreviews.length === 0) {
    return <SubImageGridPlaceholder />;
  }

  return (
    <div className="sub-image-grid">
      <div className="grid-header">
        <h3 className="text-lg font-medium text-dark-100">
          Detected Regions ({viewportPreviews.length})
        </h3>
      </div>
      <div className="grid-container">
        {viewportPreviews.map((preview) => (
          <ViewportPreview
            key={preview.id}
            viewportPreview={preview}
          />
        ))}
      </div>
    </div>
  );
}; 