import { useEffect, useState } from "react";
import { adminService, type AdminHealth } from "@/services/admin.service";
import { CheckCircle2, XCircle, Server, Database } from "lucide-react";

const StatusItem = ({ label, status, icon }: { label: string, status: string, icon: React.ReactNode }) => (
  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
    <div className="flex items-center gap-3">
      <div className="text-slate-400">{icon}</div>
      <span className="font-medium">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {status === "healthy" ? (
        <>
          <CheckCircle2 className="text-green-500" size={18} />
          <span className="text-green-500 font-medium">Operational</span>
        </>
      ) : (
        <>
          <XCircle className="text-red-500" size={18} />
          <span className="text-red-500 font-medium">Degraded</span>
        </>
      )}
    </div>
  </div>
);

export default function SystemStatus() {
  const [health, setHealth] = useState<AdminHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminService.getHealth()
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load health stats", err);
        setError("Failed to connect to health endpoints.");
        setLoading(false);
      });
  }, []);

  if (error) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mt-6">
        <h2 className="text-xl font-semibold mb-5">System Status</h2>
        <div className="text-red-500 bg-red-950/20 p-4 rounded-xl border border-red-900">
          {error}
        </div>
      </div>
    );
  }

  if (loading || !health) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mt-6 animate-pulse">
        <h2 className="text-xl font-semibold mb-5">System Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 bg-slate-800 rounded-xl"></div>
          <div className="h-16 bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mt-6">
      <h2 className="text-xl font-semibold mb-5">System Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatusItem label="API / Database" status={health.database} icon={<Server size={20} />} />
        <StatusItem label="Qdrant Vector DB" status={health.qdrant} icon={<Database size={20} />} />
      </div>
    </div>
  );
}
