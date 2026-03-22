import { useState } from "react";
import { Settings, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkillsManager } from "./SkillsManager";
import { BackupManager } from "./BackupManager";

export function SystemDashboard() {
  const [activeTab, setActiveTab] = useState<"skills" | "backup">("skills");

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex-none p-4 border-b bg-card flex items-center gap-2">
         <Button 
           variant={activeTab === "skills" ? "secondary" : "ghost"} 
           size="sm"
           onClick={() => setActiveTab("skills")}
           className="gap-2"
         >
            <Settings className="w-4 h-4" /> Skills & Config
         </Button>
         <Button 
           variant={activeTab === "backup" ? "secondary" : "ghost"} 
           size="sm"
           onClick={() => setActiveTab("backup")}
           className="gap-2"
         >
            <Database className="w-4 h-4" /> Backup & Restore
         </Button>
      </div>
      <div className="flex-1 overflow-hidden relative">
         {activeTab === "skills" && <SkillsManager />}
         {activeTab === "backup" && (
           <div className="h-full overflow-y-auto">
             <BackupManager />
           </div>
         )}
      </div>
    </div>
  );
}
