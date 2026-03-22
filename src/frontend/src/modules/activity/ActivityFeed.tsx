import { useState, useEffect } from "react";
import { Activity, FileText, Settings, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ActivityEvent {
  id: string;
  timestamp: string;
  type: string;
  source: string;
  summary: string;
  details: any;
}

type FilterType = "all" | "file" | "service" | "config" | "task";

export function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/activity?limit=200");
      const data = await res.json();
      if (data.ok) {
        setEvents(data.activities);
      }
    } catch (err) {
      console.error("Failed to fetch activities", err);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    if (type.startsWith("file.")) return <FileText className="w-4 h-4" />;
    if (type.startsWith("service.health.ok")) return <CheckCircle className="w-4 h-4" />;
    if (type.startsWith("service.health.error")) return <AlertCircle className="w-4 h-4" />;
    if (type.startsWith("config.")) return <Settings className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getEventColor = (type: string) => {
    if (type.startsWith("file.")) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    if (type.startsWith("service.health.ok")) return "bg-green-500/10 text-green-500 border-green-500/20";
    if (type.startsWith("service.health.error")) return "bg-red-500/10 text-red-500 border-red-500/20";
    if (type.startsWith("config.") || type.startsWith("task.")) return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    return "bg-slate-500/10 text-slate-500 border-slate-500/20";
  };

  const filteredEvents = events.filter((e) => {
    if (filter === "all") return true;
    return e.type.startsWith(`${filter}.`);
  });

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-300">
      <div className="flex-none p-6 border-b bg-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              Activity Feed
            </h1>
            <p className="text-muted-foreground mt-1">
              System logs, file modifications, and service health events.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-md">
            {(["all", "file", "service", "config", "task"] as FilterType[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "secondary" : "ghost"}
                size="sm"
                className={`capitalize ${filter === f ? "bg-background shadow-sm" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-12 text-muted-foreground">Loading feed...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-muted/10">
              No activity events found.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((evt) => {
                const date = new Date(evt.timestamp);
                const timeStr = isNaN(date.getTime()) ? evt.timestamp : date.toLocaleString();
                
                return (
                  <div 
                    key={evt.id} 
                    onClick={() => setSelectedEvent(evt)}
                    className="group relative flex gap-4 p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-sm cursor-pointer transition-all"
                  >
                    <div className="flex-none pt-1">
                      <div className={`p-2 rounded-full border ${getEventColor(evt.type)}`}>
                        {getEventIcon(evt.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <div className="font-semibold text-sm truncate pr-4 text-foreground/90">
                          {evt.summary}
                        </div>
                        <div className="flex-none flex items-center text-xs text-muted-foreground whitespace-nowrap">
                          <Clock className="w-3 h-3 mr-1 opacity-70" />
                          {timeStr}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={`text-xs font-normal border ${getEventColor(evt.type)}`}>
                          {evt.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Source: {evt.source}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl bg-card border-none shadow-2xl glassmorphism sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {selectedEvent && (
                <div className={`p-1.5 rounded-md border ${getEventColor(selectedEvent.type)}`}>
                  {getEventIcon(selectedEvent.type)}
                </div>
              )}
              {selectedEvent?.summary}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
              <div>
                <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider">Type</span>
                <span className="font-medium">{selectedEvent?.type}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider">Source</span>
                <span className="font-medium">{selectedEvent?.source}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider">Timestamp</span>
                <span className="font-medium tabular-nums">{selectedEvent?.timestamp}</span>
              </div>
            </div>
            
            <div>
              <span className="text-muted-foreground block mb-2 text-xs uppercase tracking-wider">Details Payload</span>
              <div className="relative rounded-lg overflow-hidden border border-border/50 bg-black/80">
                <pre className="p-4 overflow-x-auto text-sm text-green-400 font-mono" style={{ maxHeight: '400px' }}>
                  {selectedEvent && JSON.stringify(selectedEvent.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
