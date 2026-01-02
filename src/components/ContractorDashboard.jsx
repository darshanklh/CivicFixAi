// src/components/ContractorDashboard.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, CheckCircle2, MapPin, Clock, ArrowRight, 
  PackageCheck, Timer, HardHat, Zap, Droplets, 
  Trash2, Shovel, Wrench, Star, History, IndianRupee, Box, 
  Activity, Target, Crosshair, Wallet, TrendingUp, Languages, ChevronDown, User, 
  Coins 
} from 'lucide-react';
import ConfirmationModal from './ConfirmationModal'; // Import ConfirmationModal

// --- 1. PRO DYNAMIC HUD BACKGROUND ---
const ProfessionalBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950 -z-10 select-none pointer-events-none">
      
      {/* Moving Blueprint Grid */}
      <motion.div 
        animate={{ backgroundPosition: ["0px 0px", "40px 40px"] }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
        className="absolute inset-0 opacity-[0.07]"
        style={{
            backgroundImage: `
              linear-gradient(rgba(56, 189, 248, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(56, 189, 248, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
        }}
      />

      {/* Radar Scanner Beam */}
      <motion.div
        animate={{ top: ["-10%", "110%"] }}
        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
        className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent w-full -z-10"
      />
      
      {/* Rotating HUD Rings (Top Right) */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] opacity-20">
         <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
            className="absolute inset-0 border border-dashed border-blue-400 rounded-full"
         />
         <motion.div 
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
            className="absolute inset-10 border border-dotted border-amber-500/50 rounded-full"
         />
      </div>

      {/* Rotating HUD Rings (Bottom Left) */}
      <div className="absolute bottom-[-150px] left-[-150px] w-[600px] h-[600px] opacity-10">
         <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 80, ease: "linear" }}
            className="absolute inset-0 border border-slate-400 rounded-full border-t-transparent border-l-transparent"
         />
         <motion.div 
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 50, ease: "linear" }}
            className="absolute inset-20 border-[2px] border-slate-500 rounded-full border-b-transparent border-r-transparent"
         />
      </div>

      {/* Floating Data Nodes */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 0.6, 0], 
            scale: [0.5, 1, 0.5],
            y: [0, -20] 
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 3 + Math.random() * 4, 
            delay: Math.random() * 5,
            ease: "easeInOut"
          }}
          className="absolute flex items-center justify-center"
          style={{
            left: `${Math.random() * 90 + 5}%`,
            top: `${Math.random() * 90 + 5}%`
          }}
        >
            <Crosshair className="w-4 h-4 text-blue-500/40" />
        </motion.div>
      ))}

      {/* Vignette Overlay */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-slate-950/80"></div>
    </div>
  );
};

// --- 2. MAIN COMPONENT ---
const ContractorDashboard = ({ issues, onUpdateStatus, user }) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('available');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // -- Language Switcher --
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLangMenuOpen(false);
  };

  // -- Role Mapping Logic --
  const getRelevantTags = (roleType) => {
       if (roleType === 'All Rounder') return ['ALL']; 
       if (roleType === 'Electrician') return ['Electrician', 'Street Light']; 
       if (roleType === 'Plumber') return ['Plumber', 'Water Leakage']; 
       if (roleType === 'Garbage Collector') return ['Garbage Collector', 'Garbage']; 
       if (roleType === 'Road Maintenance') return ['Road Maintenance', 'Potholes'];
       return ['ALL']; 
  };

  const allowedTags = getRelevantTags(user?.roleType);

  // --- LOGIC UPDATE: FCFS & CREDENTIALS ---
  
  // 1. Available: Jobs in my city, matching my trade, but NOT yet claimed by anyone (Status: Accepted)
  const availableJobs = issues.filter(i => {
      // Must match city
      if (user?.operatingCity && i.city !== user.operatingCity) return false;
      // Must match trade
      const isMyTrade = allowedTags.includes('ALL') || (i.assignedTo && allowedTags.includes(i.assignedTo)) || allowedTags.includes(i.aiAnalysis?.category);
      // Must be 'Accepted' (meaning Admin sent it, but no specific contractor took it yet)
      return i.status === 'Accepted' && isMyTrade;
  });

  // 2. Active: Jobs claimed specifically by ME (Status: In Progress + My Name)
  const myActiveJobs = issues.filter(i => {
      return i.status === 'In Progress' && i.contractorName === user.displayName;
  });

  // 3. History: Jobs resolved by ME
  const historyJobs = issues.filter(i => {
      return i.status === 'Resolved' && i.contractorName === user.displayName;
  });

 // -- UPDATED REVENUE CALCULATION: Price + Tip --
const totalEarnings = historyJobs.reduce((acc, job) => {
    const budget = parseFloat(job.price) || 0;
    const tip = parseFloat(job.tipAmount) || 0;
    return acc + budget + tip;
}, 0);

  // -- Accept Job Function (The "Locking" Mechanism) --
  const handleAcceptJob = (issueId) => {
      setConfirmModal({
        isOpen: true,
        type: 'info',
        title: 'Accept Job Assignment',
        message: 'Are you sure you want to accept this job? Once accepted, it will be moved to your Active queue.',
        confirmText: 'Accept Job',
        onConfirm: () => {
            onUpdateStatus(issueId, 'In Progress', {
                contractorName: user.displayName, // Stamp my name
                contractorRating: user.rating,    // Stamp my rating
                contractorId: user.roleType       // Stamp my trade type
            });
            setActiveTab('active');
        }
      });
  };

  const requestResolveJob = (issueId) => {
    setConfirmModal({
        isOpen: true,
        type: 'success',
        title: 'Mark as Resolved',
        message: 'Have you completed the work? This will notify the admin and the citizen to review your work.',
        confirmText: 'Complete Job',
        onConfirm: () => {
            onUpdateStatus(issueId, 'Resolved');
        }
    });
  };

  const getRoleIcon = (role) => {
      if (role === 'Electrician') return <Zap className="w-5 h-5 text-yellow-400" />;
      if (role === 'Plumber') return <Droplets className="w-5 h-5 text-blue-400" />;
      if (role === 'Garbage Collector') return <Trash2 className="w-5 h-5 text-green-400" />;
      if (role === 'Road Maintenance') return <Shovel className="w-5 h-5 text-orange-400" />;
      return <Wrench className="w-5 h-5 text-purple-400" />;
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden text-slate-200">
      
      {/* Background */}
      <ProfessionalBackground />

      <ConfirmationModal 
        {...confirmModal} 
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
      />

      {/* HEADER */}
      <div className="relative z-50 bg-slate-950/70 backdrop-blur-xl border-b border-slate-800 p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 shadow-2xl gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <div className="relative">
                <div className="absolute inset-0 bg-amber-500 blur-lg opacity-20"></div>
                <div className="relative p-2 bg-amber-500 rounded-lg text-slate-950 shadow-lg border border-amber-400">
                   <Briefcase className="w-6 h-6" />
                </div>
            </div>
            <span className="tracking-tight">{t('contractor.title') || "Contractor Portal"}</span>
          </h1>
          
          {/* UPDATED: Added flex-wrap to prevent cutoff */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-slate-400 text-sm mt-3 ml-1">
             <div className="flex flex-wrap items-center gap-2">
                <span className="bg-slate-900 text-slate-300 px-3 py-1 rounded text-xs font-bold uppercase border border-slate-700 flex items-center gap-2 tracking-wider whitespace-nowrap">
                    {getRoleIcon(user?.roleType)}
                    {user?.roleType || "General Unit"}
                </span>
                
                <span className="bg-slate-900 text-blue-400 px-3 py-1 rounded text-xs font-bold uppercase border border-slate-700 flex items-center gap-1 tracking-wider shadow-[0_0_10px_rgba(59,130,246,0.1)] whitespace-nowrap">
                    <User className="w-3 h-3"/> {user?.displayName || "Unknown User"}
                </span>

                {user?.operatingCity && (
                    <span className="bg-slate-900 text-amber-500 px-3 py-1 rounded text-xs font-bold uppercase border border-slate-700 flex items-center gap-1 tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.1)] whitespace-nowrap">
                        <MapPin className="w-3 h-3"/> {user.operatingCity}
                    </span>
                )}
             </div>
             <span className="hidden sm:flex text-emerald-400 font-mono text-[10px] items-center gap-1.5 ml-2 border border-emerald-500/20 px-2 py-0.5 rounded bg-emerald-500/5 whitespace-nowrap">
                <Activity className="w-3 h-3" /> {t('contractor.online') || "SYSTEM ACTIVE"}
             </span>
          </div>
        </div>

        {/* Right Side: Language & Tabs */}
        {/* UPDATED: w-full md:w-auto to handle mobile width properly */}
        <div className="flex flex-col md:flex-row gap-4 mt-2 md:mt-0 items-start md:items-center w-full md:w-auto">
            
            <div className="relative z-50 self-end md:self-auto">
                <button onClick={() => setLangMenuOpen(!langMenuOpen)} className="flex items-center gap-2 bg-slate-900 text-slate-300 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold uppercase hover:bg-slate-800 transition-colors shadow-lg active:scale-95">
                    <Languages className="w-4 h-4 text-blue-400" />
                    {i18n.language ? i18n.language.toUpperCase() : 'EN'}
                    <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {langMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-32 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                        <button onClick={() => changeLanguage('en')} className="px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border-b border-slate-800/50">English</button>
                        <button onClick={() => changeLanguage('hi')} className="px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border-b border-slate-800/50">हिंदी (Hi)</button>
                        <button onClick={() => changeLanguage('mr')} className="px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">मराठी (Mr)</button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            {/* UPDATED: Added overflow-x-auto so tabs scroll horizontally on small screens */}
            <div className="flex w-full md:w-auto bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 shadow-inner overflow-x-auto no-scrollbar">
                <TabButton active={activeTab === 'available'} onClick={() => setActiveTab('available')} icon={<PackageCheck className="w-4 h-4" />} label={t('contractor.newOrders') || "New Orders"} count={availableJobs.length} color="amber" />
                <TabButton active={activeTab === 'active'} onClick={() => setActiveTab('active')} icon={<Timer className="w-4 h-4" />} label={t('contractor.inProgress') || "In Progress"} count={myActiveJobs.length} color="blue" />
                <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History className="w-4 h-4" />} label={t('contractor.history') || "History"} color="slate" />
            </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-5xl mx-auto min-h-[500px] pb-20">
          <AnimatePresence mode='wait'>
            
            {/* 1. AVAILABLE TAB */}
            {activeTab === 'available' && (
              <motion.div key="available" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }} className="space-y-4">
                {availableJobs.length === 0 ? (
                  <EmptyState icon={<Target className="w-12 h-12 text-slate-600"/>} title={t('contractor.noOrders') || "Systems Clear"} desc={t('contractor.noOrdersDesc') || `No pending assignments detected in ${user?.operatingCity || 'your sector'}.`} />
                ) : (
                  availableJobs.map(issue => (
                    <JobCard 
                      key={issue.id} 
                      issue={issue} 
                      type="available" 
                      onAction={() => handleAcceptJob(issue.id)} // <--- CALLING THE NEW FCFS FUNCTION
                      btnText={t('contractor.accept') || "ACCEPT & START"}
                    />
                  ))
                )}
              </motion.div>
            )}

            {/* 2. ACTIVE TAB */}
            {activeTab === 'active' && (
              <motion.div key="active" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }} className="space-y-4">
                {myActiveJobs.length === 0 ? (
                  <EmptyState icon={<Timer className="w-12 h-12 text-slate-600"/>} title="Standby Mode" desc="Accept a new order to initialize workflow." />
                ) : (
                  myActiveJobs.map(issue => (
                    <JobCard key={issue.id} issue={issue} type="active" onAction={() => requestResolveJob(issue.id)} btnText={t('contractor.resolve') || "MARK RESOLVED"}/>
                  ))
                )}
              </motion.div>
            )}

            {/* 3. HISTORY TAB */}
            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }} className="space-y-4">
                <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900/40 border border-emerald-500/20 p-5 rounded-2xl mb-6 flex items-center justify-between shadow-[0_0_30px_rgba(16,185,129,0.05)] relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
                      <div className="absolute -left-10 top-0 h-full w-20 bg-emerald-500/10 skew-x-12 blur-xl animate-pulse"></div>
                      <div className="flex items-center gap-4 relative z-10">
                          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-emerald-400"><Wallet className="w-6 h-6" /></div>
                          <div>
                            <h3 className="text-emerald-100 font-bold text-sm uppercase tracking-widest flex items-center gap-2">{t('contractor.revenue') || "Total Revenue"} <TrendingUp className="w-3 h-3 text-emerald-500"/></h3>
                            <p className="text-[10px] text-emerald-500/70 font-mono mt-0.5">VERIFIED PAYOUTS</p>
                          </div>
                      </div>
                      <div className="text-3xl font-mono font-bold text-emerald-400 flex items-center drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]"><IndianRupee className="w-6 h-6 mr-1 opacity-70" /> {totalEarnings.toLocaleString()}</div>
                </div>
                {historyJobs.length === 0 ? (
                  <EmptyState icon={<CheckCircle2 className="w-12 h-12 text-slate-600"/>} title="Log Empty" desc="Completed operations will be archived here." />
                ) : (
                  historyJobs.map(issue => ( <JobCard key={issue.id} issue={issue} type="history" /> ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label, count, color }) => {
    const activeClass = "bg-slate-800 text-white shadow-[0_0_15px_rgba(30,41,59,0.5)] border-slate-600";
    const inactiveClass = "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border-transparent";
    const badgeColor = color === 'amber' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-blue-500/20 text-blue-500 border border-blue-500/30';
    return (
        <button onClick={onClick} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap border flex-shrink-0 ${active ? activeClass : inactiveClass}`}>
            {icon} {label}
            {count > 0 && ( <span className={`${badgeColor} px-1.5 py-0.5 rounded text-[10px] ml-1`}>{count}</span> )}
        </button>
    );
}

const EmptyState = ({ icon, title, desc }) => (
    <div className="flex flex-col items-center justify-center py-32 text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20 backdrop-blur-sm">
        <div className="bg-slate-800/50 p-6 rounded-full shadow-inner mb-4 border border-slate-700/50">{icon}</div>
        <h3 className="font-bold text-slate-300 text-lg uppercase tracking-widest">{title}</h3>
        <p className="max-w-xs text-center mt-2 text-sm font-mono text-slate-500">{desc}</p>
    </div>
);

// --- UPDATED JOB CARD (Full Address Visibility) ---
const JobCard = ({ issue, type, onAction, btnText }) => {
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`bg-slate-900/60 backdrop-blur-xl border rounded-2xl p-1 shadow-2xl overflow-hidden relative group transition-all duration-300 ${type === 'history' ? 'border-slate-800/50 opacity-80 hover:opacity-100' : 'border-slate-700/60 hover:border-slate-500 hover:shadow-blue-900/10'}`}>
        <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500/50 -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s] ease-in-out z-20"></div>
        <div className="flex flex-col md:flex-row gap-6 p-5 relative z-0">
            <div className="w-full md:w-64 h-44 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0 relative">
                {issue.imageUrl ? (
                    <img src={issue.imageUrl} alt="Issue" className={`w-full h-full object-cover ${type !== 'history' && 'group-hover:scale-105'} transition-transform duration-500 opacity-80 group-hover:opacity-100`} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900"><Activity className="w-10 h-10 opacity-50" /></div>
                )}
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent p-3 flex justify-between items-start">
                      <span className="text-[10px] font-mono font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1 bg-black/50 px-2 py-1 rounded backdrop-blur-sm border border-blue-500/20">
                        <Box className="w-3 h-3 text-blue-400"/> {issue.assignedTo ? `${issue.assignedTo}` : (issue.aiAnalysis?.category || "General")}
                      </span>
                </div>
            </div>
            <div className="flex-1 w-full flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-100 line-clamp-1 group-hover:text-blue-400 transition-colors tracking-tight">{issue.title}</h3>
                    <Badge type={type} />
                </div>
                
                {/* Price & Tip Section - FIXED & SAFER */}
                {issue.price && (
                    <div className="flex items-center gap-2 mb-3">
                        {/* Budget Badge */}
                        <div className={`px-2 py-0.5 rounded border text-xs font-mono font-bold flex items-center gap-1 ${type === 'history' ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                            <IndianRupee className="w-3 h-3" /> {issue.price} Budget
                        </div>

                        {/* NEW: Tip Badge (Only show if tip exists and > 0) */}
                        {(Number(issue.tipAmount) || 0) > 0 && (
                            <div className="px-2 py-0.5 rounded border text-xs font-mono font-bold flex items-center gap-1 bg-yellow-500/10 border-yellow-500/20 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.2)] animate-pulse">
                                <Coins className="w-3 h-3" /> +₹{issue.tipAmount} Tip
                            </div>
                        )}
                    </div>
                )}

                <p className="text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed border-l-2 border-slate-700 pl-3">{issue.description}</p>
                {type === 'history' && issue.isReviewed && (
                      <div className="mt-auto bg-slate-950/50 border border-slate-800 rounded-lg p-3 flex gap-3 mb-2">
                          <div className="bg-slate-900 p-1.5 rounded-full h-fit border border-slate-800"><Star className="w-4 h-4 text-amber-500 fill-amber-500"/></div>
                          <div>
                             <div className="flex items-center gap-2 mb-0.5"><span className="font-bold text-slate-300 text-sm">Rating: {issue.rating}/5</span></div>
                             <p className="text-xs text-slate-500 italic">"{issue.review}"</p>
                          </div>
                      </div>
                )}
                {(!issue.isReviewed || type !== 'history') && (
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 mt-auto pt-3 border-t border-slate-800/50">
                        {/* --- UPDATED ADDRESS DISPLAY HERE --- */}
                        <span className="flex items-start gap-1.5 font-bold text-slate-400 max-w-full">
                            <MapPin className="w-3.5 h-3.5 text-red-500/80 mt-0.5 shrink-0" /> 
                            <span className="break-words">
                                {issue.locationText 
                                    ? issue.locationText 
                                    : `${issue.addressDetail ? issue.addressDetail + ', ' : ''}${issue.city}, ${issue.state}${issue.pincode ? ' - ' + issue.pincode : ''}`}
                            </span>
                        </span>
                        <span className="flex items-center gap-1.5 whitespace-nowrap"><Clock className="w-3.5 h-3.5 text-blue-500/80" /> {new Date(issue.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                    </div>
                )}
            </div>
        </div>
        {type !== 'history' && (
            <div className="border-t border-slate-800 bg-black/20 p-4 flex justify-end items-center gap-4">
                <button onClick={(e) => { e.stopPropagation(); onAction(); }} className={`w-full md:w-auto px-6 py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg uppercase text-xs tracking-widest border border-white/5 ${type === 'available' ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'}`}>
                    {type === 'available' ? ( <>{btnText} <ArrowRight className="w-4 h-4" /></> ) : ( <><CheckCircle2 className="w-4 h-4" /> {btnText}</> )}
                </button>
            </div>
        )}
    </motion.div>
  );
};

const Badge = ({ type }) => {
    let classes = "";
    let text = "";
    if (type === 'available') { classes = "bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]"; text = "PENDING"; }
    else if (type === 'active') { classes = "bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]"; text = "ACTIVE"; }
    else { classes = "bg-slate-800 text-slate-400 border-slate-700"; text = "ARCHIVED"; }
    return <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border tracking-widest ${classes}`}>{text}</span>;
};

export default ContractorDashboard;
