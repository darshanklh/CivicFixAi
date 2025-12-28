// src/components/IssueDetailModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';

const IssueDetailModal = ({ issue, onClose }) => {
  if (!issue) return null;

  const { category, severity, summary } = issue.aiAnalysis || {};

  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'Critical': return 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
      case 'High': return 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.2)]';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]';
      default: return 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]';
    }
  };

  const getStatusColor = (status) => {
    const s = status ? status.toUpperCase() : 'OPEN';
    switch (s) {
      case 'RESOLVED': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'IN_PROGRESS': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          // --- FIX APPLIED HERE ---
          // 1. md:h-[85vh]: Force fixed height on desktop so children know when to scroll.
          // 2. md:overflow-hidden: Clips the outer rounded corners.
          className="bg-slate-900 w-full max-w-4xl max-h-[85vh] md:h-[85vh] rounded-3xl shadow-2xl border border-slate-700 relative flex flex-col md:flex-row z-10 overflow-y-auto md:overflow-hidden"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-slate-700 text-white rounded-full transition-colors z-30 backdrop-blur-md border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* LEFT SIDE: Image */}
          {/* Mobile: h-56 fixed. Desktop: h-full (fills the 85vh parent) */}
          <div className="w-full md:w-1/2 h-56 md:h-full bg-slate-950 relative border-b md:border-b-0 md:border-r border-slate-800 shrink-0">
            <img 
              src={issue.imageUrl} 
              alt={category} 
              className="absolute inset-0 w-full h-full object-cover opacity-90"
            />
            {/* Gradient for mobile text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent md:hidden opacity-60"></div>
          </div>

          {/* RIGHT SIDE: Details */}
          {/* Mobile: h-auto. Desktop: h-full + overflow-y-auto (Scrolls inside the fixed 85vh parent) */}
          <div className="w-full md:w-1/2 flex flex-col h-auto md:h-full md:overflow-y-auto bg-slate-900 custom-scrollbar relative">
            <div className="p-6 md:p-8 space-y-6">
              
              {/* Header */}
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getSeverityColor(severity)}`}>
                    {severity || "Medium"} Severity
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(issue.status)}`}>
                    {issue.status || "Open"}
                  </span>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                  {issue.title || category || "Reported Issue"}
                </h2>
                
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  <span>Reported on {new Date(issue.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                </div>
              </div>

              <hr className="border-slate-800" />

              {/* Description */}
              <div>
                <h3 className="text-sm font-bold text-slate-300 uppercase mb-2 tracking-wider">Description</h3>
                <p className="text-slate-400 leading-relaxed text-base md:text-lg font-light break-words">
                  {issue.description || summary}
                </p>
              </div>

              {/* Location */}
              {issue.locationText && (
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-200 mb-1">
                    <MapPin className="w-4 h-4 text-blue-500" /> Location
                  </h3>
                  <p className="text-slate-400 ml-6 text-sm">{issue.locationText}</p>
                </div>
              )}

              {/* AI Analysis */}
              {issue.aiAnalysis && (
                <div className="bg-indigo-950/30 rounded-2xl p-5 border border-indigo-500/20 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-200">
                    <ShieldAlert className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold">AI Safety Insights</h3>
                  </div>

                  {issue.aiAnalysis.precautions && (
                    <div>
                      <p className="text-xs font-bold text-indigo-400 uppercase mb-2">Precautions</p>
                      <ul className="space-y-2">
                        {issue.aiAnalysis.precautions.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-indigo-200/80">
                            <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {issue.aiAnalysis.diyFixes && (
                    <div>
                      <p className="text-xs font-bold text-indigo-400 uppercase mb-2 mt-4">Temporary Fixes</p>
                      <ul className="space-y-2">
                        {issue.aiAnalysis.diyFixes.map((fix, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-indigo-200/80">
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            {fix}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default IssueDetailModal;
