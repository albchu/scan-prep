import React, { useState, useEffect, useCallback } from 'react';
import { DirectoryEntry, IPC_CHANNELS } from '@shared/types';
import { HierarchicalFileRow, TreeNode } from './HierarchicalFileRow';

interface HierarchicalFileListProps {
  rootEntries: DirectoryEntry[];
  currentPath: string;
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
}

export const HierarchicalFileList: React.FC<HierarchicalFileListProps> = ({
  rootEntries,
  currentPath,
  selectedFile,
  onFileSelect,
}) => {
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState<Set<string>>(new Set());

  // Initialize root nodes when entries update
  useEffect(() => {
    const initial: TreeNode[] = rootEntries.map((e) => ({
      ...e,
      level: 0,
      isExpanded: false,
    }));
    setNodes(initial);
  }, [rootEntries]);

  const loadChildren = useCallback(async (dirPath: string, level: number) => {
    if (loading.has(dirPath)) return;
    setLoading((prev) => new Set(prev).add(dirPath));

    try {
      const entries: DirectoryEntry[] = await window.electronAPI.invoke(
        IPC_CHANNELS.FILE_READ_DIRECTORY,
        dirPath
      );
      const children: TreeNode[] = entries.map((e) => ({
        ...e,
        level,
        isExpanded: false,
      }));
      setNodes((prev) => insertChildren(prev, dirPath, children));
    } catch (err) {
      console.error('Failed to load directory children:', err);
    } finally {
      setLoading((prev) => {
        const n = new Set(prev);
        n.delete(dirPath);
        return n;
      });
    }
  }, [loading]);

  const insertChildren = (
    arr: TreeNode[],
    targetPath: string,
    children: TreeNode[]
  ): TreeNode[] => {
    return arr.flatMap((node) => {
      if (node.path === targetPath) {
        node.isExpanded = true;
        node.children = children;
        return [node, ...children];
      }
      return [node];
    });
  };

  const collapseNode = (arr: TreeNode[], targetPath: string): TreeNode[] => {
    const result: TreeNode[] = [];
    let skip = false;
    let skipLevel = 0;
    for (const node of arr) {
      if (!skip) {
        result.push(node);
        if (node.path === targetPath) {
          node.isExpanded = false;
          skip = true;
          skipLevel = node.level;
        }
      } else {
        if (node.level <= skipLevel) {
          skip = false;
          result.push(node);
        }
      }
    }
    return result;
  };

  const handleToggle = useCallback(
    (node: TreeNode) => {
      if (!node.isDirectory) return;
      if (node.isExpanded) {
        // collapse
        setNodes((prev) => collapseNode(prev, node.path));
      } else if (node.children) {
        // already loaded, just expand
        setNodes((prev) =>
          prev.map((n) => (n.path === node.path ? { ...n, isExpanded: true } : n))
        );
      } else {
        // load children
        loadChildren(node.path, node.level + 1);
      }
    },
    [loadChildren]
  );

  if (nodes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-dark-400">No files found in this directory</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <HierarchicalFileRow
          key={node.path}
          node={node}
          isSelected={selectedFile === node.path}
          isLoading={loading.has(node.path)}
          onToggle={handleToggle}
          onFileSelect={onFileSelect}
        />
      ))}
    </div>
  );
}; 