"use client";

export default function AdminStatCard({ label, value, icon, delta, accent = "blue" }) {
  const accents = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accents[accent] || accents.blue}`}>
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
        {delta !== undefined && (
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
            delta >= 0 ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"
          }`}>
            {delta >= 0 ? "+" : ""}{delta}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
