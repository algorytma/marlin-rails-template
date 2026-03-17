import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EditorPaneProps {
  filePath: string;
}

export function EditorPane({ filePath }: EditorPaneProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const { toast } = useToast();
  
  const originalContent = useRef("");

  useEffect(() => {
    if (filePath) {
      loadFile(filePath);
    }
  }, [filePath]);

  const loadFile = async (path: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vfs/read?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.ok) {
        setContent(data.content);
        originalContent.current = data.content;
        setIsDirty(false);
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to load file", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async () => {
    if (!filePath) return;
    try {
      const res = await fetch("/api/vfs/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: filePath, content }),
      });
      const data = await res.json();
      if (data.ok) {
        originalContent.current = content;
        setIsDirty(false);
        toast({ title: "Saved", description: `${filePath} saved successfully.` });
      } else {
        toast({ title: "Save Error", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Save Error", description: "Network error", variant: "destructive" });
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    const val = value || "";
    setContent(val);
    setIsDirty(val !== originalContent.current);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveFile();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [content, filePath]);

  const getLanguage = (path: string) => {
    if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript";
    if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
    if (path.endsWith(".json")) return "json";
    if (path.endsWith(".md")) return "markdown";
    if (path.endsWith(".html")) return "html";
    if (path.endsWith(".css")) return "css";
    return "plaintext";
  };

  if (!filePath) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground h-full bg-background">
        Select a file to view or edit
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full flex-1 bg-background">
      <div className="flex h-10 items-center justify-between border-b px-4 bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{filePath.split('/').pop()}</span>
          {isDirty && <span className="h-2 w-2 rounded-full bg-yellow-500" title="Unsaved changes" />}
          <span className="text-xs text-muted-foreground hidden sm:inline-block ml-2">{filePath}</span>
        </div>
        <Button size="sm" variant={isDirty ? "default" : "secondary"} onClick={saveFile} disabled={!isDirty}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>
      <div className="flex-1 pt-2">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">Loading...</div>
        ) : (
          <Editor
            height="100%"
            language={getLanguage(filePath)}
            theme="vs-dark"
            value={content}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
              padding: { top: 16 },
            }}
          />
        )}
      </div>
    </div>
  );
}
