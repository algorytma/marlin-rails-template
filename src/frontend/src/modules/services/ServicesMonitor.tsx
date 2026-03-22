import { useState, useEffect } from "react";
import { Activity, Server, Settings, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

export interface ServiceStatus {
  id: string;
  name: string;
  type: string;
  status: "ok" | "error";
  lastCheck: string;
  message: string;
}

export function ServicesMonitor() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/services/status");
      const data = await res.json();
      if (data.ok) {
        setServices(data.services || []);
      }
    } catch (err) {
      console.error("Failed to fetch services status", err);
    } finally {
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "gateway":
        return <Server className="h-6 w-6 text-indigo-500" />;
      case "llm":
        return <Activity className="h-6 w-6 text-blue-500" />;
      case "ssh":
        return <Server className="h-6 w-6 text-orange-500" />;
      default:
        return <Settings className="h-6 w-6 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6 text-muted-foreground">
        <Activity className="h-8 w-8 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-background p-6 text-foreground animate-in fade-in duration-300">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Services</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Real-time health monitoring of gateways, LLMs, and SSH endpoints.
          </p>
        </div>
      </div>

      {services.length === 0 ? (
        <div className="flex h-[300px] w-full flex-col items-center justify-center rounded-xl border border-dashed text-center">
          <Activity className="h-10 w-10 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold tracking-tight">No services found</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Health scheduler hasn't registered any services yet or is still booting up.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((svc) => (
            <div
              key={svc.id}
              className={`group flex flex-col justify-between overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md animate-in fade-in zoom-in-95 duration-300 ${
                svc.status === 'error' ? 'border-destructive/40 hover:border-destructive/80' : 'hover:border-primary/20'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${svc.status === 'ok' ? 'bg-secondary' : 'bg-destructive/10'}`}>
                      {getIcon(svc.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base leading-none">{svc.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{svc.type}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    svc.status === 'ok' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-destructive/10 text-destructive'
                  }`}>
                    {svc.status === 'ok' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    {svc.status === 'ok' ? 'CONNECTED' : 'ERROR'}
                    
                    {/* Ping dot animation */}
                    <span className="relative flex h-2 w-2 ml-1">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        svc.status === 'ok' ? 'bg-green-400' : 'bg-destructive'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${
                        svc.status === 'ok' ? 'bg-green-500' : 'bg-destructive'
                      }`}></span>
                    </span>
                  </div>
                </div>

                <div className="mb-2">
                  <p className="text-sm font-medium leading-none line-clamp-2" title={svc.message}>
                    {svc.message || "No status message"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground/70">
                    Last check: {new Date(svc.lastCheck).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {svc.status === 'error' && (
                <div className="border-t bg-muted/30 p-3 flex justify-end">
                  <button 
                    onClick={() => {
                      // Custom routing logic based on error type could go here
                      alert(`Action: Redirecting to fix ${svc.name}`);
                    }}
                    className="inline-flex items-center justify-center text-xs font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-muted-foreground hover:bg-muted p-1.5 gap-1 rounded-md"
                  >
                    Go to config <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
