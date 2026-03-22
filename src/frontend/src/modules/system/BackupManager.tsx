import { useState } from "react";
import { Download, Upload, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export function BackupManager() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleExport = () => {
    // Navigate directly to trigger the file download
    window.location.href = "/setup/api/export";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleRestore = async () => {
    if (!file) return;
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append("backup", file);

    try {
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (data.ok) {
        toast({ 
            title: "Restore Successful", 
            description: "System data has been restored and the gateway is restarting.",
            variant: "default"
        });
        setFile(null);
        setDialogOpen(false);
      } else {
        toast({ 
            variant: "destructive", 
            title: "Restore Failed", 
            description: data.error || data.details || "Unknown error" 
        });
      }
    } catch (err: any) {
      toast({ 
          variant: "destructive", 
          title: "Restore Error", 
          description: err.message 
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Backup & Restore</h2>
        <p className="text-muted-foreground mt-1">
          Securely export your configuration and skills, or restore them from a previous backup.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Export Card */}
        <Card className="glassmorphism border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Export Data
            </CardTitle>
            <CardDescription>
              Download a complete archive of your system data including configurations, API keys, and custom skills.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 p-4 rounded-lg text-sm mb-6 border border-border/50">
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Zips the entire <code className="text-foreground">/data</code> volume</li>
                <li>Includes <code className="text-foreground">manifest.json</code> metadata</li>
                <li>Excludes logs, tmp, and module caches</li>
              </ul>
            </div>
            <Button onClick={handleExport} className="w-full sm:w-auto gap-2">
              <Download className="w-4 h-4" /> Download Full Archive
            </Button>
          </CardContent>
        </Card>

        {/* Restore Card */}
        <Card className="glassmorphism border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-destructive" />
              Restore Data
            </CardTitle>
            <CardDescription>
              Upload a previously downloaded archive to restore the entire system state. This is a destructive action.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 text-sm border p-2 rounded-md bg-background cursor-pointer"
                />
                <p className="text-xs text-muted-foreground ml-1">Max file size: 500MB</p>
              </div>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" disabled={!file} className="w-full sm:w-auto gap-2">
                    <AlertTriangle className="w-4 h-4" /> Restore Warning
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-5 h-5" />
                      Critical Destructive Action
                    </DialogTitle>
                    <DialogDescription className="pt-3">
                      You are about to restore system data over the current <code className="bg-muted px-1 py-0.5 rounded">/data</code>.
                      This will:
                      <ul className="list-disc list-inside mt-2 space-y-1 text-foreground/80">
                         <li>Overwrite existing skills and projects</li>
                         <li>Replace authentication settings</li>
                         <li>Restart the internal gateway</li>
                      </ul>
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="sm:justify-between mt-4">
                    <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={isUploading}>
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleRestore} 
                      disabled={isUploading}
                      className="gap-2"
                    >
                      {isUploading ? (
                        <>Uploading & Restoring...</>
                      ) : (
                        <><ShieldCheck className="w-4 h-4"/> Confirm Overwrite</>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
