"use client";

import { useState, useEffect } from "react";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";

function SettingField({ setting, value, onChange }) {
  if (typeof value === "boolean") {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="form-checkbox" />
        <span>{setting.key}</span>
      </label>
    );
  }
  if (typeof value === "object") {
    return (
      <div className="form-group">
        <label className="form-label">{setting.key}</label>
        <textarea
          className="form-textarea font-mono text-sm"
          rows={4}
          value={JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try { onChange(JSON.parse(e.target.value)); } catch { /* let user keep typing */ }
          }}
        />
      </div>
    );
  }
  return (
    <div className="form-group">
      <label className="form-label">{setting.key}</label>
      <input type="text" className="form-input" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export default function SettingsPage() {
  const [grouped, setGrouped] = useState({});
  const [edited, setEdited] = useState({});
  const [saving, setSaving] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const json = await res.json();
        setGrouped(json);
        const init = {};
        for (const cat of Object.keys(json)) {
          for (const s of json[cat]) {
            init[s.key] = s.value;
          }
        }
        setEdited(init);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveCategory = async (category) => {
    setSaving((p) => ({ ...p, [category]: true }));
    try {
      const settings = grouped[category] || [];
      for (const s of settings) {
        await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: s.key, value: edited[s.key], category }),
        });
      }
          toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving((p) => ({ ...p, [category]: false }));
    }
  };

  if (loading) return <div className="p-8 text-center">Loading settings...</div>;

  const categories = Object.keys(grouped);

  return (
    <>
      <AdminPageHeader title="Settings" description="Manage application settings" />
      {categories.length === 0 && <p className="text-muted">No settings configured.</p>}
      {categories.map((cat) => (
        <div key={cat} className="card mb-6">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold capitalize">{cat}</h3>
            <button className="btn btn-primary btn-sm" disabled={saving[cat]} onClick={() => saveCategory(cat)}>
              {saving[cat] ? "Saving..." : "Save"}
            </button>
          </div>
          <div className="card-body space-y-4">
            {grouped[cat].map((s) => (
              <SettingField
                key={s.key}
                setting={s}
                value={edited[s.key]}
                onChange={(v) => setEdited((p) => ({ ...p, [s.key]: v }))}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
