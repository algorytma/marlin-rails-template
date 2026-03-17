import { useState } from "react";
import { FileTree } from "./FileTree";
import { EditorPane } from "./EditorPane";

export function FileExplorer() {
  const [activeFile, setActiveFile] = useState<string>("");

  return (
    <div className="flex h-full w-full overflow-hidden">
      <FileTree onFileSelect={setActiveFile} />
      <EditorPane filePath={activeFile} />
    </div>
  );
}
