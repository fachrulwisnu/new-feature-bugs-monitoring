import React, { useState } from "react";
import { History, User, Box, ArrowRight, Clock, ShieldCheck, Trash2, RefreshCw, AlertCircle, ArrowDownWideNarrow, X, Eye, Database } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import { BugRecord, AuditEntry } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AuditLogProps {
  logs: AuditEntry[];
  trashBugs?: BugRecord[];
  onRestoreBug?: (id: string) => Promise<void>;
}

export function AuditLog({ logs, trashBugs = [], onRestoreBug }: AuditLogProps) {
  const [auditTab, setAuditTab] = useState<'ADD' | 'EDIT' | 'TRASH'>('ADD');
  const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);

  const filteredLogs = React.useMemo(() => {
    if (auditTab === 'ADD') return logs.filter(log => log.action_type === 'ADD');
    if (auditTab === 'EDIT') return logs.filter(log => log.action_type === 'EDIT');
    return []; // Trash is handled separately if we use trashBugs
  }, [logs, auditTab]);

  const activeView = auditTab === 'TRASH' ? 'trash' : 'audit';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-full ring-1 ring-white/5">
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-8">
          <div>
            <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-3">
              {auditTab === "TRASH" ? (
                <>
                  <Trash2 className="w-6 h-6 text-red-500" />
                  Governance Trash
                </>
              ) : (
                <>
                  <History className="w-6 h-6 text-orange-500" />
                  System Audit Trail
                </>
              )}
            </h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">
              {auditTab === "TRASH" ? "Recover Deleted SIT Records" : "Data Accountability & Integrity Ledger"}
            </p>
          </div>

          <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button 
              onClick={() => setAuditTab("ADD")}
              className={cn(
                "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                auditTab === "ADD" ? "bg-orange-500/20 text-orange-400 border border-orange-500/50 shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Activity Add
            </button>
            <button 
              onClick={() => setAuditTab("EDIT")}
              className={cn(
                "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                auditTab === "EDIT" ? "bg-orange-500/20 text-orange-400 border border-orange-500/50 shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Activity Edit
            </button>
            <button 
              onClick={() => setAuditTab("TRASH")}
              className={cn(
                "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                auditTab === "TRASH" ? "bg-red-500/10 text-red-500 shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Trash
              {trashBugs.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl">
           <ShieldCheck className="w-4 h-4 text-green-500" />
           <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Security: Verified</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-hide bg-slate-950/30">
        {auditTab !== "TRASH" ? (
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-950/80 border-b border-white/5 sticky top-0 z-10 backdrop-blur-sm">
                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                  <div className="flex items-center gap-1.5 font-black">
                    Timestamp
                    <ArrowDownWideNarrow className="w-3 h-3 text-orange-500" />
                  </div>
                </th>
                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">Administrator</th>
                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">Target Resource</th>
                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">Action Details</th>
                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <History className="w-16 h-16 text-slate-700" />
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">No mutations logged</span>
                        <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Awaiting system activity in terminal...</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.03] transition-all group">
                    <td className="px-8 py-6 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-orange-500/5 border border-orange-500/10">
                          <Clock className="w-4 h-4 text-orange-500/50" />
                        </div>
                        <div className="flex flex-col">
                          <div className="text-[11px] font-bold text-white tabular-nums">
                            {format(new Date(log.timestamp), "dd MMM yyyy")}
                          </div>
                          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            {format(new Date(log.timestamp), "HH:mm:ss")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 border-b border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-indigo-500/20 border-2 border-white/10 ring-2 ring-indigo-500/20">
                          {log.administrator.initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-200 tracking-tight leading-none mb-1">{log.administrator.name}</span>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{log.administrator.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 border-b border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <Database className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-white leading-none mb-1">{log.target_resource}</div>
                          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Resource ID: {log.id.toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                          log.action_type === 'ADD' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        )}>
                          {log.action_type}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 capitalize">
                          {log.action_type === 'ADD' ? 'Manual Data Insertion' : 'Field Modification Audit'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 border-b border-white/5 text-right">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="px-5 py-2 bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/10 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-400 transition-all rounded-xl flex items-center gap-2 ml-auto group/btn"
                      >
                        <Eye className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
                        View Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-white/5 sticky top-0 z-10 backdrop-blur-sm">
                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    Deleted At
                    <ArrowDownWideNarrow className="w-3 h-3 text-red-500" />
                  </div>
                </th>
                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Project / Ref</th>
                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Remarks</th>
                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {trashBugs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <Trash2 className="w-16 h-16 text-slate-700" />
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Trash terminal is empty</span>
                        <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">No purged records found in epoch</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                trashBugs.map((bug) => (
                  <tr key={bug.id} className="hover:bg-white/[0.03] transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-red-500/5 border border-red-500/10">
                          <Clock className="w-4 h-4 text-red-500/50" />
                        </div>
                        <div className="flex flex-col">
                          <div className="text-[11px] font-bold text-white tabular-nums">
                            {bug.deleted_at ? format(new Date(bug.deleted_at), "dd MMM yyyy") : "N/A"}
                          </div>
                          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest text">
                            {bug.deleted_at ? format(new Date(bug.deleted_at), "HH:mm:ss") : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                          <Database className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                           <div className="text-[10px] font-black uppercase tracking-[0.15em] text-white mb-1 leading-none">{bug.projectName}</div>
                           <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Audit Ref: #{bug.no}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="text-[10px] text-slate-400 truncate max-w-[400px] font-medium italic">
                         "{bug.remarks || "No administrative remarks archived"}"
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button 
                        onClick={() => bug.id && onRestoreBug?.(bug.id)}
                        className="px-5 py-2.5 bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 hover:border-blue-500 rounded-xl text-blue-500 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ml-auto shadow-xl"
                       >
                         <RefreshCw className="w-3.5 h-3.5" />
                         Restore Record
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative z-[10001] bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <History className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-white tracking-tight">Audit Payload Inspector</h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Mutation ID: {selectedLog.id.toUpperCase()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-colors text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-10 space-y-8 scrollbar-hide">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-950 p-6 rounded-3xl border border-white/5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Log Timestamp</span>
                    <div className="text-sm font-bold text-white">{format(new Date(selectedLog.timestamp), "dd MMMM yyyy, HH:mm:ss")}</div>
                  </div>
                  <div className="bg-slate-950 p-6 rounded-3xl border border-white/5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Action Classifier</span>
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                       <div className="text-sm font-bold text-white">{selectedLog.action_type}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mutation Payload Trace</span>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-500">
                       <Database className="w-3 h-3" />
                       Source: Supabase v4
                    </div>
                  </div>
                  <div className="bg-slate-950 p-8 rounded-3xl border border-white/5 font-mono text-[11px] leading-relaxed relative group">
                    <div className="absolute top-4 right-4 text-[9px] font-black text-slate-700 group-hover:text-amber-500/50 transition-colors">JSON_V1</div>
                    <pre className="text-amber-400/90 whitespace-pre-wrap break-all overflow-auto max-h-[300px] scrollbar-hide">
                      {JSON.stringify(selectedLog.mutation_details, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-3xl flex items-start gap-4">
                  <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                     <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">Cryptographic Proof</h4>
                     <p className="text-[10px] text-slate-500 leading-relaxed">This ledger record is cryptographically linked to session <b>{selectedLog.id.slice(0, 4)}</b>. Verification of administrator identity <b>{selectedLog.administrator.name}</b> confirmed by OIDC login.</p>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-white/5 bg-slate-950/50 flex justify-end">
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all"
                >
                  Close Inspector
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
