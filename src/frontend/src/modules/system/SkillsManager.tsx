import { useState, useEffect } from "react";
import { FileCode, Settings, FileJson, FileText, Plus } from "lucide-react";
import { EditorPane } from "../files/EditorPane";
import { Button } from "@/components/ui/button";

interface SkillFile {
  name: string;
  isDirectory: boolean;
  size: number;
}

export function SkillsManager() {
  const [skills, setSkills] = useState<SkillFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vfs/list?dir=workspace/skills");
      const data = await res.json();
      if (data.ok) {
        // Filter out directories, keep only JSON/YAML/MD for editing
        const filesOnly = data.files.filter((f: SkillFile) => !f.isDirectory);
        setSkills(filesOnly);
      }
    } catch (err) {
      console.error("Failed to fetch skills", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleCreateSkill = async () => {
    const name = window.prompt("Yeni Skill adı (örn: my-skill.json) giriniz:");
    if (!name) return;
    
    if (!name.endsWith(".json") && !name.endsWith(".yaml") && !name.endsWith(".yml")) {
      alert("Lütfen .json veya .yaml uzantılı bir dosya adı girin.");
      return;
    }

    try {
      const res = await fetch("/api/vfs/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          path: `workspace/skills/${name}`, 
          content: name.endsWith(".json") ? "{\n\n}" : "" 
        })
      });
      const data = await res.json();
      if (data.ok) {
        fetchSkills();
        setActiveFile(`workspace/skills/${name}`);
      } else {
        alert(`Hata: ${data.error}`);
      }
    } catch (err) {
      alert(`Bir hata oluştu: ${String(err)}`);
    }
  };

  return (
    <div className="flex h-full w-full bg-background overflow-hidden animate-in fade-in duration-300">
      {/* Left panel: List of Skills */}
      <div className="w-1/3 max-w-sm min-w-[250px] border-r flex flex-col bg-muted/10 overflow-hidden">
        <div className="p-4 border-b bg-card flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Skills & Agents
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Manage AI configurations</p>
          </div>
          <Button size="icon" variant="outline" onClick={handleCreateSkill} title="Add Skill">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground text-center py-8">Yükleniyor...</div>
          ) : skills.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg bg-muted/20">
              Henüz tanımlı skill yok.
            </div>
          ) : (
            skills.map((s) => {
              const fullPath = `workspace/skills/${s.name}`;
              const isActive = activeFile === fullPath;
              const ext = s.name.split('.').pop()?.toLowerCase();
              const Icon = ext === 'json' ? FileJson : ext === 'yaml' || ext === 'yml' ? FileText : FileCode;

              return (
                <div
                  key={s.name}
                  onClick={() => setActiveFile(fullPath)}
                  className={`cursor-pointer group flex items-center p-3 rounded-lg border transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md border-primary"
                      : "bg-card text-card-foreground hover:border-primary/40 hover:shadow-sm"
                  }`}
                >
                  <div className={`p-2 rounded-md shrink-0 mr-3 ${isActive ? 'bg-primary-foreground/10' : 'bg-muted'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-sm truncate">{s.name}</span>
                    <span className="text-xs opacity-70 truncate mt-0.5">
                      {(s.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel: Editor Pane */}
      <div className="flex-1 bg-background h-full flex flex-col">
        {activeFile ? (
          <EditorPane filePath={activeFile} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <FileCode className="w-16 h-16 text-muted mb-4" />
            <h3 className="text-lg font-medium text-foreground">No Skill Selected</h3>
            <p className="text-sm">Select a configuration file from the list to edit its parameters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
