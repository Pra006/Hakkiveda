"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const formatNPR = (v) =>
  `NPR ${(Number(v) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const compactNPR = (v) => {
  const n = Number(v) || 0;
  if (n >= 1_00_00_000) return `NPR ${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (n >= 1_00_000) return `NPR ${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000) return `NPR ${(n / 1_000).toFixed(1)}K`;
  return `NPR ${n.toLocaleString("en-IN")}`;
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatDateTime = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const PERIOD_OPTIONS = [
  { value: 1, label: "Today" },
  { value: 7, label: "Last 7 Days" },
  { value: 30, label: "Last 30 Days" },
  { value: 90, label: "Last 3 Months" },
  { value: 180, label: "Last 6 Months" },
  { value: 365, label: "Last Year" },
];

/* ─── Dataviz palette (validated, from dataviz skill) ─────────────────── */
const CHART_COLORS = {
  series1: "#2a78d6", // blue — customer revenue
  series2: "#eb6834", // orange — B2B revenue
  series3: "#1baf7a", // aqua — total
  surface: "#fcfcfb",
  gridline: "#e1e0d9",
  muted: "#898781",
  primary: "#0b0b0b",
  secondary: "#52514e",
  deltaUp: "#006300",
  deltaDn: "#d03b3b",
};

/* ─── Skeleton Loader ─────────────────────────────────────────────────── */

function Skeleton({ className = "" }) {
  return <div className={`bg-slate-100 animate-pulse rounded ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div>
      <AdminPageHeader title="Dashboard" description="Business overview and analytics" />
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
            <Skeleton className="h-4 w-20 mb-3" />
            <Skeleton className="h-8 w-28 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      {/* Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <Skeleton className="h-5 w-36 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
      {/* Two cols */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <Skeleton className="h-5 w-40 mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full mb-2" />
          ))}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full mb-2" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── KPI Stat Card (enhanced) ────────────────────────────────────────── */

function KPICard({ icon, label, value, delta, subtitle, accent = "blue" }) {
  const accents = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            accents[accent] || accents.blue
          }`}
        >
          <Icon name={icon} size={18} />
        </div>
        {delta !== undefined && delta !== null && (
          <span
            className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
              delta > 0
                ? "text-emerald-700 bg-emerald-50"
                : delta < 0
                ? "text-red-700 bg-red-50"
                : "text-slate-500 bg-slate-50"
            }`}
          >
            {delta > 0 ? "+" : ""}
            {delta}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-900 leading-tight">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
      {subtitle && (
        <div className="text-[11px] text-slate-400 mt-0.5">{subtitle}</div>
      )}
    </div>
  );
}

/* ─── Revenue Chart (inline SVG — dataviz skill compliant) ────────────── */

function RevenueChart({ data }) {
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-400">
        <Icon name="show_chart" size={24} className="mr-2 text-slate-300" />
        No revenue data for this period
      </div>
    );
  }

  // Chart dimensions
  const W = Math.max(containerWidth || 600, 300);
  const H = 280;
  const PAD = { top: 20, right: 20, bottom: 40, left: 70 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  // Data bounds
  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const niceMax = niceNum(maxVal);

  function niceNum(v) {
    const exp = Math.floor(Math.log10(v));
    const frac = v / Math.pow(10, exp);
    let nice;
    if (frac <= 1.5) nice = 2;
    else if (frac <= 3) nice = 3;
    else if (frac <= 7) nice = 5;
    else nice = 10;
    return nice * Math.pow(10, exp - (nice >= 10 ? 0 : 0));
  }

  // Scales
  const xScale = (i) => PAD.left + (i / Math.max(data.length - 1, 1)) * cW;
  const yScale = (v) => PAD.top + cH - (v / niceMax) * cH;

  // Y-axis ticks (5 ticks)
  const yTicks = Array.from({ length: 6 }, (_, i) => (niceMax / 5) * i);

  // Build polyline points
  function polyPoints(key) {
    return data.map((d, i) => `${xScale(i)},${yScale(d[key])}`).join(" ");
  }

  // Area path
  function areaPath(key) {
    const pts = data.map((d, i) => `${xScale(i)},${yScale(d[key])}`);
    return `M${xScale(0)},${yScale(0)} L${pts.join(" L")} L${xScale(data.length - 1)},${yScale(0)} Z`;
  }

  // X-axis labels — show up to ~8 labels
  const labelStep = Math.max(1, Math.ceil(data.length / 8));
  const xLabels = data
    .map((d, i) => ({ i, label: formatAxisDate(d.date, data.length) }))
    .filter((_, idx) => idx % labelStep === 0 || idx === data.length - 1);

  function formatAxisDate(iso, count) {
    const d = new Date(iso);
    if (count <= 24) return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    if (count <= 90) return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  }

  // Tooltip handler
  function handlePointerMove(e) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    // Find nearest data point
    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < data.length; i++) {
      const dist = Math.abs(xScale(i) - x);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    setTooltip({ i: closest, x: xScale(closest), y: e.clientY - rect.top });
  }

  const gradId1 = "cust-grad";
  const gradId2 = "b2b-grad";

  return (
    <div ref={containerRef} className="relative" onPointerMove={handlePointerMove} onPointerLeave={() => setTooltip(null)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        className="w-full"
        style={{ maxHeight: 280 }}
        role="img"
        aria-label="Revenue over time chart"
      >
        {/* Gradient fills */}
        <defs>
          <linearGradient id={gradId1} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.series1} stopOpacity="0.12" />
            <stop offset="100%" stopColor={CHART_COLORS.series1} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={gradId2} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.series2} stopOpacity="0.12" />
            <stop offset="100%" stopColor={CHART_COLORS.series2} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y gridlines */}
        {yTicks.map((t) => (
          <line
            key={t}
            x1={PAD.left}
            y1={yScale(t)}
            x2={W - PAD.right}
            y2={yScale(t)}
            stroke={CHART_COLORS.gridline}
            strokeWidth="1"
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((t) => (
          <text
            key={`yl-${t}`}
            x={PAD.left - 8}
            y={yScale(t) + 4}
            textAnchor="end"
            fill={CHART_COLORS.muted}
            fontSize="11"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {t >= 1_00_00_000
              ? `${(t / 1_00_00_000).toFixed(0)}Cr`
              : t >= 1_00_000
              ? `${(t / 1_00_000).toFixed(0)}L`
              : t >= 1_000
              ? `${(t / 1_000).toFixed(0)}K`
              : t}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map(({ i, label }) => (
          <text
            key={`xl-${i}`}
            x={xScale(i)}
            y={H - 8}
            textAnchor="middle"
            fill={CHART_COLORS.muted}
            fontSize="11"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {label}
          </text>
        ))}

        {/* Baseline */}
        <line
          x1={PAD.left}
          y1={PAD.top + cH}
          x2={W - PAD.right}
          y2={PAD.top + cH}
          stroke="#c3c2b7"
          strokeWidth="1"
        />

        {/* Area fills */}
        <path d={areaPath("customerRevenue")} fill={`url(#${gradId1})`} />
        <path d={areaPath("b2bRevenue")} fill={`url(#${gradId2})`} />

        {/* Lines — 2px per dataviz spec */}
        <polyline
          points={polyPoints("customerRevenue")}
          fill="none"
          stroke={CHART_COLORS.series1}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <polyline
          points={polyPoints("b2bRevenue")}
          fill="none"
          stroke={CHART_COLORS.series2}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* End dots (>= 8px per spec) */}
        {data.length > 0 && (
          <>
            <circle
              cx={xScale(data.length - 1)}
              cy={yScale(data[data.length - 1].customerRevenue)}
              r="4"
              fill={CHART_COLORS.series1}
              stroke={CHART_COLORS.surface}
              strokeWidth="2"
            />
            <circle
              cx={xScale(data.length - 1)}
              cy={yScale(data[data.length - 1].b2bRevenue)}
              r="4"
              fill={CHART_COLORS.series2}
              stroke={CHART_COLORS.surface}
              strokeWidth="2"
            />
          </>
        )}

        {/* Vertical crosshair on hover */}
        {tooltip && (
          <>
            <line
              x1={tooltip.x}
              y1={PAD.top}
              x2={tooltip.x}
              y2={PAD.top + cH}
              stroke={CHART_COLORS.muted}
              strokeWidth="1"
              strokeDasharray="3 3"
              style={{ pointerEvents: "none" }}
            />
            <circle
              cx={tooltip.x}
              cy={yScale(data[tooltip.i].customerRevenue)}
              r="5"
              fill={CHART_COLORS.series1}
              stroke={CHART_COLORS.surface}
              strokeWidth="2"
              style={{ pointerEvents: "none" }}
            />
            <circle
              cx={tooltip.x}
              cy={yScale(data[tooltip.i].b2bRevenue)}
              r="5"
              fill={CHART_COLORS.series2}
              stroke={CHART_COLORS.surface}
              strokeWidth="2"
              style={{ pointerEvents: "none" }}
            />
          </>
        )}

        {/* Transparent hit area */}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={cW}
          height={cH}
          fill="transparent"
          style={{ cursor: "crosshair" }}
        />
      </svg>

      {/* Tooltip */}
      {tooltip && data[tooltip.i] && (
        <div
          className="absolute z-10 bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs pointer-events-none"
          style={{
            left: Math.min(tooltip.x + 12, (containerWidth || W) - 180),
            top: Math.max(20, tooltip.y - 80),
            minWidth: 160,
          }}
        >
          <div className="font-medium text-slate-700 mb-1.5">
            {formatAxisDate(data[tooltip.i].date, data.length)}
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="inline-block w-3 h-0.5 rounded" style={{ background: CHART_COLORS.series1 }} />
            <span className="text-slate-500">Customer</span>
            <span className="ml-auto font-semibold text-slate-900">
              {compactNPR(data[tooltip.i].customerRevenue)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="inline-block w-3 h-0.5 rounded" style={{ background: CHART_COLORS.series2 }} />
            <span className="text-slate-500">B2B</span>
            <span className="ml-auto font-semibold text-slate-900">
              {compactNPR(data[tooltip.i].b2bRevenue)}
            </span>
          </div>
          <div className="border-t border-slate-100 pt-1 mt-1 flex justify-between">
            <span className="text-slate-500">Total</span>
            <span className="font-semibold text-slate-900">
              {compactNPR(data[tooltip.i].total)}
            </span>
          </div>
        </div>
      )}

      {/* Legend — line keys per dataviz spec */}
      <div className="flex items-center gap-5 mt-3 ml-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="inline-block w-4 h-0.5 rounded" style={{ background: CHART_COLORS.series1 }} />
          Customer Revenue
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="inline-block w-4 h-0.5 rounded" style={{ background: CHART_COLORS.series2 }} />
          B2B Revenue
        </div>
      </div>
    </div>
  );
}

/* ─── Card wrapper ────────────────────────────────────────────────────── */

function Card({ title, icon, action, children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {icon && <Icon name={icon} size={18} className="text-slate-400" />}
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          </div>
          {action}
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

/* ─── Order Status Bar ────────────────────────────────────────────────── */

function OrderStatusBar({ orderStatus }) {
  const segments = [
    { key: "delivered", label: "Delivered", color: "bg-emerald-500", count: orderStatus.delivered },
    { key: "shipped", label: "Shipped", color: "bg-cyan-500", count: orderStatus.shipped },
    { key: "processing", label: "Processing", color: "bg-indigo-500", count: orderStatus.processing },
    { key: "confirmed", label: "Confirmed", color: "bg-blue-500", count: orderStatus.confirmed },
    { key: "pending", label: "Pending", color: "bg-amber-500", count: orderStatus.pending },
    { key: "cancelled", label: "Cancelled", color: "bg-slate-400", count: orderStatus.cancelled },
  ].filter((s) => s.count > 0);

  const total = segments.reduce((s, seg) => s + seg.count, 0) || 1;

  return (
    <div>
      {/* Stacked horizontal bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 mb-4">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className={`${seg.color} transition-all`}
            style={{ width: `${(seg.count / total) * 100}%` }}
            title={`${seg.label}: ${seg.count}`}
          />
        ))}
      </div>

      {/* Status grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Pending", value: orderStatus.pending, icon: "schedule", href: "/admin/customer-orders", color: "text-amber-600" },
          { label: "Confirmed", value: orderStatus.confirmed, icon: "check_circle", color: "text-blue-600" },
          { label: "Processing", value: orderStatus.processing, icon: "sync", color: "text-indigo-600" },
          { label: "Shipped", value: orderStatus.shipped, icon: "local_shipping", color: "text-cyan-600" },
          { label: "Delivered", value: orderStatus.delivered, icon: "inventory_2", color: "text-emerald-600" },
          { label: "Cancelled", value: orderStatus.cancelled, icon: "cancel", color: "text-slate-500" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <Icon name={item.icon} size={16} className={item.color} />
            <span className="text-xs text-slate-600">{item.label}</span>
            <span className="text-sm font-semibold text-slate-900 ml-auto">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Failed payments & B2B pending */}
      {(orderStatus.failedPayments > 0 || orderStatus.b2bPending > 0) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-4">
          {orderStatus.failedPayments > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <Icon name="error" size={14} className="text-red-500" />
              <span className="text-red-600 font-medium">{orderStatus.failedPayments} failed payments</span>
            </div>
          )}
          {orderStatus.b2bPending > 0 && (
            <Link href="/admin/b2b/orders" className="flex items-center gap-1.5 text-xs hover:underline">
              <Icon name="corporate_fare" size={14} className="text-amber-500" />
              <span className="text-amber-600 font-medium">{orderStatus.b2bPending} B2B orders pending</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Recent Orders Table ─────────────────────────────────────────────── */

function RecentOrdersTable({ orders }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-slate-400">
        <Icon name="receipt_long" size={28} className="mx-auto mb-2 text-slate-300" />
        No recent orders
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
            <th className="px-5 py-2.5 font-medium">Order</th>
            <th className="px-3 py-2.5 font-medium">Customer</th>
            <th className="px-3 py-2.5 font-medium hidden sm:table-cell">Type</th>
            <th className="px-3 py-2.5 font-medium text-right">Amount</th>
            <th className="px-3 py-2.5 font-medium hidden md:table-cell">Status</th>
            <th className="px-3 py-2.5 font-medium hidden lg:table-cell">Date</th>
            <th className="px-5 py-2.5 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-25 transition-colors">
              <td className="px-5 py-3">
                <span className="font-medium text-slate-900 text-xs">
                  {order.orderNumber || `#${order.id.slice(-6)}`}
                </span>
              </td>
              <td className="px-3 py-3">
                <span className="text-slate-700 text-xs truncate max-w-[120px] inline-block">
                  {order.customer}
                </span>
              </td>
              <td className="px-3 py-3 hidden sm:table-cell">
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    order.type === "B2B"
                      ? "bg-purple-50 text-purple-600"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {order.type}
                </span>
              </td>
              <td className="px-3 py-3 text-right">
                <span className="font-medium text-slate-900 text-xs">{formatNPR(order.amount)}</span>
              </td>
              <td className="px-3 py-3 hidden md:table-cell">
                <AdminStatusBadge status={order.status} />
              </td>
              <td className="px-3 py-3 hidden lg:table-cell">
                <span className="text-xs text-slate-500">{formatDateTime(order.createdAt)}</span>
              </td>
              <td className="px-5 py-3 text-right">
                <Link
                  href={
                    order.type === "B2B"
                      ? `/admin/b2b/orders`
                      : `/admin/customer-orders/${order.id}`
                  }
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Top Products ────────────────────────────────────────────────────── */

function TopProductsList({ products }) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-slate-400">
        <Icon name="inventory_2" size={24} className="mx-auto mb-2 text-slate-300" />
        No sales data yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((p, idx) => (
        <div key={p.id} className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 w-5 text-right">{idx + 1}</span>
          <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
            {p.image ? (
              <img src={p.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon name="image" size={16} className="text-slate-300" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-900 truncate">{p.name}</div>
            <div className="text-[11px] text-slate-500">
              {p.unitsSold} sold · {compactNPR(p.revenue)}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                p.stock <= 0
                  ? "bg-red-50 text-red-600"
                  : p.stock <= 10
                  ? "bg-amber-50 text-amber-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {p.stock <= 0 ? "Out of stock" : `${p.stock} left`}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Stock Alerts ────────────────────────────────────────────────────── */

function StockAlerts({ stockAlerts }) {
  const hasAlerts =
    stockAlerts.outOfStockCount > 0 || stockAlerts.lowStockCount > 0;

  if (!hasAlerts) {
    return (
      <div className="text-center py-6 text-sm text-slate-400">
        <Icon name="check_circle" size={24} className="mx-auto mb-2 text-emerald-400" />
        All stock levels healthy
      </div>
    );
  }

  return (
    <div>
      {/* Summary */}
      <div className="flex gap-3 mb-4">
        {stockAlerts.outOfStockCount > 0 && (
          <div className="flex items-center gap-1.5 bg-red-50 text-red-700 px-2.5 py-1.5 rounded-lg text-xs font-medium">
            <Icon name="error" size={14} />
            {stockAlerts.outOfStockCount} out of stock
          </div>
        )}
        {stockAlerts.lowStockCount > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-1.5 rounded-lg text-xs font-medium">
            <Icon name="warning" size={14} />
            {stockAlerts.lowStockCount} low stock
          </div>
        )}
      </div>

      {/* Product list */}
      <div className="space-y-2">
        {[...(stockAlerts.outOfStock || []), ...(stockAlerts.lowStock || [])].slice(0, 6).map((p) => (
          <Link
            key={p.id}
            href={`/admin/products/${p.id}`}
            className="flex items-center gap-2.5 hover:bg-slate-50 rounded-lg px-2 py-1.5 -mx-2 transition"
          >
            <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden flex-shrink-0">
              {p.images?.[0] ? (
                <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon name="image" size={14} className="text-slate-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-900 truncate">{p.name}</div>
              {p.sku && <div className="text-[10px] text-slate-400">{p.sku}</div>}
            </div>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${
                p.stock <= 0 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
              }`}
            >
              {p.stock <= 0 ? "Out of stock" : `${p.stock} units`}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─── Attention Items ─────────────────────────────────────────────────── */

function AttentionItems({ attention }) {
  const items = [
    { label: "Pending Orders", value: attention.pendingOrders, icon: "pending_actions", href: "/admin/customer-orders", color: "amber" },
    { label: "Failed Payments", value: attention.failedPayments, icon: "credit_card_off", href: "/admin/customer-orders", color: "red" },
    { label: "Pending Applications", value: attention.pendingApplications, icon: "description", href: "/admin/b2b/applications", color: "blue" },
    { label: "Pending RFQs", value: attention.pendingRFQs, icon: "request_quote", href: "/admin/b2b/rfqs", color: "purple" },
    { label: "Active Quotations", value: attention.activeQuotations, icon: "calculate", href: "/admin/b2b/quotations", color: "blue" },
    { label: "Pending POs", value: attention.pendingPOs, icon: "assignment", href: "/admin/b2b/purchase-orders", color: "amber" },
    { label: "Outstanding Invoices", value: attention.outstandingInvoices, icon: "receipt", href: "/admin/b2b/invoices", color: "red" },
    { label: "Pending Reviews", value: attention.pendingReviews, icon: "rate_review", href: "/admin/reviews", color: "purple" },
    { label: "Low Stock Items", value: attention.lowStockCount, icon: "warning", href: "/admin/products", color: "amber" },
    { label: "Out of Stock", value: attention.outOfStockCount, icon: "dangerous", href: "/admin/products", color: "red" },
  ].filter((item) => item.value > 0);

  if (items.length === 0) {
    return (
      <div className="text-center py-6">
        <Icon name="check_circle" size={32} className="mx-auto mb-2 text-emerald-400" />
        <p className="text-sm text-slate-500">All caught up! No items require attention.</p>
      </div>
    );
  }

  const accentMap = {
    amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-100",
    red: "bg-red-50 text-red-600 group-hover:bg-red-100",
    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
    purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-100",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 transition group"
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition ${
              accentMap[item.color]
            }`}
          >
            <Icon name={item.icon} size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-600">{item.label}</div>
          </div>
          <span className="text-sm font-bold text-slate-900">{item.value}</span>
          <Icon name="chevron_right" size={16} className="text-slate-300 group-hover:text-slate-500" />
        </Link>
      ))}
    </div>
  );
}

/* ─── Customer & B2B Overview ─────────────────────────────────────────── */

function CustomerB2BOverview({ customers, b2b, kpi }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Customer section */}
      <div className="bg-slate-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="people" size={18} className="text-blue-600" />
          <span className="text-sm font-semibold text-slate-900">Customers</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Total</span>
            <span className="font-semibold text-slate-900">{customers.total}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">New this period</span>
            <span className="font-semibold text-slate-900">{customers.new}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Previous period</span>
            <span className="text-slate-500">{customers.previousNew}</span>
          </div>
        </div>
      </div>

      {/* B2B section */}
      <div className="bg-slate-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="corporate_fare" size={18} className="text-purple-600" />
          <span className="text-sm font-semibold text-slate-900">B2B</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Total Organizations</span>
            <span className="font-semibold text-slate-900">{b2b.totalOrgs}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Active</span>
            <span className="font-semibold text-slate-900">{b2b.activeOrgs}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Pending Applications</span>
            <span className="font-semibold text-slate-900">{b2b.pendingApplications}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">New this period</span>
            <span className="font-semibold text-slate-900">{b2b.newOrgs}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">B2B Orders</span>
            <span className="font-semibold text-slate-900">{b2b.b2bOrders}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Reviews Summary ─────────────────────────────────────────────────── */

function ReviewsSummary({ reviews }) {
  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center bg-slate-50 rounded-lg py-3">
          <div className="text-lg font-bold text-slate-900">{reviews.avgRating || "—"}</div>
          <div className="text-[10px] text-slate-500">Avg Rating</div>
        </div>
        <div className="text-center bg-slate-50 rounded-lg py-3">
          <div className="text-lg font-bold text-slate-900">{reviews.approved}</div>
          <div className="text-[10px] text-slate-500">Approved</div>
        </div>
        <div className="text-center bg-amber-50 rounded-lg py-3">
          <div className="text-lg font-bold text-amber-700">{reviews.pending}</div>
          <div className="text-[10px] text-amber-600">Pending</div>
        </div>
      </div>

      {/* Recent pending */}
      {reviews.recentPending?.length > 0 && (
        <div>
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
            Recent pending reviews
          </div>
          <div className="space-y-2">
            {reviews.recentPending.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                  {r.productImage ? (
                    <img src={r.productImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon name="image" size={12} className="text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-900 truncate">{r.productName}</div>
                  <div className="text-[10px] text-slate-400">
                    {r.customerName} · {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Quick Actions ───────────────────────────────────────────────────── */

function QuickActions() {
  const actions = [
    { label: "Add Product", icon: "add_box", href: "/admin/products/new", color: "text-emerald-600 bg-emerald-50" },
    { label: "View Orders", icon: "receipt_long", href: "/admin/customer-orders", color: "text-blue-600 bg-blue-50" },
    { label: "Customers", icon: "people", href: "/admin/customers", color: "text-purple-600 bg-purple-50" },
    { label: "Reviews", icon: "rate_review", href: "/admin/reviews", color: "text-amber-600 bg-amber-50" },
    { label: "B2B", icon: "corporate_fare", href: "/admin/b2b", color: "text-indigo-600 bg-indigo-50" },
    { label: "Products", icon: "inventory_2", href: "/admin/products", color: "text-cyan-600 bg-cyan-50" },
    { label: "Store", icon: "storefront", href: "/", color: "text-slate-600 bg-slate-100" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition text-xs font-medium text-slate-700"
        >
          <div className={`w-6 h-6 rounded flex items-center justify-center ${a.color}`}>
            <Icon name={a.icon} size={14} />
          </div>
          {a.label}
        </Link>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Main Dashboard Page
   ═══════════════════════════════════════════════════════════════════════ */

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState(30);

  const fetchData = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await fetch(`/api/admin/dashboard?days=${days}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setStats(data);
      } catch {
        if (!showRefresh) setStats(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [days]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* Loading state */
  if (loading) return <DashboardSkeleton />;

  /* Error state */
  if (!stats) {
    return (
      <div>
        <AdminPageHeader title="Dashboard" description="Business overview and analytics" />
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Icon name="cloud_off" size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 mb-3">Failed to load dashboard data</p>
          <button
            onClick={() => fetchData()}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { kpi, revenueChart, orderStatus, recentOrders, topProducts, stockAlerts, customers, b2b, attention, reviews } = stats;

  return (
    <div className="space-y-6">
      {/* ── Section 1: Header ─────────────────────────────────────────── */}
      <AdminPageHeader title="Dashboard" description="Business overview and analytics">
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Refresh */}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-2 bg-white hover:bg-slate-50 disabled:opacity-50 transition"
          >
            <Icon
              name="refresh"
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Visit Storefront */}
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-2 bg-white hover:bg-slate-50 transition"
          >
            <Icon name="storefront" size={16} />
            <span className="hidden sm:inline">Storefront</span>
          </Link>
        </div>
      </AdminPageHeader>

      {/* ── Section 2: KPI Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          icon="account_balance_wallet"
          label="Total Revenue"
          value={compactNPR(kpi.totalRevenue.value)}
          delta={kpi.totalRevenue.delta}
          subtitle={`prev: ${compactNPR(kpi.totalRevenue.previous)}`}
          accent="green"
        />
        <KPICard
          icon="receipt_long"
          label="Customer Orders"
          value={kpi.customerOrders.value}
          delta={kpi.customerOrders.delta}
          subtitle={`prev: ${kpi.customerOrders.previous}`}
          accent="blue"
        />
        <KPICard
          icon="local_shipping"
          label="B2B Orders"
          value={kpi.b2bOrders.value}
          delta={kpi.b2bOrders.delta}
          subtitle={`prev: ${kpi.b2bOrders.previous}`}
          accent="purple"
        />
        <KPICard
          icon="people"
          label="Total Customers"
          value={kpi.totalCustomers.value}
          delta={kpi.totalCustomers.delta}
          subtitle={`${kpi.totalCustomers.new} new this period`}
          accent="blue"
        />
        <KPICard
          icon="corporate_fare"
          label="B2B Organizations"
          value={kpi.b2bOrganizations.value}
          delta={kpi.b2bOrganizations.delta}
          subtitle={`${kpi.b2bOrganizations.active} active`}
          accent="amber"
        />
        <KPICard
          icon="inventory_2"
          label="Total Products"
          value={kpi.totalProducts.value}
          subtitle={`${kpi.totalProducts.active} active`}
          accent="slate"
        />
      </div>

      {/* ── Section 3: Sales Overview (Revenue Chart) ─────────────────── */}
      <Card
        title="Sales Overview"
        icon="trending_up"
        action={
          <span className="text-xs text-slate-400">
            {PERIOD_OPTIONS.find((o) => o.value === days)?.label}
          </span>
        }
      >
        <RevenueChart data={revenueChart} />
      </Card>

      {/* ── Sections 4 & 5: Orders Overview + Recent Orders ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <Card
            title="Orders Overview"
            icon="assignment"
            action={
              <Link
                href="/admin/customer-orders"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            }
            className="h-full"
          >
            <OrderStatusBar orderStatus={orderStatus} />
          </Card>
        </div>
        <div className="lg:col-span-3">
          <Card
            title="Recent Orders"
            icon="receipt_long"
            action={
              <Link
                href="/admin/customer-orders"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            }
            className="h-full"
          >
            <RecentOrdersTable orders={recentOrders} />
          </Card>
        </div>
      </div>

      {/* ── Sections 6: Top Products + Stock Alerts ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Top Products"
          icon="star"
          action={
            <Link
              href="/admin/products"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              All Products
            </Link>
          }
        >
          <TopProductsList products={topProducts} />
        </Card>

        <Card
          title="Stock Alerts"
          icon="inventory"
          action={
            <Link
              href="/admin/products"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Manage Stock
            </Link>
          }
        >
          <StockAlerts stockAlerts={stockAlerts} />
        </Card>
      </div>

      {/* ── Sections 7 & 8: Customer/B2B + Requires Attention ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Customers & B2B" icon="groups">
          <CustomerB2BOverview customers={customers} b2b={b2b} kpi={kpi} />
        </Card>

        <Card
          title="Requires Attention"
          icon="notification_important"
          action={
            <span className="text-xs text-slate-400">
              {[
                attention.pendingOrders,
                attention.failedPayments,
                attention.pendingApplications,
                attention.pendingRFQs,
                attention.activeQuotations,
                attention.pendingPOs,
                attention.outstandingInvoices,
                attention.pendingReviews,
                attention.lowStockCount,
                attention.outOfStockCount,
              ].filter((v) => v > 0).length} items
            </span>
          }
        >
          <AttentionItems attention={attention} />
        </Card>
      </div>

      {/* ── Sections 9 & 10: Reviews + Quick Actions ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <Card
            title="Reviews Summary"
            icon="rate_review"
            action={
              <Link
                href="/admin/reviews"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Manage Reviews
              </Link>
            }
            className="h-full"
          >
            <ReviewsSummary reviews={reviews} />
          </Card>
        </div>
        <div className="lg:col-span-3">
          <Card title="Quick Actions" icon="bolt" className="h-full">
            <QuickActions />
          </Card>
        </div>
      </div>
    </div>
  );
}
