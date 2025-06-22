import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium',
  message = 'Loading...' 
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className={`animate-spin rounded-full border-4 border-dark-600 border-t-green-500 ${sizeClasses[size]}`} />
      {message && (
        <p className="text-dark-300 text-sm animate-pulse">{message}</p>
      )}
    </div>
  );
}; 