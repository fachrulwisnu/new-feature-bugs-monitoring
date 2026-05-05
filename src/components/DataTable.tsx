/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, CheckCircle2, Clock, MoreHorizontal, AlertCircle, Eye, X, Bug, Info, User, Layers, Calendar as CalendarIcon, ShieldAlert, History, Edit3, Save, Trash2, ArrowDownWideNarrow, Undo2, Database } from "lucide-react";
import { BugRecord, AppUser } from "../types";
import { cn } from "../lib/utils";
import { normalizeStatus } from "../lib/normalization";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";

interface DataTableProps {
  bugs: BugRecord[];
  dark?: boolean;
  hideFilters?: boolean;
  currentUser?: AppUser | null;
  matrixViewType?: 'BUG' | 'CR';
  onUpdateBug?: (id: string, updates: Partial<BugRecord>) => Promise<void>;
  onDeleteBug?: (id: string) => void;
  onRestoreBug?: (id: string) => void;
  isTrashView?: boolean;
  onExportExcel?: (data: BugRecord[], filename: string) => void;
  onExportPDF?: (id: string, filename: string) => void;
  onViewDetail?: (bug: BugRecord) => void;
  isExporting?: boolean;
}

export function DataTable({ bugs, dark, className, hideFilters, currentUser, matrixViewType, onUpdateBug, onDeleteBug, onRestoreBug, isTrashView, onExportExcel, onExportPDF, onViewDetail, isExporting }: DataTableProps & { className?: string }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [devFilter, setDevFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const isSuperAdmin = currentUser?.role === "super_admin";

  const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const YEARS = ["2024", "2025", "2026"];
  const PERIODS = useMemo(() => {
    const list: string[] = [];
    YEARS.forEach(y => MONTHS.forEach(m => list.push(`${m}-${y}`)));
    return list;
  }, []);

  const projects = Array.from(new Set(bugs.map((b) => b.projectName))).filter(Boolean);
  const developers = Array.from(new Set(bugs.map((b) => b.devName))).filter(Boolean);
  
  // Standardize Statuses for filtering
  const statuses = ["All", "DONE", "ON PROGRESS", "ON QUEUE", "PENDING", "UNMAPPED"];

  const getPeriodeValue = (s: string | undefined | null) => {
    if (!s || s === "-" || s === "UNASSIGNED") return 0;
    // Handle MMM-yyyy or MMM yyyy or MMM-yy or MMM/yyyy
    const parts = s.split(/[- /]/);
    if (parts.length === 2) {
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const monthStr = parts[0].substring(0, 3).toUpperCase();
      const mIdx = months.indexOf(monthStr);
      let year = parseInt(parts[1]);
      if (parts[1].length === 2) year += 2000; // Handle yy format
      if (!isNaN(year) && mIdx !== -1) {
        return (year * 12) + mIdx;
      }
    }
    const num = parseInt(s);
    return isNaN(num) ? 0 : num;
  };

  const filteredBugs = useMemo(() => {
    const list = bugs.filter((bug) => {
      const consolidatedStatus = normalizeStatus(bug.statusDev);
      
      const matchesSearch =
        (bug.remarks || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bug.projectName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bug.devName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bug.sectionName || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProject = !projectFilter || projectFilter === "All" || bug.projectName?.toLowerCase().includes(projectFilter.toLowerCase());
      const matchesDev = !devFilter || devFilter === "All" || bug.devName?.toLowerCase().includes(devFilter.toLowerCase());
      const matchesStatus = statusFilter === "All" || consolidatedStatus === statusFilter;
      
      return matchesSearch && matchesProject && matchesDev && matchesStatus;
    });

    // Explicit Default Sorting: Periode DESC, then created_at DESC, then No DESC
    return list.sort((a, b) => {
      const pA = getPeriodeValue(a.periode);
      const pB = getPeriodeValue(b.periode);
      
      if (pB !== pA) return pB - pA;
      
      const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (tB !== tA) return tB - tA;

      const noA = Number(a.no) || 0;
      const noB = Number(b.no) || 0;
      return noB - noA;
    });
  }, [bugs, searchTerm, projectFilter, devFilter, statusFilter]);

  // Reset to page 1 when filters or data change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, projectFilter, devFilter, statusFilter, itemsPerPage, bugs]);

  const totalPages = Math.ceil(filteredBugs.length / itemsPerPage);
  const currentBugs = filteredBugs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getScoreColor = (score: number) => {
    if (score < 10) return dark ? "text-green-400 bg-green-500/10" : "text-green-600 bg-green-50";
    if (score <= 20) return dark ? "text-yellow-400 bg-yellow-500/10" : "text-yellow-600 bg-yellow-50";
    return dark ? "text-red-400 bg-red-500/10" : "text-red-600 bg-red-50";
  };

  const getStatusBadge = (status: string) => {
    const normalized = normalizeStatus(status);
    
    if (normalized === "DONE") {
      return (
        <span className={cn(
          "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1",
          dark ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-green-100 text-green-700 border border-green-200"
        )}>
          <CheckCircle2 className="w-3 h-3" />
          DONE
        </span>
      );
    }

    if (normalized === "ON PROGRESS") {
      return (
        <span className={cn(
          "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1",
          dark ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-100 text-blue-700 border border-blue-200"
        )}>
          <Clock className="w-3 h-3" />
          ON PROGRESS
        </span>
      );
    }

    if (normalized === "ON QUEUE") {
      return (
        <span className={cn(
          "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1",
          dark ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-purple-100 text-purple-700 border border-purple-200"
        )}>
          <Clock className="w-3 h-3" />
          ON QUEUE
        </span>
      );
    }

    if (normalized === "UNMAPPED") {
      return (
        <span className={cn(
          "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1",
          dark ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-red-100 text-red-700 border border-red-200"
        )}>
          <AlertCircle className="w-3 h-3" />
          UNMAPPED
        </span>
      );
    }

    return (
      <span className={cn(
        "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1",
        dark ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-amber-100 text-amber-700 border border-amber-200"
      )}>
        <Clock className="w-3 h-3" />
        PENDING
      </span>
    );
  };

  return (
    <div className={cn(
      "glass-card overflow-hidden flex flex-col",
      className
    )}>
      {/* Tier 1: Internal Search/Filters (Fixed) */}
      {!hideFilters && (
        <div id="data-explorer-header" className={cn(
          "p-6 border-b border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between shrink-0 z-30 bg-white/5 backdrop-blur-xl"
        )}>
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Internal search in this view..."
              className={cn(
                "w-full h-10 pl-11 pr-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium text-sm text-white placeholder:text-slate-600"
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto no-export">
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-xl">
              <button 
                onClick={() => onExportExcel?.(filteredBugs, "Live-Governance-Ledger")}
                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all hover:bg-white/10"
              >
                <Bug className="w-3.5 h-3.5" />
                Excel
              </button>
            </div>

            <select
              className={cn(
                "h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              )}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statuses.map(s => <option key={s} value={s} className="bg-slate-900">{s} Status</option>)}
            </select>

            <div className="flex items-center gap-2 px-4 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
               <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 shrink-0">{filteredBugs.length} Items</span>
            </div>
          </div>
        </div>
      )}

      {/* Table Body - Scrollable */}
      <div id="live-governance-ledger-container" className="flex-1 overflow-x-auto overflow-y-auto scrollbar-hide relative min-h-0 bg-transparent">
        <table className="w-full text-left border-collapse table-auto min-w-[1500px]">
          <thead className="sticky top-0 z-20">
            <tr className={cn(
              "border-b backdrop-blur-xl bg-white/5 border-white/10 text-slate-400"
            )}>
              <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.2em] w-[80px] min-w-[80px] whitespace-nowrap">No</th>
              <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.2em] w-[250px] min-w-[200px] whitespace-nowrap">Project Mapping</th>
              <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.2em] w-[220px] min-w-[180px] whitespace-nowrap">Developer Identity</th>
              <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-center w-[100px] min-w-[80px] whitespace-nowrap">Type</th>
              <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-center w-[120px] min-w-[100px] whitespace-nowrap">Severity</th>
              <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-center w-[80px] min-w-[60px] whitespace-nowrap">Impact</th>
              <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.2em] w-[180px] min-w-[150px] whitespace-nowrap">Detection Source</th>
              <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.2em] w-[180px] min-w-[150px] whitespace-nowrap">SIT Realization</th>
              <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.2em] w-[450px] min-w-[350px] whitespace-nowrap">Dev Status / Remarks</th>
              <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.2em] w-[180px] min-w-[140px] whitespace-nowrap">Last Updated</th>
              <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.2em] w-[180px] min-w-[160px] whitespace-nowrap">Updated By</th>
              <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.2em] w-[120px] min-w-[120px] whitespace-nowrap text-right">Periode</th>
              <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.2em] w-[100px] min-w-[100px] whitespace-nowrap text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={cn(
            "divide-y",
            dark ? "divide-slate-800/30" : "divide-slate-50"
          )}>
            {currentBugs.map((bug, idx) => {
              const remarksSnippet = bug.remarks && bug.remarks.length > 50 
                ? bug.remarks.substring(0, 50) + "..." 
                : bug.remarks || "No supplementary notes provided";

              return (
                  <motion.tr 
                    key={bug.id || `${bug.no}-${idx}`} 
                    onClick={() => onViewDetail?.(bug)}
                    initial={false}
                    animate={isExporting ? { opacity: 1, x: 0, scale: 1 } : {}}
                    className={cn(
                      "transition-colors group align-middle cursor-pointer h-20",
                      dark ? "hover:bg-blue-600/5 text-slate-300" : "hover:bg-slate-50/50 text-slate-700",
                      idx % 2 === 0 ? "" : (dark ? "bg-slate-800/10" : "bg-slate-50/20")
                    )}
                  >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={cn("text-xs font-black", dark ? "text-slate-500" : "text-slate-400")}>
                      {bug.no}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className={cn("font-bold text-xs truncate max-w-[200px]", dark ? "text-white" : "text-slate-900")} title={bug.projectName}>{bug.projectName}</div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">PIC PROJECT</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className={cn("font-bold text-xs truncate max-w-[130px]", dark ? "text-slate-200" : "text-slate-900")}>{bug.devName}</div>
                      <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest px-1.5 py-0.5 bg-slate-800/40 rounded border border-slate-700/50">
                        {bug.statusPic}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.15em] border inline-block min-w-[45px]",
                      (bug.type || "").toUpperCase().includes('BUG') 
                        ? (dark ? "text-orange-400 bg-orange-500/10 border-orange-500/20" : "text-orange-700 bg-orange-50 border-orange-200")
                        : (dark ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-emerald-700 bg-emerald-50 border-emerald-200")
                    )}>
                      {(bug.type || "").toUpperCase().includes('BUG') ? "BUG" : "CR"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.15em] border inline-block min-w-[70px]",
                      bug.severity === "Critical" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      bug.severity === "Major" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                      bug.severity === "Minor" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      bug.severity === "Recurring" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                      "bg-slate-800 text-slate-400 border-slate-700"
                    )}>
                      {bug.severity?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className={cn(
                      "font-black text-xs",
                      bug.bugScore >= 5 ? "text-red-400" : bug.bugScore >= 3 ? "text-orange-400" : "text-emerald-400"
                    )}>
                      {bug.bugScore}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{bug.typeTesting || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">
                        REALIZED: {bug.sitRealizedDate && bug.sitRealizedDate !== "-" ? (
                          /^\d{4}-\d{2}-\d{2}/.test(bug.sitRealizedDate) 
                            ? format(new Date(bug.sitRealizedDate), "dd-MMM-yyyy").toUpperCase()
                            : bug.sitRealizedDate
                        ) : "-"}
                      </span>
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded inline-block w-fit",
                        bug.includedInFsd === "Ya" 
                          ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                          : "border border-slate-700 text-slate-500"
                      )}>
                        {bug.includedInFsd === "Ya" ? "FSD INCLUDED" : "NO FSD"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3 w-full max-w-[400px]">
                      {normalizeStatus(bug.statusDev) === "DONE" && (
                        <div className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded inline-flex items-center gap-1 text-[9px] font-black tracking-widest">
                          <CheckCircle2 className="w-3 h-3" />
                          DONE
                        </div>
                      )}
                      <div className={cn(
                        "text-[10px] font-medium text-slate-300 truncate max-w-xs",
                        normalizeStatus(bug.statusDev) !== "DONE" && "opacity-70"
                      )}>
                        {bug.remarks || "No supplementary notes provided"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {bug.last_updated || bug.last_edited_at ? format(new Date(bug.last_updated || bug.last_edited_at!), "dd-MMM-yyyy").toUpperCase() : "-"}
                      </div>
                      <div className="text-[9px] font-bold text-slate-500 pl-4.5">
                        {bug.last_updated || bug.last_edited_at ? format(new Date(bug.last_updated || bug.last_edited_at!), "HH:mm") : "-"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 max-w-[140px]">
                       <User className="w-3 h-3 text-slate-600 shrink-0" />
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">
                         {bug.last_edited_by || "System Bulk Import"}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      {bug.periode}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetail?.(bug);
                        }}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700/50 rounded-md transition-all border border-slate-700 shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-500" />
                      </motion.button>
                      {isSuperAdmin && (
                        isTrashView ? (
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (bug.id && onRestoreBug) onRestoreBug(bug.id);
                            }}
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-md transition-all border border-emerald-500/20 shrink-0"
                          >
                            <Undo2 className="w-3.5 h-3.5 text-emerald-500" />
                          </motion.button>
                        ) : (
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (bug.id && onDeleteBug) onDeleteBug(bug.id);
                            }}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-all border border-red-500/20 shrink-0 group/trash"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500 group-hover:text-red-400 transition-colors" />
                          </motion.button>
                        )
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tier 3: Pagination Footer (Fixed) */}
      <div className={cn(
        "p-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 px-8 bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl z-40 sticky bottom-0 no-export rounded-b-3xl"
      )}>
        <div className="flex items-center gap-6">
          <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] flex items-center gap-2">
            VOLUME: <span className="text-white font-display text-xs">{filteredBugs.length}</span> ISSUES
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">ROWS:</span>
            <select 
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg text-[10px] font-black px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {[10, 25, 50].map(v => <option key={v} value={v} className="bg-slate-900">{v}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-10 active:scale-90"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-1">
            {(() => {
              const maxVisiblePages = 5;
              let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
              let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
              
              if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
              }
              
              const pages = [];
              for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
              }
              
              return pages.map(pageNum => (
                 <button
                  key={`page-${pageNum}`}
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    "w-7 h-7 rounded-lg text-[10px] font-black transition-all",
                    currentPage === pageNum 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" 
                      : "text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                  )}
                 >
                   {pageNum}
                 </button>
              ));
            })()}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="text-slate-700 px-1"><MoreHorizontal className="w-3 h-3" /></span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-7 h-7 rounded-lg text-[10px] font-black text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-10 active:scale-90"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Detail Modal moved to App.tsx */}
    </div>
  );
}

export function SummaryCard({ label, value, icon, theme }: { label: string, value: string, icon: React.ReactNode, theme: string }) {
  const themes: Record<string, string> = {
    blue: "text-blue-400",
    amber: "text-amber-400",
    cyan: "text-cyan-400",
    red: "text-red-400",
    green: "text-green-400",
  };

  const iconColors: Record<string, string> = {
    blue: "bg-blue-500/20 text-blue-500",
    amber: "bg-amber-500/20 text-amber-500",
    cyan: "bg-cyan-500/20 text-cyan-500",
    red: "bg-red-500/20 text-red-500",
    green: "bg-green-500/20 text-green-500",
  };

  return (
    <div className={cn("p-5 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col gap-3 transition-all hover:bg-white/10 shadow-xl relative overflow-hidden group")}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-white/10 transition-all"></div>
      <div className="flex items-center justify-between relative z-10">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
        <div className={cn("p-2 rounded-xl shrink-0 shadow-lg", iconColors[theme])}>
          {icon}
        </div>
      </div>
      <div className={cn("text-base font-bold truncate tracking-tight uppercase relative z-10", themes[theme])}>{value}</div>
    </div>
  );
}

export function MetaRow({ 
  label, 
  value, 
  isEditing, 
  type = "text", 
  options = [], 
  editValue, 
  onEdit,
  highlight
}: { 
  label: string;
  value: string;
  isEditing?: boolean;
  type?: "text" | "date" | "select";
  options?: string[];
  editValue?: string;
  onEdit?: (val: string) => void;
  highlight?: boolean;
}) {
  const isPending = !value || value === "-" || value === "Pending" || value === "Awaiting Response" || value === "Pending Identification";
  const displayValue = type === "date" && value 
    ? (!isNaN(new Date(value).getTime()) ? format(new Date(value), "dd-MMM-yyyy").toUpperCase() : value)
    : (value || "—");

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-0">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      
      {isEditing ? (
        <div className="w-[140px]">
          {type === "select" ? (
            <select
              value={editValue || ""}
              onChange={(e) => onEdit?.(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
            >
              <option value="">— Select —</option>
              {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <input
              type={type}
              value={editValue || ""}
              onChange={(e) => onEdit?.(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
            />
          )}
        </div>
      ) : (
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-tight",
          isPending || highlight ? "text-orange-500/80 italic" : "text-slate-300"
        )}>
          {displayValue}
        </span>
      )}
    </div>
  );
}

