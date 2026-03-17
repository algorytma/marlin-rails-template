import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, FileText, ChevronRight, ChevronDown } from "lucide-react";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
  mtime?: number;
  children?: FileNode[];
  isOpen?: boolean;
}

interface FileTreeProps {
  basePath?: string;
  onFileSelect: (path: string) => void;
}

export function FileTree({ basePath = "/workspace", onFileSelect }: FileTreeProps) {
  const [tree, setTree] = useState<FileNode[]>([]);
  useEffect(() => {
    loadDir(basePath).then(setTree);
  }, [basePath]);

  const loadDir = async (path: string): Promise<FileNode[]> => {
    try {
      const res = await fetch(`/api/vfs/list?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.ok && data.items) {
        return data.items.sort((a: FileNode, b: FileNode) => {
          if (a.type === "dir" && b.type === "file") return -1;
          if (a.type === "file" && b.type === "dir") return 1;
          return a.name.localeCompare(b.name);
        });
      }
      return [];
    } catch (err) {
      console.error("Failed to load dir", err);
      return [];
    }
  };

  const toggleDir = async (node: FileNode, currentTree: FileNode[]) => {
    const updateNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((n) => {
        if (n.path === node.path) {
          return { ...n, isOpen: !n.isOpen, children: n.children };
        }
        if (n.children) {
          return { ...n, children: updateNode(n.children) };
        }
        return n;
      });
    };

    let newTree = updateNode(currentTree);
    
    // If opening and no children loaded
    if (!node.isOpen && !node.children) {
       const children = await loadDir(node.path);
       newTree = newTree.map(n => {
         const injectChildren = (items: FileNode[]): FileNode[] => {
           return items.map(item => {
             if (item.path === node.path) return { ...item, children, isOpen: true };
             if (item.children) return { ...item, children: injectChildren(item.children) };
             return item;
           });
         };
         return injectChildren([n])[0];
       });
    }

    setTree(newTree);
  };

  const renderNode = (node: FileNode, depth = 0) => {
    return (
      <div key={node.path}>
        <div
          className="flex items-center gap-1.5 py-1 px-2 hover:bg-accent rounded-sm cursor-pointer text-sm"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (node.type === "dir") {
              toggleDir(node, tree);
            } else {
              onFileSelect(node.path);
            }
          }}
        >
          {node.type === "dir" ? (
            node.isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
          ) : (
            <span className="w-3" /> 
          )}
          {node.type === "dir" ? (
             <Folder className="h-4 w-4 text-blue-400" />
          ) : (
             <FileText className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="truncate">{node.name}</span>
        </div>
        {node.type === "dir" && node.isOpen && node.children && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <ScrollArea className="h-full border-r w-64 flex-shrink-0 bg-muted/10">
      <div className="p-2">
        <div className="text-xs font-semibold text-muted-foreground mb-2 px-2 uppercase tracking-wider">
          Explorer
        </div>
        {tree.map((node) => renderNode(node, 0))}
      </div>
    </ScrollArea>
  );
}
