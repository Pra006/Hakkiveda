"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

export default function AdminDataTable({
  columns,
  data,
  loading,
  pagination,
  onPageChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  actions,
  emptyIcon = "inbox",
  emptyMessage = "No data found",
  headerExtra,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200">
        {/* Search bar skeleton */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="h-9 w-64 bg-slate-100 rounded-lg animate-pulse" />
          {headerExtra && <div className="h-9 w-32 bg-slate-100 rounded-lg animate-pulse ml-auto" />}
        </div>
        {/* Table skeleton */}
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
        {onSearchChange && (
          <div className="relative">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchValue || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none w-64"
            />
          </div>
        )}
        {headerExtra && <div className="ml-auto flex items-center gap-2">{headerExtra}</div>}
      </div>

      {/* Table */}
      {data.length === 0 ? (
        <div className="py-16 text-center">
          <Icon name={emptyIcon} size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500 bg-slate-50/50 border-b border-slate-100">
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 font-semibold whitespace-nowrap" style={col.width ? { width: col.width } : undefined}>
                    {col.label}
                  </th>
                ))}
                {actions && <th className="px-4 py-3 font-semibold w-16">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-slate-50/50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3">{actions(row)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Icon name="chevron_left" size={18} />
            </button>
            <span className="px-3 py-1 text-xs font-semibold bg-slate-100 rounded">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasMore}
              className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Icon name="chevron_right" size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
