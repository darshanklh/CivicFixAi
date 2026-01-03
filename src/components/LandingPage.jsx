// src/components/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, User, ArrowRight, Loader2, Lock, Check, 
  HardHat, Zap, Droplets, Trash2, Shovel, Wrench, ChevronLeft, BadgeCheck,
  BrainCircuit, Clock, Activity, Users, Code, ChevronDown
} from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { INDIAN_LOCATIONS } from '../data/locations'; 

// --- DATABASE OF APPROVED GMAIL ACCOUNTS ---
const APPROVED_CONTRACTORS = {
    "your.email@gmail.com": { name: "VoltMasters Pvt Ltd", id: "E-101", rating: 4.8 }, 
    "darshankolhe2005@gmail.com": { name: "DK Electricals", id: "E-102", rating: 4.9 },
    "plumber.demo@gmail.com": { name: "LeakProof Pros", id: "P-201", rating: 4.6 },
    "clean.city@gmail.com": { name: "Green Earth Waste", id: "G-401", rating: 4.7 },
    "road.works@gmail.com": { name: "Highway Heroes Infra", id: "R-301", rating: 4.5 },
    "fix.it@gmail.com": { name: "Rapid Response Squad", id: "A-501", rating: 4.9 },
};

const LandingPage = ({ onSelectRole, cachedUser }) => {
  // --- SPLASH SCREEN STATE ---
  const [showSplash, setShowSplash] = useState(true);

  // --- EXISTING STATE ---
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(null); 
  const [contractorStep, setContractorStep] = useState(0); 
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [contractorLoc, setContractorLoc] = useState({ state: '', city: '' });
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  // --- HACKATHON MODE: PINS ---
  const CONTRACTOR_MASTER_PASS = "2025";
  const ADMIN_PIN = "1269";
  
  const contractorRoles = [
    { id: 'Electrician', icon: <Zap className="w-5 h-5 text-yellow-400"/>, label: 'Electrician', accessPin: '1111' },
    { id: 'Plumber', icon: <Droplets className="w-5 h-5 text-blue-400"/>, label: 'Plumber', accessPin: '2222' },
    { id: 'Garbage Collector', icon: <Trash2 className="w-5 h-5 text-green-400"/>, label: 'Cleaner', accessPin: '3333' },
    { id: 'Road Maintenance', icon: <Shovel className="w-5 h-5 text-orange-400"/>, label: 'Road Work', accessPin: '4444' },
    { id: 'All Rounder', icon: <Wrench className="w-5 h-5 text-purple-400"/>, label: 'All Rounder', accessPin: '5555' },
  ];

  // --- SPLASH SCREEN LOGIC ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4500); 
    return () => clearTimeout(timer);
  }, []);

  // CITIZEN LOGIN
  const handleCitizenLogin = async () => {
    if (cachedUser) { onSelectRole('citizen', cachedUser); return; }
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onSelectRole('citizen', result.user); 
    } catch (error) { console.error(error); alert(error.message); } 
    finally { setLoading(false); }
  };

  // PIN VERIFICATION
  const verifyPin = (role) => {
    if (role === 'admin') {
        if (pin === ADMIN_PIN) onSelectRole('admin', { displayName: "Admin Officer" });
        else triggerError();
    } 
    else if (role === 'contractor') {
        if (contractorStep === 0) {
            if (pin === CONTRACTOR_MASTER_PASS) { setContractorStep(1); setPin(''); } 
            else triggerError();
        }
        else if (contractorStep === 2) {
            if (pin === selectedTrade.accessPin) { setContractorStep(3); setPin(''); } 
            else triggerError();
        }
    }
  };

  // --- CONTRACTOR GOOGLE AUTH ---
  const handleContractorGoogleLogin = async () => {
      if (!contractorLoc.state || !contractorLoc.city) return alert("Please select your operating location first!");
      setLoading(true);
      try {
          const result = await signInWithPopup(auth, googleProvider);
          const email = result.user.email;
          const googleName = result.user.displayName; 
          const contractorData = APPROVED_CONTRACTORS[email] || APPROVED_CONTRACTORS["your.email@gmail.com"]; 
          if (contractorData) {
              onSelectRole('contractor', { 
                displayName: googleName, agencyName: contractorData.name, roleType: selectedTrade.id,
                operatingState: contractorLoc.state, operatingCity: contractorLoc.city,
                rating: contractorData.rating, licenseId: contractorData.id, email: email, verified: true 
              });
          } else {
              alert(`ACCESS DENIED: The email '${email}' is not registered as a verified contractor.`);
              setLoading(false);
          }
      } catch (error) { console.error(error); setLoading(false); }
  };

  const triggerError = () => { setError(true); setTimeout(() => setError(false), 500); setPin(''); };

  const handleCardClick = (role) => {
    if (activeTab === role) return;
    setActiveTab(role); setPin(''); setError(false); setContractorStep(0); setSelectedTrade(null); setContractorLoc({state:'', city:''});
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-x-hidden">
      
      {/* --- SPLASH SCREEN OVERLAY --- */}
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center"
          >
             <div className="text-center">
                 <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter flex items-center justify-center mb-4">
                    <motion.span initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2, type: "spring" }} className="text-white mr-1">Civic</motion.span>
                    <motion.span initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.0, type: "spring" }} className="text-blue-500 mr-1">Fix</motion.span>
                    <motion.span initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.8, type: "spring" }} className="text-blue-500">Ai</motion.span>
                 </h1>
                 <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 2.6 }} className="text-slate-400 text-xl md:text-2xl font-medium tracking-wide">
                    Resolving community issues together.
                 </motion.p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- BACKGROUND BLOBS (Fixed) --- */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-orange-500 rounded-full blur-[100px]" />
      </div>

      {/* --- MAIN HERO SECTION --- */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 pb-20">
        
        {/* Header */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={!showSplash ? { opacity: 1, y: 0 } : {}} 
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            CivicFix<span className="text-blue-400">Ai</span>
          </h1>
          <p className="text-slate-400 text-xl mb-12 max-w-2xl mx-auto">
            Resolving community issues together.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
          {/* Citizen Card */}
          <motion.button 
            onClick={handleCitizenLogin} disabled={loading}
            initial={{ opacity: 0, scale: 0.9 }} animate={!showSplash ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
            className="group bg-slate-800/50 backdrop-blur-md border border-slate-700 p-8 rounded-3xl text-left hover:bg-slate-800 transition-all shadow-2xl relative overflow-hidden flex flex-col items-start min-h-[300px]"
          >
            {loading && <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-20"><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>}
            <div className="bg-blue-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500 transition-colors flex-shrink-0"><User className="w-7 h-7 text-blue-400 group-hover:text-white" /></div>
            <h3 className="text-xl font-bold mb-2">Citizen</h3>
            <p className="text-slate-400 text-sm mb-6 flex-1">{cachedUser ? `Continue as ${cachedUser.displayName}` : "Report issues in your area."}</p>
            <div className="flex items-center text-blue-400 font-semibold text-sm group-hover:translate-x-2 transition-transform mt-auto">Enter <ArrowRight className="w-4 h-4 ml-2" /></div>
          </motion.button>

          {/* Admin Card */}
          <motion.div 
            onClick={() => handleCardClick('admin')} 
            initial={{ opacity: 0, scale: 0.9 }} animate={!showSplash ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={activeTab !== 'admin' ? { scale: 1.03 } : {}} 
            className={`group bg-slate-800/50 backdrop-blur-md border ${error && activeTab === 'admin' ? 'border-red-500' : 'border-slate-700'} p-8 rounded-3xl text-left hover:bg-slate-800 transition-all shadow-2xl relative cursor-pointer flex flex-col items-start min-h-[300px]`}
          >
            <div className="bg-purple-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-500 transition-colors flex-shrink-0"><ShieldCheck className="w-7 h-7 text-purple-400 group-hover:text-white" /></div>
            <h3 className="text-xl font-bold mb-2">Admin</h3>
            {activeTab !== 'admin' ? (
              <><p className="text-slate-400 text-sm mb-6 flex-1">Review and assign tasks.</p><div className="flex items-center text-purple-400 font-semibold text-sm mt-auto">Access <Lock className="w-4 h-4 ml-2" /></div></>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 w-full">
                <p className="text-xs text-slate-400 mb-2">PIN: {ADMIN_PIN}</p>
                <div className="flex gap-2"><input type="password" maxLength={4} autoFocus className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-center focus:ring-2 focus:ring-purple-500 outline-none" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verifyPin('admin')} placeholder={ADMIN_PIN} /><button onClick={(e) => { e.stopPropagation(); verifyPin('admin'); }} className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg"><Check className="w-4 h-4" /></button></div>
              </motion.div>
            )}
          </motion.div>

          {/* Contractor Card */}
          <motion.div 
            onClick={() => handleCardClick('contractor')} 
            initial={{ opacity: 0, scale: 0.9 }} animate={!showSplash ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.5, delay: 0.6 }}
            whileHover={activeTab !== 'contractor' ? { scale: 1.03 } : {}} 
            className={`group bg-slate-800/50 backdrop-blur-md border ${error && activeTab === 'contractor' ? 'border-red-500' : 'border-slate-700'} p-8 rounded-3xl text-left hover:bg-slate-800 transition-all shadow-2xl relative cursor-pointer flex flex-col items-start min-h-[300px]`}
          >
            {loading && activeTab === 'contractor' && <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-20"><Loader2 className="w-8 h-8 text-orange-400 animate-spin" /></div>}
            <div className="bg-orange-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-500 transition-colors flex-shrink-0"><HardHat className="w-7 h-7 text-orange-400 group-hover:text-white" /></div>
            <h3 className="text-xl font-bold mb-2">Contractor</h3>
            {activeTab !== 'contractor' ? (
              <><p className="text-slate-400 text-sm mb-6 flex-1">Accept jobs and fix issues.</p><div className="flex items-center text-orange-400 font-semibold text-sm mt-auto">Login <Lock className="w-4 h-4 ml-2" /></div></>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 w-full">
                <AnimatePresence mode="wait">
                    {/* (Contractor Steps 0, 1, 2, 3, 4) */}
                    {contractorStep === 0 && (
                        <motion.div key="step0" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}>
                            <p className="text-xs text-orange-400 font-bold mb-2 uppercase">1. Master Access Code</p>
                            <div className="flex gap-2">
                                <input type="password" maxLength={4} autoFocus className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-center focus:ring-2 focus:ring-orange-500 outline-none" placeholder={CONTRACTOR_MASTER_PASS} value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verifyPin('contractor')} />
                                <button onClick={(e) => { e.stopPropagation(); verifyPin('contractor'); }} className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg"><Check className="w-4 h-4" /></button>
                            </div>
                        </motion.div>
                    )}
                    {contractorStep === 1 && (
                        <motion.div key="step1" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}>
                             <div className="flex justify-between items-center mb-2"><p className="text-xs text-orange-400 font-bold uppercase">2. Select Your Unit</p><button onClick={(e) => {e.stopPropagation(); setContractorStep(0)}} className="text-slate-500 hover:text-white"><ChevronLeft className="w-4 h-4"/></button></div>
                             <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                {contractorRoles.map((role) => (<button key={role.id} onClick={(e) => { e.stopPropagation(); setSelectedTrade(role); setContractorStep(2); }} className="flex flex-col items-center justify-center gap-1 bg-slate-900 border border-slate-600 hover:border-orange-500 hover:bg-slate-800 p-2 rounded-xl transition-all">{role.icon} <span className="text-[10px] text-slate-300 font-bold text-center">{role.label}</span></button>))}
                             </div>
                        </motion.div>
                    )}
                    {contractorStep === 2 && (
                        <motion.div key="step2" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}>
                             <div className="flex justify-between items-center mb-2"><p className="text-xs text-orange-400 font-bold uppercase">3. {selectedTrade?.label} ID</p><button onClick={(e) => {e.stopPropagation(); setContractorStep(1); setPin('')}} className="text-slate-500 hover:text-white"><ChevronLeft className="w-4 h-4"/></button></div>
                             <div className="flex gap-2"><input type="password" maxLength={4} autoFocus className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-center focus:ring-2 focus:ring-orange-500 outline-none" placeholder={`PIN: ${selectedTrade?.accessPin}`} value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verifyPin('contractor')} /><button onClick={(e) => { e.stopPropagation(); verifyPin('contractor'); }} className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg"><Check className="w-4 h-4" /></button></div>
                        </motion.div>
                    )}
                    {contractorStep === 3 && (
                        <motion.div key="step3" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}>
                             <div className="flex justify-between items-center mb-2"><p className="text-xs text-orange-400 font-bold uppercase">4. Operating Location</p><button onClick={(e) => {e.stopPropagation(); setContractorStep(2)}} className="text-slate-500 hover:text-white"><ChevronLeft className="w-4 h-4"/></button></div>
                             <div className="space-y-2">
                                <select className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs outline-none focus:ring-1 focus:ring-orange-500" value={contractorLoc.state} onChange={(e) => setContractorLoc({...contractorLoc, state: e.target.value, city: ''})} onClick={(e) => e.stopPropagation()}><option value="">Select State</option>{Object.keys(INDIAN_LOCATIONS).sort().map(s => <option key={s} value={s}>{s}</option>)}</select>
                                <select className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50" value={contractorLoc.city} onChange={(e) => setContractorLoc({...contractorLoc, city: e.target.value})} onClick={(e) => e.stopPropagation()} disabled={!contractorLoc.state}><option value="">Select City</option>{contractorLoc.state && Object.keys(INDIAN_LOCATIONS[contractorLoc.state]).map(c => <option key={c} value={c}>{c}</option>)}</select>
                                <button onClick={(e) => { e.stopPropagation(); setContractorStep(4); }} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white p-2 rounded-lg text-xs font-bold mt-2 flex items-center justify-center gap-2">Next <ArrowRight className="w-3 h-3"/></button>
                             </div>
                        </motion.div>
                    )}
                    {contractorStep === 4 && (
                        <motion.div key="step4" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}>
                             <div className="flex justify-between items-center mb-4"><p className="text-xs text-orange-400 font-bold uppercase">5. Secure Verification</p><button onClick={(e) => {e.stopPropagation(); setContractorStep(3)}} className="text-slate-500 hover:text-white"><ChevronLeft className="w-4 h-4"/></button></div>
                             <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 text-center"><BadgeCheck className="w-10 h-10 text-orange-500 mx-auto mb-3" /><p className="text-xs text-slate-400 mb-4">Authenticate via Google to verify your agency license.</p><button onClick={(e) => { e.stopPropagation(); handleContractorGoogleLogin(); }} className="w-full bg-white text-slate-900 hover:bg-gray-100 p-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-lg"><img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />Verify with Google</button></div>
                             <p className="text-[10px] text-slate-600 text-center mt-3">Only registered emails allowed.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
                </motion.div>
            )}
          </motion.div>
        </div>

        {/* --- SCROLL INDICATOR --- */}
        {!showSplash && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1, y: [0, 10, 0] }} 
            transition={{ delay: 2, duration: 2, repeat: Infinity }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center cursor-pointer"
            onClick={() => document.getElementById('about-section').scrollIntoView({ behavior: 'smooth' })}
          >
            <span className="text-xs text-slate-500 mb-2 uppercase tracking-widest">Discover More</span>
            <ChevronDown className="w-6 h-6 text-slate-500" />
          </motion.div>
        )}
      </div>

      {/* --- ABOUT SECTION --- */}
      <div id="about-section" className="relative z-10 bg-slate-900 py-24 px-4 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          
          <div className="mb-20 text-center">
             <motion.h2 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="text-3xl md:text-5xl font-bold mb-6"
             >
               Why Choose <span className="text-blue-500">CivicFixAi?</span>
             </motion.h2>
             <motion.p 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.1 }}
               className="text-slate-400 max-w-2xl mx-auto text-lg"
             >
               A revolutionary platform bridging the gap between citizens, administration, and skilled workers using advanced AI.
             </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Feature 1: What is it? */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800/30 p-8 rounded-3xl border border-slate-700/50"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 text-blue-400">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Smart AI Integration</h3>
              <p className="text-slate-400 leading-relaxed">
                CivicFixAi automatically categorizes issues, assesses severity, and assigns the correct trade professional (Electrician, Plumber, etc.) without human delay.
              </p>
            </motion.div>

            {/* Feature 2: Advantages */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-slate-800/30 p-8 rounded-3xl border border-slate-700/50"
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 text-purple-400">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Real-Time Transparency</h3>
              <p className="text-slate-400 leading-relaxed">
                Track your complaint from "Reported" to "Resolved" in real-time. Admins get a bird's-eye view of city health, while contractors get instant job alerts.
              </p>
            </motion.div>

            {/* Feature 3: Why Use It? */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="bg-slate-800/30 p-8 rounded-3xl border border-slate-700/50"
            >
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-6 text-orange-400">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Faster Resolutions</h3>
              <p className="text-slate-400 leading-relaxed">
                By removing bureaucratic red tape, we ensure that potholes, leaks, and electrical hazards are fixed in hours, not weeks.
              </p>
            </motion.div>
          </div>

        </div>
      </div>

      {/* --- DEVELOPER FOOTER --- */}
      <footer className="relative z-10 bg-slate-950 py-12 border-t border-slate-900">
        <div className="max-w-6xl mx-auto px-4 text-center">
            <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center justify-center"
            >
                <div className="flex items-center gap-2 mb-4 text-slate-500">
                    <Code className="w-5 h-5" />
                    <span className="text-sm font-medium uppercase tracking-wider">Developed By</span>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Darshan <span className="text-slate-600">&</span> Omshree
                </h3>
                <p className="text-slate-500 text-sm">
                    Built with React, Firebase & Framer Motion
                </p>

                <div className="mt-8 pt-8 border-t border-slate-800 w-full max-w-xs mx-auto">
                    <p className="text-xs text-slate-600">© 2025 CivicFixAi. All rights reserved.</p>
                </div>
            </motion.div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
