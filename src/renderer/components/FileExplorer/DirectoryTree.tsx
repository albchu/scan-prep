import React, { useState, useCallback, useEffect } from 'react';
import { DirectoryEntry, IPC_CHANNELS } from '@shared/types';

interface DirectoryTreeProps {
  rootPath: string;
  currentPath: string;
  className?: string;
}

interface TreeNode extends DirectoryEntry {
  children?: TreeNode[];
  isExpanded?: boolean;
  level: number;
  fileCount?: number; // Number of supported image files in this directory
}

// Type declaration for electronAPI
declare global {
  interface Window {
    electronAPI: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
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
      d="M9 5l7 7-7 7"
    />
  </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
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
      d="M19 9l-7 7-7-7"
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

const FolderOpenIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
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
      d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
    />
  </svg>
);

export const DirectoryTree: React.FC<DirectoryTreeProps> = ({
  rootPath,
  currentPath,
  className = '',
}) => {
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());

  // Initialize tree with root directory
  useEffect(() => {
    if (rootPath) {
      loadDirectory(rootPath, 0);
    }
  }, [rootPath]);

  const loadDirectory = useCallback(async (dirPath: string, level: number) => {
    if (loadingPaths.has(dirPath)) {
      return; // Already loading
    }

    setLoadingPaths(prev => new Set(prev).add(dirPath));

    try {
      const entries = await window.electronAPI.invoke(IPC_CHANNELS.FILE_READ_DIRECTORY, dirPath);
      const directories = entries.filter((entry: DirectoryEntry) => entry.isDirectory);
      const imageFiles = entries.filter((entry: DirectoryEntry) => !entry.isDirectory && entry.isSupported);
      
      const nodes: TreeNode[] = directories.map((entry: DirectoryEntry) => ({
        ...entry,
        level,
        isExpanded: false,
        children: undefined,
        fileCount: 0 // Will be updated when directory is explored
      }));
      
      // If this is the current path, also count image files for the main view
      if (dirPath === currentPath && imageFiles.length > 0) {
        console.log(`Directory ${dirPath} contains ${imageFiles.length} image files`);
      }

      if (level === 0) {
        // Root level
        setTreeNodes(nodes);
      } else {
        // Update existing tree
        setTreeNodes(prevNodes => updateTreeNodes(prevNodes, dirPath, nodes));
      }
    } catch (error) {
      console.error('Failed to load directory for tree:', error);
    } finally {
      setLoadingPaths(prev => {
        const newSet = new Set(prev);
        newSet.delete(dirPath);
        return newSet;
      });
    }
  }, [loadingPaths]);

  const updateTreeNodes = (nodes: TreeNode[], targetPath: string, children: TreeNode[]): TreeNode[] => {
    return nodes.map(node => {
      if (node.path === targetPath) {
        return {
          ...node,
          children,
          isExpanded: true
        };
      }
      if (node.children) {
        return {
          ...node,
          children: updateTreeNodes(node.children, targetPath, children)
        };
      }
      return node;
    });
  };

  const toggleDirectory = useCallback(async (node: TreeNode) => {
    if (!node.isExpanded && !node.children) {
      // Load children for the first time
      await loadDirectory(node.path, node.level + 1);
    } else {
      // Just toggle expansion
      setTreeNodes(prevNodes => toggleNodeExpansion(prevNodes, node.path));
    }
  }, [loadDirectory]);

  const toggleNodeExpansion = (nodes: TreeNode[], targetPath: string): TreeNode[] => {
    return nodes.map(node => {
      if (node.path === targetPath) {
        return {
          ...node,
          isExpanded: !node.isExpanded
        };
      }
      if (node.children) {
        return {
          ...node,
          children: toggleNodeExpansion(node.children, targetPath)
        };
      }
      return node;
    });
  };

  // No directory selection—clicking nodes will only toggle expand/collapse
  const handleNodeClick = useCallback((node: TreeNode) => {
    if (node.isDirectory) {
      toggleDirectory(node);
    }
  }, [toggleDirectory]);

  const renderTreeNode = (node: TreeNode): React.ReactNode => {
    const isSelected = currentPath === node.path;
    const isLoading = loadingPaths.has(node.path);
    const hasChildren = node.children && node.children.length > 0;
    const canExpand = node.isDirectory;

    return (
      <div key={node.path} className="select-none">
        <div
          className={`
            flex items-center py-1 px-2 rounded-md text-sm transition-colors duration-150
            ${isSelected ? 'bg-blue-600 text-white' : 'text-dark-200 hover:bg-dark-700 hover:text-dark-100'} cursor-pointer
          `}
          style={{ paddingLeft: `${node.level * 16 + 8}px` }}
          onClick={() => handleNodeClick(node)}
        >
          {/* Expansion toggle */}
          <div 
            className="flex items-center justify-center w-4 h-4 mr-1"
            onClick={(e) => {
              e.stopPropagation();
              if (canExpand) {
                toggleDirectory(node);
              }
            }}
          >
            {canExpand && (
              <>
                {isLoading ? (
                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                ) : node.isExpanded ? (
                  <ChevronDownIcon className="w-3 h-3" />
                ) : (
                  <ChevronRightIcon className="w-3 h-3" />
                )}
              </>
            )}
          </div>

          {/* Folder icon */}
          <div className="mr-2">
            {node.isExpanded ? (
              <FolderOpenIcon className="w-4 h-4 text-blue-400" />
            ) : (
              <FolderIcon className="w-4 h-4 text-blue-400" />
            )}
          </div>

          {/* Directory name */}
          <span className="truncate font-medium">
            {node.name}
          </span>
        </div>

        {/* Children */}
        {node.isExpanded && hasChildren && (
          <div>
            {node.children!.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  if (!rootPath) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <FolderIcon className="w-8 h-8 text-dark-500 mx-auto mb-2" />
        <p className="text-dark-500 text-sm">
          No directory selected
        </p>
      </div>
    );
  }

  return (
    <div className={`overflow-y-auto ${className}`}>
      <div className="py-2">
        {treeNodes.map(node => renderTreeNode(node))}
      </div>
    </div>
  );
}; 