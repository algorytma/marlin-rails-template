import React, { useState, useEffect } from "react";
import { Plus, Trash2, Activity, Play, CheckCircle2, XCircle } from "lucide-react";

export interface SSHHost {
  alias: string;
  host: string;
  port: number;
  user: string;
}

export function SSHManager() {
  const [hosts, setHosts] = useState<SSHHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [checking, setChecking] = useState<Record<string, boolean>>({});
  const [checkResults, setCheckResults] = useState<Record<string, { ok: boolean; status: string; output?: string; details?: string }>>({});

  // Form states
  const [alias, setAlias] = useState("");
  const [hostAddr, setHostAddr] = useState("");
  const [port, setPort] = useState(22);
  const [user, setUser] = useState("root");

  const fetchHosts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ssh/hosts");
      const data = await res.json();
      if (data.ok) {
        setHosts(data.hosts);
      }
    } catch (err) {
      console.error("Failed to fetch SSH hosts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHosts();
  }, []);

  const handleAddHost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { alias, host: hostAddr, port, user };
      const res = await fetch("/api/ssh/hosts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok) {
        setShowAddForm(false);
        setAlias("");
        setHostAddr("");
        setPort(22);
        setUser("root");
        fetchHosts();
      } else {
        alert("Satın alınamadı: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Bir hata oluştu");
    }
  };

  const handleDeleteHost = async (hostAlias: string) => {
    if (!confirm(`${hostAlias} silinecek, emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/ssh/hosts/${encodeURIComponent(hostAlias)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        fetchHosts();
      } else {
        alert("Silinemedi: " + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckHost = async (hostAlias: string) => {
    setChecking((prev) => ({ ...prev, [hostAlias]: true }));
    try {
      const res = await fetch(`/api/ssh/hosts/${encodeURIComponent(hostAlias)}/check`, {
        method: "POST",
      });
      const data = await res.json();
      setCheckResults((prev) => ({ ...prev, [hostAlias]: data }));
    } catch (err: any) {
      console.error(err);
      setCheckResults((prev) => ({
        ...prev,
        [hostAlias]: { ok: false, status: "error", output: err.message },
      }));
    } finally {
      setChecking((prev) => ({ ...prev, [hostAlias]: false }));
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-background p-6 text-foreground animate-in fade-in duration-300">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Servers</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Manage your SSH endpoints and remote mission targets.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
            showAddForm
              ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {showAddForm ? <XCircle size={16} /> : <Plus size={16} />}
          {showAddForm ? "Cancel" : "Add Server"}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-8 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm animate-in slide-in-from-top-4 duration-200 fade-in">
          <div className="p-6">
            <h2 className="mb-6 text-lg font-semibold tracking-tight">New Remote Target</h2>
            <form onSubmit={handleAddHost} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Alias
                </label>
                <input
                  type="text"
                  required
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="e.g. prod-db-1"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Hostname / IP
                </label>
                <input
                  type="text"
                  required
                  value={hostAddr}
                  onChange={(e) => setHostAddr(e.target.value)}
                  placeholder="e.g. 192.168.1.100"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  User
                </label>
                <input
                  type="text"
                  required
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Port
                </label>
                <input
                  type="number"
                  required
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="col-span-1 pt-2 md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                >
                  Save Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center text-muted-foreground">
          <Activity className="animate-pulse h-6 w-6" />
        </div>
      ) : hosts.length === 0 ? (
        <div className="flex h-[300px] w-full flex-col items-center justify-center rounded-xl border border-dashed text-center animate-in fade-in duration-500">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/50 mb-4">
            <Activity className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">No servers configured</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            You don't have any SSH endpoints yet. Add a target server to manage it directly from Mission Control.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-6 inline-flex items-center justify-center whitespace-nowrap rounded-md bg-secondary text-secondary-foreground px-4 py-2 text-sm font-medium shadow-sm hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Plus className="mr-2 h-4 w-4" /> Add your first server
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {hosts.map((host) => {
            const isChecking = checking[host.alias];
            const checkRes = checkResults[host.alias];

            return (
              <div
                key={host.alias}
                className="group flex flex-col justify-between overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-accent-foreground/20 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <h3 className="font-semibold text-lg flex items-center gap-2.5">
                        <span className="relative flex h-3 w-3">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-30 ${checkRes?.ok ? 'bg-green-400' : checkRes ? 'bg-destructive' : 'bg-muted-foreground'}`}></span>
                          <span className={`relative inline-flex rounded-full h-3 w-3 ${checkRes?.ok ? 'bg-green-500' : checkRes ? 'bg-destructive' : 'bg-muted-foreground'}`}></span>
                        </span>
                        {host.alias}
                        {checkRes && (
                          <span title={checkRes.status} className="ml-1">
                            {checkRes.ok ? (
                              <CheckCircle2 size={16} className="text-green-500" />
                            ) : (
                              <XCircle size={16} className="text-destructive" />
                            )}
                          </span>
                        )}
                      </h3>
                      <div className="grid gap-1 text-sm text-muted-foreground font-mono bg-muted/30 p-2 rounded-md">
                        <p className="flex justify-between items-center"><span className="text-foreground/50 text-xs">HOST</span> {host.host}</p>
                        <p className="flex justify-between items-center"><span className="text-foreground/50 text-xs">USER</span> {host.user}</p>
                        <p className="flex justify-between items-center"><span className="text-foreground/50 text-xs">PORT</span> {host.port}</p>
                      </div>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDeleteHost(host.alias)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        title="Delete Host"
                      >
                        <Trash2 size={16} />
                        <span className="sr-only">Delete</span>
                      </button>
                    </div>
                  </div>
                  
                  {checkRes && !checkRes.ok && checkRes.output && (
                    <div className="mt-4 rounded-md bg-destructive/10 p-3 text-xs font-mono text-destructive overflow-x-auto border border-destructive/20">
                      {checkRes.output}
                      {checkRes.details && <div className="mt-2 text-[10px] opacity-80">{checkRes.details}</div>}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center p-4 pt-0">
                  <button
                    onClick={() => handleCheckHost(host.alias)}
                    disabled={isChecking}
                    className="inline-flex items-center justify-center w-full rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isChecking ? (
                      <Activity size={14} className="mr-2 animate-spin text-muted-foreground" />
                    ) : (
                      <Play size={14} className="mr-2" />
                    )}
                    {isChecking ? "Testing connection..." : "Test Connection"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
