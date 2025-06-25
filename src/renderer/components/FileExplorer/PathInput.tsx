import React, { useState, useRef, useEffect } from 'react';
import { validatePathIpc } from '../../services/ipc-requests';

interface PathInputProps {
  currentPath: string;
  onPathChange: (path: string) => void;
  onPathValidation: (isValid: boolean, error?: string) => void;
}

// Check mark icon for valid paths
const CheckIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
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
      d="M5 13l4 4L19 7"
    />
  </svg>
);

// Warning icon for invalid paths
const WarningIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
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
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.382 16.5c-.77.833.192 2.5 1.732 2.5z"
    />
  </svg>
);

export const PathInput: React.FC<PathInputProps> = ({
  currentPath,
  onPathChange,
  onPathValidation
}) => {
  const [inputValue, setInputValue] = useState(currentPath);
  const [isValidating, setIsValidating] = useState(false);
  const [validationState, setValidationState] = useState<{
    isValid: boolean | null;
    error?: string;
  }>({ isValid: null });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const validationTimeoutRef = useRef<NodeJS.Timeout>();

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Update input value when currentPath prop changes
  useEffect(() => {
    setInputValue(currentPath);
  }, [currentPath]);

  const validatePath = async (path: string) => {
    if (!path.trim()) {
      setValidationState({ isValid: false, error: 'Please enter a directory path' });
      onPathValidation(false, 'Please enter a directory path');
      return;
    }

    // Store current focus state
    const hadFocus = inputRef.current === document.activeElement;
    
    setIsValidating(true);
    
    try {
      const result = await validatePathIpc(path.trim());
      
      setValidationState({
        isValid: result.isValid,
        error: result.error
      });
      
      onPathValidation(result.isValid, result.error);
      
      if (result.isValid) {
        onPathChange(path.trim());
      }
    } catch (error) {
      console.error('Path validation failed:', error);
      const errorMessage = 'Failed to validate path';
      setValidationState({ isValid: false, error: errorMessage });
      onPathValidation(false, errorMessage);
    } finally {
      setIsValidating(false);
      
      // Restore focus if the input had focus before validation
      if (hadFocus && inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Clear previous validation timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    // Reset validation state while typing
    setValidationState({ isValid: null });
    
    // Debounce validation - validate after user stops typing for 800ms
    validationTimeoutRef.current = setTimeout(() => {
      validatePath(newValue);
    }, 800);
  };





  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Clear debounced validation and validate immediately
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      validatePath(inputValue);
    }
    
    // Handle Cmd+A (Mac) and Ctrl+A (Windows/Linux) to select all text
    if ((e.metaKey && e.key === 'a') || (e.ctrlKey && e.key === 'a')) {
      e.preventDefault();
      if (inputRef.current) {
        inputRef.current.select();
      }
      return;
    }
    
    // Handle Cmd+V (Mac) and Ctrl+V (Windows/Linux) manually
    if ((e.metaKey && e.key === 'v') || (e.ctrlKey && e.key === 'v')) {
      e.preventDefault(); // Prevent default to handle it ourselves
      console.log('Paste detected - using clipboard API');
      
      try {
        // Read from clipboard
        const clipboardText = await navigator.clipboard.readText();
        console.log('Clipboard content:', clipboardText);
        
        // Update input value
        setInputValue(clipboardText);
        
        // Clear any pending validation
        if (validationTimeoutRef.current) {
          clearTimeout(validationTimeoutRef.current);
        }
        
        // Reset validation state
        setValidationState({ isValid: null });
        
        // Validate immediately
        validatePath(clipboardText);
        
        // Keep focus on the input
        if (inputRef.current) {
          inputRef.current.focus();
        }
      } catch (error) {
        console.error('Failed to read clipboard:', error);
        // Fallback: let the browser handle it normally
        // Don't prevent default in this case
      }
    }
  };

  const handleBlur = () => {
    // Only validate on blur if there's actually a value and it's different from current path
    if (inputValue.trim() && inputValue.trim() !== currentPath) {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      validatePath(inputValue);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  const getValidationIcon = () => {
    if (isValidating) {
      return (
        <div className="animate-spin h-5 w-5 border-2 border-dark-300 border-t-blue-500 rounded-full" />
      );
    }
    
    if (validationState.isValid === true) {
      return <CheckIcon className="w-5 h-5 text-green-500" />;
    }
    
    if (validationState.isValid === false) {
      return <WarningIcon className="w-5 h-5 text-red-500" />;
    }
    
    return null;
  };

  const getInputClassName = () => {
    const baseClass = 'w-full px-3 py-2 pr-10 bg-dark-800 border rounded-md text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    
    if (validationState.isValid === true) {
      return `${baseClass} border-green-500`;
    }
    
    if (validationState.isValid === false) {
      return `${baseClass} border-red-500`;
    }
    
    return `${baseClass} border-dark-600`;
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-dark-200">
        Directory Path
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Enter directory path..."
          className={getInputClassName()}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {getValidationIcon()}
        </div>
      </div>
      
      {validationState.error && (
        <p className="text-sm text-red-500 mt-1">
          {validationState.error}
        </p>
      )}
      
      {validationState.isValid === true && (
        <p className="text-sm text-green-500 mt-1">
          Directory is valid and accessible
        </p>
      )}
    </div>
  );
}; 