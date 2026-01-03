// src/components/AdminDashboard.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, Trash2, MapPin, HardHat, Truck, Cone, Siren, 
  ClipboardCheck, Zap, Droplets, Shovel, Wrench, Send, PlayCircle, IndianRupee,
  LayoutDashboard, BarChart3, Users, Settings, TrendingUp, Menu, X, ChevronLeft,
  FileText, Calendar, Star, Shield, Cpu, Radio, Globe, AlertOctagon, ToggleLeft, ToggleRight, Save, User, ArrowRight, Download, Bell, Volume2, RefreshCw, Database,
  MessageCircle // <--- NEW IMPORT
} from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore'; 
import { db } from '../firebase'; 
import ConfirmationModal from './ConfirmationModal'; 
import ChatModal from './ChatModal'; // <--- NEW IMPORT

// --- 1. BACKGROUND ANIMATION ---
const LiveRoadBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-900 z-0 pointer-events-none">
      <div className="absolute inset-0 flex justify-center opacity-50">
        <div className="w-full max-w-4xl h-full border-x-2 border-slate-700 relative bg-slate-800">
          <motion.div 
            initial={{ y: -200 }}
            animate={{ y: 0 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute inset-0 flex justify-center"
          >
            <div className="w-4 h-[200%] border-l-4 border-dashed border-yellow-500/30"></div>
          </motion.div>
        </div>
      </div>
      <motion.div
        initial={{ x: -200, y: 100, opacity: 0 }}
        animate={{ x: ['-10%', '110%'], y: [100, 100], opacity: [0, 1, 1, 0] }}
        transition={{ repeat: Infinity, duration: 20, delay: 2 }}
        className="absolute top-1/3 left-0 z-10"
      >
        <div className="flex items-center gap-2 bg-blue-600/20 p-2 rounded-xl backdrop-blur-sm border border-blue-500/50 shadow-[0_0_30px_rgba(37,99,235,0.3)]">
            <Truck className="w-10 h-10 text-blue-400" />
            <div className="flex flex-col">
              <span className="text-blue-400 font-bold text-[10px] uppercase tracking-widest leading-none">Sector A</span>
              <span className="text-white font-bold text-xs uppercase tracking-widest leading-none">Patrol</span>
            </div>
        </div>
      </motion.div>
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: 1200, x: Math.random() * (window.innerWidth / 2) + (window.innerWidth / 4) }} 
          animate={{ y: -200 }}
          transition={{ repeat: Infinity, duration: 5 + Math.random() * 8, delay: Math.random() * 5, ease: "linear" }}
          className="absolute z-0 opacity-40"
        >
          <div className="flex flex-col items-center">
              <Truck className="w-12 h-12 text-slate-600 transform -scale-y-100" /> 
              <div className="flex gap-4 mt-[-8px]">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 blur-[2px]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 blur-[2px]"></div>
              </div>
          </div>
        </motion.div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/90 z-0"></div>
    </div>
  );
};

// --- 2. ANALYTICS ---
const AnalyticsView = ({ issues }) => {
    const total = issues.length || 1;
    const resolved = issues.filter(i => i.status === 'Resolved').length;
    const utilization = Math.round((resolved / total) * 100) || 0;
    const criticalCount = issues.filter(i => i.aiAnalysis?.severity === 'Critical' || i.aiAnalysis?.severity === 'High').length;

    const categoryData = useMemo(() => {
        const counts = {};
        let maxCount = 0;
        issues.forEach(i => {
            const cat = i.aiAnalysis?.category || 'Other';
            const safeCat = cat.split(' ')[0]; 
            counts[safeCat] = (counts[safeCat] || 0) + 1;
            if (counts[safeCat] > maxCount) maxCount = counts[safeCat];
        });
        const standardCats = ['Water', 'Potholes', 'Garbage', 'Street', 'Manhole'];
        return standardCats.map(cat => ({
            label: cat,
            count: counts[cat] || 0,
            height: maxCount > 0 ? ((counts[cat] || 0) / maxCount) * 100 : 0
        }));
    }, [issues]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2"><BarChart3 className="w-6 h-6 text-purple-400"/> Operational Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 p-6 rounded-2xl shadow-xl">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Resolution Rate</p>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-white">{utilization}%</span>
                        <span className="text-green-400 text-xs font-bold mb-1 flex items-center"><TrendingUp className="w-3 h-3 mr-1"/> Live</span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 mt-4 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${utilization}%` }}></div>
                    </div>
                </div>
                <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 p-6 rounded-2xl shadow-xl">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Avg Response Time</p>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-white">2.4h</span>
                        <span className="text-slate-500 text-xs font-bold mb-1">Gemini Est.</span>
                    </div>
                    <div className="mt-4 flex gap-1">
                        {[1,2,3,4,5].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= 3 ? 'bg-blue-500' : 'bg-slate-700'}`}></div>)}
                    </div>
                </div>
                <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 p-6 rounded-2xl shadow-xl">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">High Severity</p>
                    <div className="flex items-end gap-2">
                        <span className={`text-4xl font-black ${criticalCount > 0 ? 'text-red-500' : 'text-slate-200'}`}>{criticalCount}</span>
                        <span className="text-orange-400/60 text-xs font-bold mb-1">Critical Zones</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-4">{criticalCount > 0 ? "Dispatch Immediately." : "Situation Stable."}</p>
                </div>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><BarChart3 className="w-32 h-32 text-white" /></div>
                <h3 className="text-lg font-bold text-white mb-6">Live Issue Frequency</h3>
                <div className="flex items-end justify-between h-48 gap-4 px-4">
                    {categoryData.map((data, i) => (
                        <div key={data.label} className="flex flex-col items-center gap-2 flex-1 group">
                            <div className="w-full bg-slate-700/50 rounded-t-lg relative h-full flex items-end overflow-hidden hover:bg-slate-700/80 transition-colors cursor-pointer">
                                <motion.div 
                                    initial={{ height: 0 }} 
                                    animate={{ height: `${data.height}%` }} 
                                    transition={{ duration: 1, delay: i * 0.1 }}
                                    className="w-full bg-blue-600 opacity-80 group-hover:opacity-100 flex items-start justify-center pt-2 text-xs font-bold text-white/80"
                                >
                                    {data.count > 0 && data.count}
                                </motion.div>
                            </div>
                            <span className="text-[10px] md:text-xs font-bold text-slate-400 text-center truncate w-full">{data.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- 3. CONTRACTOR PROFILE MODAL (FIXED) ---
const ContractorProfileModal = ({ name, issues, onClose }) => {
    const history = issues.filter(i => i.contractorName === name && i.status === 'Resolved');
    
    const totalJobs = history.length;
    const totalRevenue = history.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
    
    const ratedJobs = history.filter(h => h.rating > 0);
    const avgRating = ratedJobs.length > 0 
        ? (ratedJobs.reduce((acc, curr) => acc + curr.rating, 0) / ratedJobs.length).toFixed(1) 
        : 'New';

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
                <div className="p-8 bg-gradient-to-r from-blue-900/40 to-slate-900 border-b border-slate-700 flex justify-between items-start">
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 bg-slate-800 rounded-full border-2 border-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <User className="w-10 h-10 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">{name}</h2>
                            <p className="text-blue-400 text-sm font-bold uppercase tracking-wider mb-2">Verified Contractor</p>
                            <div className="flex gap-2">
                                <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded border border-slate-700 flex items-center gap-1">
                                    <MapPin className="w-3 h-3"/> {history[0]?.city || "Unknown Location"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"><X className="w-6 h-6"/></button>
                </div>

                <div className="grid grid-cols-3 gap-4 p-6 border-b border-slate-800">
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 text-center">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Revenue</p>
                        <p className="text-2xl font-black text-emerald-400 mt-1">₹{totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 text-center">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Performance</p>
                        <div className="flex items-center justify-center gap-1 mt-1 text-2xl font-black text-yellow-400">
                            {avgRating} <Star className="w-5 h-5 fill-yellow-400"/>
                        </div>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 text-center">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Jobs Done</p>
                        <p className="text-2xl font-black text-blue-400 mt-1">{totalJobs}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-0 bg-slate-950/30">
                    <div className="p-4 sticky top-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-10 flex justify-between items-center">
                        <h3 className="font-bold text-slate-300">Work History</h3>
                        <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Latest First</span>
                    </div>
                    
                    <div className="divide-y divide-slate-800">
                        {history.length === 0 ? (
                            <div className="p-10 text-center text-slate-500">No completed jobs found for this profile.</div>
                        ) : (
                            history.map(job => (
                                <div key={job.id} className="p-4 hover:bg-slate-800/30 transition-colors flex justify-between items-center">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-slate-500">{new Date(job.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                            {job.rating ? (
                                                <span className="flex items-center gap-0.5 text-[10px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/20 font-bold">
                                                    {job.rating} <Star className="w-2 h-2 fill-yellow-500"/>
                                                </span>
                                            ) : (
                                                <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">No Rating</span>
                                            )}
                                        </div>
                                        <p className="text-white font-bold text-sm truncate">{job.title}</p>
                                        <p className="text-slate-400 text-xs truncate flex items-center gap-1 mt-0.5">
                                            <MapPin className="w-3 h-3"/> {job.city}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-emerald-400 font-mono font-bold">₹{job.price}</p>
                                        <p className="text-[10px] text-emerald-500/60 font-bold uppercase">Paid</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// --- 4. UNIT LOGS MODAL ---
const UnitLogsModal = ({ unit, issues, onClose, onSelectContractor }) => {
    const logs = issues.filter(i => i.assignedTo === unit.id && i.status === 'Resolved');

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
                <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${unit.baseColor} bg-opacity-20 border border-opacity-30`}>
                            {unit.icon}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">{unit.id} Logs</h2>
                            <p className="text-xs text-slate-400 font-mono">UNIT ID: {unit.id.toUpperCase()}-001</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-0">
                    {logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <FileText className="w-12 h-12 mb-4 opacity-50" />
                            <p>No completed job history found for this unit.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-950/50 text-xs uppercase font-bold text-slate-500 sticky top-0 backdrop-blur-md">
                                <tr>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Contractor Identity</th>
                                    <th className="p-4">Issue</th>
                                    <th className="p-4">Location</th>
                                    <th className="p-4">Rating</th>
                                    <th className="p-4 text-right">Earnings</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="p-4 text-slate-400 text-xs font-mono">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(log.createdAt?.seconds * 1000).toLocaleDateString()}
                                            </div>
                                        </td>
                                        
                                        <td className="p-4">
                                            {log.contractorName ? (
                                                <button 
                                                    onClick={() => onSelectContractor(log.contractorName)}
                                                    className="flex items-center gap-2 text-white font-bold hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-slate-800 border border-transparent hover:border-slate-700"
                                                >
                                                    <div className="p-1 rounded bg-slate-700 border border-slate-600">
                                                        <User className="w-3 h-3 text-blue-400"/>
                                                    </div>
                                                    {log.contractorName}
                                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -ml-1" />
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-500 italic">
                                                    <div className="p-1 rounded bg-slate-800 border border-slate-700 opacity-50">
                                                        <User className="w-3 h-3"/>
                                                    </div>
                                                    Unknown
                                                </div>
                                            )}
                                        </td>

                                        <td className="p-4 font-medium max-w-[200px] truncate text-slate-300" title={log.title}>{log.title}</td>
                                        
                                        <td className="p-4 text-xs text-slate-400 max-w-[150px] truncate">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0"/> 
                                                <span>
                                                    {log.city && log.state ? `${log.city}, ${log.state}` : 
                                                     log.locationText ? log.locationText.split(',')[0] : 
                                                     "Unknown Location"}
                                                </span>
                                            </div>
                                        </td>
                                        
                                        <td className="p-4 text-yellow-400 font-bold text-xs">
                                            {log.rating ? <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400" /> {log.rating}/5</span> : <span className="text-slate-600">-</span>}
                                        </td>
                                        
                                        <td className="p-4 text-right text-emerald-400 font-mono font-bold">₹{log.price || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// --- 5. WORKFORCE ---
const WorkforceView = ({ issues }) => {
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [viewProfile, setViewProfile] = useState(null); 

    const departments = [
        { id: 'Electrician', icon: <Zap className="w-4 h-4"/>, baseColor: 'text-yellow-500' },
        { id: 'Plumber', icon: <Droplets className="w-4 h-4"/>, baseColor: 'text-blue-500' },
        { id: 'Road Maintenance', icon: <Cone className="w-4 h-4"/>, baseColor: 'text-orange-500' },
        { id: 'Garbage Collector', icon: <Truck className="w-4 h-4"/>, baseColor: 'text-green-500' },
        { id: 'All Rounder', icon: <Wrench className="w-4 h-4"/>, baseColor: 'text-purple-500' },
    ];

    const unitStats = departments.map(dept => {
        const deptIssues = issues.filter(i => i.assignedTo === dept.id);
        const active = deptIssues.filter(i => i.status === 'Accepted' || i.status === 'In Progress').length;
        const resolved = deptIssues.filter(i => i.status === 'Resolved');
        const totalRating = resolved.reduce((acc, curr) => acc + (curr.rating || 0), 0);
        const avgRating = resolved.length > 0 ? (totalRating / resolved.length).toFixed(1) : 'N/A';
        const earnings = resolved.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
        return { ...dept, activeJobs: active, rating: avgRating, earnings: earnings, status: active > 3 ? 'Busy' : 'Online' };
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Users className="w-6 h-6 text-orange-400"/> Live Contractor Status</h2>
            
            <AnimatePresence>
                {selectedUnit && (
                    <UnitLogsModal 
                        unit={selectedUnit} 
                        issues={issues} 
                        onClose={() => setSelectedUnit(null)} 
                        onSelectContractor={(name) => setViewProfile(name)} 
                    />
                )}
                {viewProfile && (
                    <ContractorProfileModal 
                        name={viewProfile} 
                        issues={issues} 
                        onClose={() => setViewProfile(null)} 
                    />
                )}
            </AnimatePresence>

            <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-900/50 text-xs uppercase font-bold text-slate-500">
                            <tr>
                                <th className="p-4">Unit Type</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Active</th>
                                <th className="p-4">Rating</th>
                                <th className="p-4">Total Payout</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {unitStats.map((unit) => (
                                <tr key={unit.id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4 font-bold text-white flex items-center gap-2"><span className={`${unit.baseColor}`}>{unit.icon}</span> {unit.id}</td>
                                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase flex w-fit items-center gap-1 ${unit.status === 'Online' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}><span className={`w-1.5 h-1.5 rounded-full ${unit.status === 'Online' ? 'bg-green-400 animate-pulse' : 'bg-orange-400'}`}></span>{unit.status}</span></td>
                                    <td className="p-4 text-white font-mono">{unit.activeJobs}</td>
                                    <td className="p-4 text-yellow-400 font-bold">{unit.rating === 'N/A' ? '-' : `${unit.rating} ★`}</td>
                                    <td className="p-4 text-emerald-400 font-mono">₹{unit.earnings.toLocaleString()}</td>
                                    <td className="p-4 text-right"><button onClick={() => setSelectedUnit(unit)} className="text-blue-400 hover:text-white text-xs font-bold border border-blue-500/30 hover:bg-blue-600 px-3 py-1 rounded transition-all">Logs</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- 6. SYSTEM SETTINGS (FUNCTIONAL - Sound & CSV) ---
const SystemSettingsView = ({ issues }) => {
    // 1. Load preferences from LocalStorage
    const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('admin_sound') !== 'false');
    const [notifications, setNotifications] = useState(() => localStorage.getItem('admin_notify') === 'true');

    // 2. Persist changes to LocalStorage
    const toggleSound = () => {
        const newValue = !soundEnabled;
        setSoundEnabled(newValue);
        localStorage.setItem('admin_sound', newValue);
    };

    const toggleNotifications = async () => {
        const newValue = !notifications;
        setNotifications(newValue);
        localStorage.setItem('admin_notify', newValue);
        
        // Request browser permission if turning ON
        if (newValue && Notification.permission !== 'granted') {
            await Notification.requestPermission();
        }
    };

    const handleExportCSV = () => {
        if (!issues || issues.length === 0) return alert("No data to export.");
        const headers = ["ID,Title,Category,Status,City,Contractor,Date"];
        const rows = issues.map(issue => {
            const date = new Date(issue.createdAt?.seconds * 1000).toLocaleDateString();
            const safeTitle = (issue.title || "").replace(/,/g, " "); 
            return `${issue.id},${safeTitle},${issue.aiAnalysis?.category || "General"},${issue.status},${issue.city},${issue.contractorName || "Unassigned"},${date}`;
        });
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "civic_reports_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-slate-400"/> Admin Preferences
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. DATA MANAGEMENT CARD */}
                <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Database className="w-24 h-24 text-blue-500" /></div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Download className="w-5 h-5 text-blue-400"/> Data Management
                    </h3>
                    <div className="space-y-4 relative z-10">
                        <p className="text-sm text-slate-400">Download report data for offline analysis or official record keeping.</p>
                        
                        <button 
                            onClick={handleExportCSV}
                            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                        >
                            <Download className="w-4 h-4" /> Export All Reports (CSV)
                        </button>

                        <div className="pt-4 border-t border-slate-700/50">
                            <button 
                                onClick={handleRefresh}
                                className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-bold py-2 rounded-lg transition-all"
                            >
                                <RefreshCw className="w-4 h-4" /> Clear Cache & Reload
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. NOTIFICATIONS CARD */}
                <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Bell className="w-24 h-24 text-yellow-500" /></div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-yellow-400"/> Alert Preferences
                    </h3>
                    
                    <div className="space-y-4 relative z-10">
                        {/* Sound Toggle */}
                        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-800 rounded-lg"><Volume2 className="w-4 h-4 text-slate-300"/></div>
                                <div>
                                    <p className="text-sm font-bold text-slate-200">Sound Effects</p>
                                    <p className="text-xs text-slate-500">Play sound on new report</p>
                                </div>
                            </div>
                            <button 
                                onClick={toggleSound}
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${soundEnabled ? 'bg-green-500' : 'bg-slate-600'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Banner Toggle */}
                        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-800 rounded-lg"><Bell className="w-4 h-4 text-slate-300"/></div>
                                <div>
                                    <p className="text-sm font-bold text-slate-200">Desktop Banners</p>
                                    <p className="text-xs text-slate-500">Show popup for urgent issues</p>
                                </div>
                            </div>
                            <button 
                                onClick={toggleNotifications}
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${notifications ? 'bg-green-500' : 'bg-slate-600'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 7. MAIN DASHBOARD WRAPPER (UPDATED SIDEBAR POSITION) ---
const AdminDashboard = ({ issues, onUpdateStatus, onDelete }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Initially closed

  const [assigningId, setAssigningId] = useState(null);
  const [price, setPrice] = useState('');

  // --- NEW: AUTO-PLAY NOTIFICATIONS LOGIC ---
  const prevIssueCount = React.useRef(issues.length);

  // --- NEW: MODAL STATE ---
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  
  // --- NEW: CHAT STATE ---
  const [chatIssue, setChatIssue] = useState(null);

  
  useEffect(() => {
      // Check if new issues arrived (length increased)
      if (issues.length > prevIssueCount.current) {
          const soundOn = localStorage.getItem('admin_sound') !== 'false';
          const notifyOn = localStorage.getItem('admin_notify') === 'true';

          if (soundOn) {
              // Play a subtle chime sound
              const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"); 
              audio.volume = 0.5;
              audio.play().catch(e => console.log("Audio play failed (user interaction needed first)", e));
          }

          if (notifyOn && Notification.permission === 'granted') {
              new Notification("New Civic Issue Reported", {
                  body: "A new report has been submitted to the dashboard.",
                  icon: "/vite.svg" // Uses default vite icon or any public image
              });
          }
      }
      prevIssueCount.current = issues.length;
  }, [issues]);
  // -------------------------------------------

  const pendingCount = issues.filter(i => i.status !== 'Resolved').length;
  const resolvedCount = issues.filter(i => i.status === 'Resolved').length;

  const getStatusColor = (status) => {
    const s = status ? status.toLowerCase() : 'open';
    if (s === 'resolved') return 'bg-green-500/10 text-green-400 border-green-500/20';
    if (s === 'in progress') return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    if (s === 'accepted') return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  };

  const getStripeColor = (status) => {
    const s = status ? status.toLowerCase() : 'open';
    if (s === 'resolved') return 'bg-green-500';
    if (s === 'in progress') return 'bg-orange-500';
    if (s === 'accepted') return 'bg-indigo-500';
    return 'bg-blue-500';
  };

  const departments = [
    { id: 'Electrician', icon: <Zap className="w-4 h-4" />, color: 'bg-yellow-600' },
    { id: 'Plumber', icon: <Droplets className="w-4 h-4" />, color: 'bg-blue-600' },
    { id: 'Road Maintenance', icon: <Cone className="w-4 h-4" />, color: 'bg-orange-600' },
    { id: 'Garbage Collector', icon: <Truck className="w-4 h-4" />, color: 'bg-green-600' },
    { id: 'All Rounder', icon: <Wrench className="w-4 h-4" />, color: 'bg-purple-600' },
  ];

  // --- MODIFIED: Handle Forward with Confirmation ---
  const handleForward = (issueId, deptId) => {
    if (!price) return alert("Please assign a price for this job.");
    
    setConfirmModal({
        isOpen: true,
        type: 'info',
        title: 'Confirm Dispatch',
        message: `Are you sure you want to dispatch ${deptId} for a budget of ₹${price}?`,
        confirmText: 'Dispatch Unit',
        onConfirm: () => {
            onUpdateStatus(issueId, 'Accepted', { assignedTo: deptId, price: price });
            setAssigningId(null);
            setPrice('');
        }
    });
  };

  const toggleSidebar = (e) => {
      e.stopPropagation();
      setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="relative w-full h-full flex overflow-hidden bg-slate-900">
      
      {/* 1. BACKGROUND (Z-0) */}
      <LiveRoadBackground />

      {/* --- ADD MODAL HERE --- */}
      <ConfirmationModal 
        {...confirmModal} 
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
      />

      {/* --- ADD CHAT MODAL HERE --- */}
      <AnimatePresence>
        {chatIssue && (
            <ChatModal 
                issueId={chatIssue.id} 
                issueTitle={chatIssue.title} 
                currentUserRole="admin" 
                onClose={() => setChatIssue(null)} 
            />
        )}
      </AnimatePresence>

      {/* 2. BACKDROP OVERLAY (Mobile Only - Z-40) */}
      <AnimatePresence>
        {isSidebarOpen && window.innerWidth < 768 && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
        )}
      </AnimatePresence>

      {/* 3. SIDEBAR (Z-50) */}
      <motion.div 
          className={`
            fixed md:relative inset-y-0 left-0 z-50 bg-slate-900/90 backdrop-blur-xl border-r border-slate-700 flex flex-col shadow-2xl overflow-hidden
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
          animate={{ 
             width: isSidebarOpen ? 256 : 0, 
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onClick={(e) => e.stopPropagation()} 
      >
         <div className="p-6 border-b border-slate-700 flex items-center justify-between h-20">
            {isSidebarOpen ? (
                <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <Siren className="w-6 h-6 text-blue-500 animate-pulse" />
                    ADMIN<span className="text-blue-500">HQ</span>
                </motion.h1>
            ) : (
                <div className="w-full flex justify-center"><Siren className="w-8 h-8 text-blue-500" /></div>
            )}
            
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
            </button>
         </div>
         
         {/* SIDEBAR NAVIGATION - MOVED SETTINGS TO BOTTOM */}
         <div className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
            {/* Top Items */}
            {[
                { id: 'dashboard', label: 'Live Dispatch', icon: <LayoutDashboard className="w-5 h-5"/>, color: 'blue' },
                { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5"/>, color: 'purple' },
                { id: 'workforce', label: 'Workforce', icon: <Users className="w-5 h-5"/>, color: 'orange' },
            ].map(item => (
                <button 
                    key={item.id}
                    onClick={() => { setActiveView(item.id); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all whitespace-nowrap overflow-hidden
                    ${activeView === item.id 
                        ? `bg-${item.color}-600 text-white shadow-lg` 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                    title={!isSidebarOpen ? item.label : ""}
                >
                    <div className="flex-shrink-0">{item.icon}</div>
                    {isSidebarOpen && <span>{item.label}</span>}
                </button>
            ))}

            {/* Spacer pushes Settings to the bottom */}
            <div className="mt-auto"></div>

            {/* Settings Item */}
            <button 
                key="settings"
                onClick={() => { setActiveView('settings'); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all whitespace-nowrap overflow-hidden
                ${activeView === 'settings' 
                    ? `bg-green-600 text-white shadow-lg` 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
                title={!isSidebarOpen ? 'Settings' : ""}
            >
                <div className="flex-shrink-0"><Settings className="w-5 h-5"/></div>
                {isSidebarOpen && <span>Settings</span>}
            </button>
         </div>
      </motion.div>

      {/* 4. MAIN CONTENT (Z-10) */}
      <div 
        className="relative z-10 flex-1 h-full overflow-y-auto p-6 md:p-10"
        onClick={() => {
            if (isSidebarOpen) setIsSidebarOpen(false);
        }}
      >
        <div className="flex items-center justify-between mb-6">
            <button 
                onClick={toggleSidebar} 
                className="p-2 bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-xl text-white hover:bg-slate-700 transition-colors shadow-lg z-50"
            >
                {isSidebarOpen ? <ChevronLeft className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <span className="text-slate-400 font-bold text-sm tracking-widest uppercase md:hidden">Admin Panel</span>
        </div>

        {activeView === 'dashboard' && (
            <div className="animate-in fade-in zoom-in duration-300">
                <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold text-white">Command Center</h2>
                        <p className="text-slate-400 text-sm font-medium">Dispatch System Active</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 p-4 rounded-xl text-center min-w-[100px]">
                            <p className="text-slate-400 text-xs font-bold uppercase">Pending</p>
                            <p className="text-2xl font-bold text-orange-500">{pendingCount}</p>
                        </div>
                        <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 p-4 rounded-xl text-center min-w-[100px]">
                            <p className="text-slate-400 text-xs font-bold uppercase">Fixed</p>
                            <p className="text-2xl font-bold text-green-500">{resolvedCount}</p>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto space-y-4 pb-20">
                    {issues.length === 0 ? (
                        <div className="text-center py-20 bg-slate-800/50 backdrop-blur-md rounded-3xl border border-slate-700 border-dashed">
                            <CheckCircle2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-500">All systems clear. No reports.</p>
                        </div>
                    ) : (
                        issues.map((issue) => (
                            <motion.div layout key={issue.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-2xl p-5 shadow-lg">
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${getStripeColor(issue.status)}`}></div>
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="w-full md:w-48 h-32 bg-slate-900 rounded-xl overflow-hidden relative flex-shrink-0">
                                        {issue.imageUrl ? <img src={issue.imageUrl} className="w-full h-full object-cover opacity-80" alt="Report"/> : <div className="w-full h-full flex items-center justify-center text-slate-600"><MapPin /></div>}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-xl font-bold text-white">{issue.title}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(issue.status)}`}>
                                                {issue.status || 'Open'}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-sm mb-4 line-clamp-2">{issue.description}</p>
                                        <div className="flex items-center gap-4 text-xs text-slate-500 font-mono mb-4">
                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {issue.locationText || "Unknown"}</span>
                                            
                                            {/* UPDATED LOGIC TO SHOW SPECIFIC CONTRACTOR NAME */}
                                            {issue.contractorName ? (
                                                <span className="text-emerald-400 flex items-center gap-1 border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 rounded">
                                                    <HardHat className="w-3 h-3"/> {issue.contractorName} ({issue.contractorRating}★)
                                                </span>
                                            ) : issue.assignedTo ? (
                                                <span className="text-orange-400 flex items-center gap-1 border border-orange-400/30 px-2 py-0.5 rounded">
                                                    <HardHat className="w-3 h-3"/> Unit: {issue.assignedTo} • ₹{issue.price}
                                                </span>
                                            ) : null}
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-700/50">
                                            {(!issue.status || issue.status === 'Open' || issue.status === 'OPEN') && (
                                                assigningId === issue.id ? (
                                                    <div className="w-full animate-in slide-in-from-left-4 fade-in">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="relative">
                                                                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                                <input type="number" placeholder="Assign Price" className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:border-blue-500 w-40" value={price} onChange={(e) => setPrice(e.target.value)} autoFocus />
                                                            </div>
                                                            <span className="text-slate-500 text-xs">Select Unit to Confirm:</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {departments.map((dept) => (
                                                                <button key={dept.id} onClick={() => handleForward(issue.id, dept.id)} className={`${dept.color} hover:opacity-90 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-transform active:scale-95`}>
                                                                        {dept.icon} {dept.id}
                                                                </button>
                                                            ))}
                                                            <button onClick={() => {setAssigningId(null); setPrice('');}} className="text-slate-400 hover:text-white px-3 text-xs border border-slate-600 rounded-lg">Cancel</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setAssigningId(issue.id)} className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20">
                                                        <Send className="w-4 h-4" /> Dispatch Contractor
                                                    </button>
                                                )
                                            )}
                                            {issue.status === 'Accepted' && <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold bg-indigo-500/10 px-4 py-2 rounded-lg border border-indigo-500/20"><ClipboardCheck className="w-4 h-4" /> Dispatched (₹{issue.price}) - Awaiting Pickup</div>}
                                            
                                            {/* --- ADMIN CHAT BUTTON --- */}
                                            {/* Only show for jobs that are Accepted or In Progress */}
                                            {(issue.status === 'Accepted' || issue.status === 'In Progress') && (
                                                <button 
                                                    onClick={() => setChatIssue(issue)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold border border-slate-600 transition-all"
                                                >
                                                    <MessageCircle className="w-4 h-4 text-blue-400" /> Chat
                                                </button>
                                            )}

                                            {issue.status === 'In Progress' && <button onClick={() => onUpdateStatus(issue.id, 'Resolved')} className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold"><CheckCircle2 className="w-4 h-4" /> Force Resolve</button>}
                                            {issue.status === 'Resolved' && <button onClick={() => onUpdateStatus(issue.id, 'Open')} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold"><PlayCircle className="w-4 h-4" /> Re-open</button>}
                                            <button onClick={() => onDelete(issue.id)} className="ml-auto p-2 text-slate-500 hover:text-red-400 rounded-lg"><Trash2 className="w-5 h-5"/></button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        )}

        {activeView === 'analytics' && <AnalyticsView issues={issues} />}
        {activeView === 'workforce' && <WorkforceView issues={issues} />}
        {activeView === 'settings' && <SystemSettingsView issues={issues} />}

      </div>
    </div>
  );
};

export default AdminDashboard;
