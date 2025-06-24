import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DirectoryEntry } from '@shared/types';
import { IPC_CHANNELS } from '@shared/constants';
import { HierarchicalFileRow, TreeNode } from './HierarchicalFileRow';

interface Props {
  rootEntries: DirectoryEntry[];
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
}

export const HierarchicalFileList: React.FC<Props> = ({
  rootEntries,
  selectedFile,
  onFileSelect,
}) => {
  // Tree-structured state; keeps children regardless of collapsed state
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState<Set<string>>(new Set());

  // Initialize root tree when entries change
  useEffect(() => {
    setTree(
      rootEntries.map((e) => ({
        ...e,
        level: 0,
        isExpanded: false,
      }))
    );
  }, [rootEntries]);

  const updateNodeByPath = useCallback(
    (nodes: TreeNode[], targetPath: string, updater: (n: TreeNode) => TreeNode): TreeNode[] => {
      return nodes.map((n) => {
        if (n.path === targetPath) return updater(n);
        if (n.children) {
          return { ...n, children: updateNodeByPath(n.children, targetPath, updater) };
        }
        return n;
      });
    },
    []
  );

  const loadChildren = useCallback(
    async (dirPath: string, level: number) => {
      if (loading.has(dirPath)) return;
      setLoading((prev) => new Set(prev).add(dirPath));

      try {
        const entries = await window.electronAPI.invoke(
          IPC_CHANNELS.FILE_READ_DIRECTORY,
          dirPath
        ) as DirectoryEntry[];
        const children: TreeNode[] = entries.map((e) => ({
          ...e,
          level,
          isExpanded: false,
        }));

        setTree((prev) =>
          updateNodeByPath(prev, dirPath, (n) => ({ ...n, isExpanded: true, children }))
        );
      } catch (err) {
        console.error('Failed to load directory children:', err);
      } finally {
        setLoading((prev) => {
          const n = new Set(prev);
          n.delete(dirPath);
          return n;
        });
      }
    },
    [loading, updateNodeByPath]
  );

  const handleToggle = useCallback(
    (node: TreeNode) => {
      if (!node.isDirectory) return;

      if (node.isExpanded) {
        // Collapse – simply mark isExpanded false; keep children cached
        setTree((prev) => updateNodeByPath(prev, node.path, (n) => ({ ...n, isExpanded: false })));
      } else if (node.children) {
        // Re-expand cached children
        setTree((prev) => updateNodeByPath(prev, node.path, (n) => ({ ...n, isExpanded: true })));
      } else {
        // Need to load
        loadChildren(node.path, node.level + 1);
      }
    },
    [loadChildren, updateNodeByPath]
  );

  // Flatten tree for rendering
  const flatList = useMemo(() => {
    const list: TreeNode[] = [];
    const traverse = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        list.push(n);
        if (n.isExpanded && n.children) traverse(n.children);
      }
    };
    traverse(tree);
    return list;
  }, [tree]);

  if (flatList.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-dark-400">No files found in this directory</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {flatList.map((node) => (
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