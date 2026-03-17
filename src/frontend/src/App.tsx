import { useState } from 'react';
import { MainShell } from './components/layout/MainShell';
import { FileExplorer } from './modules/files/FileExplorer';
import { SSHManager } from './modules/ssh/SSHManager';
import { Toaster } from './components/ui/toaster';

export default function App() {
  const [activeTab, setActiveTab] = useState("files");

  const renderContent = () => {
    switch (activeTab) {
      case "files":
        return <FileExplorer />;
      case "servers":
        return <SSHManager />;
      case "activity":
      case "services":
      case "projects":
      case "system":
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} module coming soon.
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <MainShell activeTab={activeTab} onTabChange={setActiveTab}>
        {renderContent()}
      </MainShell>
      <Toaster />
    </>
  );
}
