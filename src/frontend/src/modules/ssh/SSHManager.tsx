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
    <div className="flex h-full w-full flex-col bg-zinc-950 p-6 text-zinc-300">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">SSH & Sunucu Yönetimi</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Uzak sunucularınıza SSH üzerinden komut veya uygulama dağıtımı yapmak için bağlantıları buradan yönetin.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          {showAddForm ? <XCircle size={16} /> : <Plus size={16} />}
          {showAddForm ? "İptal" : "Yeni Ekle"}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-lg font-medium text-zinc-100">Yeni SSH Bağlantısı Ekle</h2>
          <form onSubmit={handleAddHost} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Takma Ad (Alias)</label>
              <input
                type="text"
                required
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Örn: prod-db-1"
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Hostname / IP</label>
              <input
                type="text"
                required
                value={hostAddr}
                onChange={(e) => setHostAddr(e.target.value)}
                placeholder="Örn: 192.168.1.100"
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Kullanıcı (User)</label>
              <input
                type="text"
                required
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Port</label>
              <input
                type="number"
                required
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="col-span-1 flex items-end md:col-span-2">
              <button
                type="submit"
                className="w-full md:w-auto rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                Kaydet
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Activity className="animate-pulse text-zinc-600" size={32} />
        </div>
      ) : hosts.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30">
          <Activity className="mb-4 text-zinc-700" size={48} />
          <p className="text-zinc-500">Henüz kayıtlı bir SSH sunucusu yok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6 xl:grid-cols-3">
          {hosts.map((host) => {
            const isChecking = checking[host.alias];
            const checkRes = checkResults[host.alias];

            return (
              <div
                key={host.alias}
                className="group flex flex-col justify-between rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden shadow-sm transition-all hover:border-zinc-700"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                        {host.alias}
                        {checkRes && (
                          <span title={checkRes.status}>
                            {checkRes.ok ? (
                              <CheckCircle2 size={16} className="text-emerald-500" />
                            ) : (
                              <XCircle size={16} className="text-rose-500" />
                            )}
                          </span>
                        )}
                      </h3>
                      <div className="mt-2 space-y-1 text-xs text-zinc-400 font-mono">
                        <p><span className="text-zinc-600">host:</span> {host.host}</p>
                        <p><span className="text-zinc-600">user:</span> {host.user}</p>
                        <p><span className="text-zinc-600">port:</span> {host.port}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-10 lg:opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleDeleteHost(host.alias)}
                        className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-rose-400 transition-colors"
                        title="Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {checkRes && !checkRes.ok && checkRes.output && (
                    <div className="mt-4 rounded bg-zinc-950 p-2 text-xs font-mono text-rose-400 overflow-x-auto">
                      {checkRes.output}
                      {checkRes.details && <div className="mt-1 opacity-70">{checkRes.details}</div>}
                    </div>
                  )}
                </div>
                
                <div className="border-t border-zinc-800/50 bg-zinc-950/30 p-3 flex justify-end">
                  <button
                    onClick={() => handleCheckHost(host.alias)}
                    disabled={isChecking}
                    className="flex items-center gap-2 rounded px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-400/10 hover:text-emerald-300 disabled:opacity-50"
                  >
                    {isChecking ? (
                      <Activity size={14} className="animate-spin" />
                    ) : (
                      <Play size={14} />
                    )}
                    Bağlantıyı Test Et
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
