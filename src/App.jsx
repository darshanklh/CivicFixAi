// src/App.jsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; 
import ReportForm from './components/ReportForm';
import IssueCard from './components/IssueCard';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import ContractorDashboard from './components/ContractorDashboard';
import IssueDetailModal from './components/IssueDetailModal';
import LiveTrackerModal from './components/LiveTrackerModal'; 
import ForecastModal from './components/ForecastModal';
import UserProfileModal from './components/UserProfileModal'; 
import AiChatbot from './components/AiChatbot'; 
import { db, auth } from './firebase'; 
import { onAuthStateChanged } from 'firebase/auth'; 
import { collection, query, orderBy, onSnapshot, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { 
  LayoutDashboard, LogOut, TrendingUp, Menu, 
  BarChart3, Home, BrainCircuit, FileText, ArrowLeft, 
  CheckCircle2, Activity, User, Settings, Languages,
  PlusCircle, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CITIZEN BACKGROUND (Midnight Theme) ---
const MidnightBackground = () => (
  <div className="fixed inset-0 -z-10 h-full w-full bg-slate-950 overflow-hidden">
    <div className="absolute top-[-10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" style={{animationDuration: '8s'}} />
    <div className="absolute bottom-[-10%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-violet-600/20 blur-[100px] animate-pulse" style={{animationDuration: '10s'}} />
    <div 
      className="absolute inset-0 opacity-[0.2]"
      style={{
        backgroundImage: `linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(to right, #4f46e5 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
        maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
      }}
    />
    <div className="absolute inset-0 opacity-[0.03] bg-repeat pointer-events-none" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}></div>
  </div>
);

function App() {
  const { t, i18n } = useTranslation(); 
  const [role, setRole] = useState(null); 
  const [issues, setIssues] = useState([]);
  const [view, setView] = useState('dashboard'); // START AT DASHBOARD (HOME)
  const [currentUser, setCurrentUser] = useState(null);
  
  // State for Modals
  const [showForecast, setShowForecast] = useState(false);
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [cachedUser, setCachedUser] = useState(null);
  
  // Language Menu State
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCachedUser(user);
        if(!currentUser) setCurrentUser(user);
      } else {
        setCachedUser(null);
      }
    });
    return () => unsubscribeAuth();
  }, [currentUser]); 

  const handleRoleSelect = (selectedRole, userData) => {
    setRole(selectedRole);
    setCurrentUser(userData);
    setView('dashboard'); // Ensures new login goes to Dashboard
  };

  const handleNavigation = (newView) => {
    setView(newView);
    setIsSidebarOpen(false); 
  };

  const handleOpenModal = (setter) => {
    setter(true);
    setIsSidebarOpen(false); 
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLangMenuOpen(false);
  };

  useEffect(() => {
    const q = query(collection(db, "issues"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIssues(data);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    if (confirm("Delete this issue permanently?")) {
      await deleteDoc(doc(db, "issues", id));
    }
  };

  const handleUpdateStatus = async (id, newStatus, extraData = {}) => {
    const docRef = doc(db, "issues", id);
    await updateDoc(docRef, { status: newStatus, ...extraData });
  };

  const handleSubmitReview = async (issueId, rating, comment) => {
    try {
      const docRef = doc(db, "issues", issueId);
      await updateDoc(docRef, { rating: rating, review: comment, isReviewed: true });
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review.");
    }
  };

  const handleLogout = () => {
    auth.signOut();
    setRole(null);
    setCurrentUser(null);
    setCachedUser(null);
    localStorage.removeItem('civic_role'); 
  };

  // --- STATS CALCULATION (USER CENTRIC) ---
  const myReports = currentUser 
    ? issues.filter(issue => issue.userId === currentUser.uid || issue.userEmail === currentUser.email)
    : [];
  
  // Calculate stats strictly from myReports
  const myTotalCount = myReports.length;
  const myInProgressCount = myReports.filter(i => i.status === 'In Progress').length;
  const myResolvedCount = myReports.filter(i => i.status === 'Resolved').length;

  if (!role) return (
    <>
      <LandingPage onSelectRole={handleRoleSelect} cachedUser={cachedUser} />
      <AiChatbot /> 
    </>
  );

  return (
    <div className="h-screen h-[100dvh] flex flex-col overflow-hidden relative font-sans text-slate-100">
      {role === 'citizen' && <MidnightBackground />}
      {role === 'citizen' && <AiChatbot />}
      
      {selectedIssue && <IssueDetailModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />}
      {showTrackerModal && <LiveTrackerModal issues={issues} onClose={() => setShowTrackerModal(false)} />}
      {showForecast && <ForecastModal onClose={() => setShowForecast(false)} />}
      {showProfileModal && <UserProfileModal user={currentUser} onClose={() => setShowProfileModal(false)} />}

      <nav className="h-16 flex-none z-50 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0">
        <div className="max-w-[1920px] mx-auto px-6 h-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            {role === 'citizen' && (
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                    <Menu className="w-6 h-6" />
                </button>
            )}
            
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNavigation('dashboard')}>
                <div className={`p-2 rounded-xl shadow-lg shadow-blue-500/20 bg-gradient-to-br from-blue-600 to-violet-600 group-hover:scale-105 transition-transform`}>
                  <LayoutDashboard className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight hidden sm:inline">
                  CivicFix<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">Ai</span>
                </span>
            </div>
            
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-slate-700 bg-slate-800/50 text-slate-400 cursor-default tracking-wider">
                {role}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {role === 'citizen' && (
                <div className="relative">
                    <button 
                        onClick={() => setLangMenuOpen(!langMenuOpen)}
                        className="flex items-center gap-2 bg-slate-900/50 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase hover:bg-slate-800 transition-colors"
                    >
                        <Languages className="w-4 h-4 text-blue-400" />
                        {i18n.language ? i18n.language.toUpperCase() : 'EN'}
                    </button>
                    {langMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-32 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
                            <button onClick={() => changeLanguage('en')} className="px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border-b border-slate-800/50">English</button>
                            <button onClick={() => changeLanguage('hi')} className="px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border-b border-slate-800/50">हिंदी</button>
                            <button onClick={() => changeLanguage('mr')} className="px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">मराठी</button>
                        </div>
                    )}
                </div>
            )}

            <button onClick={handleLogout} className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden relative">
        
        {role === 'admin' && (
            <div className="flex-1 overflow-hidden p-0 bg-slate-900">
                <AdminDashboard issues={issues} onUpdateStatus={handleUpdateStatus} onDelete={handleDelete} />
            </div>
        )}

        {role === 'contractor' && (
             <div className="flex-1 overflow-hidden">
                <ContractorDashboard issues={issues} onUpdateStatus={handleUpdateStatus} user={currentUser} />
             </div>
        )}

        {role === 'citizen' && (
            <div className="flex w-full h-full relative">
                <AnimatePresence initial={false}>
                    {isSidebarOpen && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="absolute inset-0 bg-black/60 z-20 backdrop-blur-sm" />
                            
                            <motion.aside 
                                initial={{ width: 0, opacity: 0 }} 
                                animate={{ width: 280, opacity: 1 }} 
                                exit={{ width: 0, opacity: 0 }} 
                                className="bg-slate-900/90 backdrop-blur-2xl border-r border-slate-700 h-full overflow-hidden flex-shrink-0 z-30 relative shadow-2xl flex flex-col"
                            >
                                <div className="flex-1 flex flex-col w-[280px] overflow-y-auto custom-scrollbar">
                                    <div className="p-4 space-y-2 mt-4 flex-shrink-0">
                                        <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Navigation</p>
                                        
                                        <div 
                                            onClick={() => handleNavigation('dashboard')}
                                            className={`flex items-center gap-3 p-3 mx-2 rounded-xl cursor-pointer transition-all ${view === 'dashboard' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm font-bold' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent font-medium'}`}
                                        >
                                            <Home className="w-5 h-5" /> 
                                            <span>Home</span>
                                        </div>

                                        <div 
                                            onClick={() => handleNavigation('report')}
                                            className={`flex items-center gap-3 p-3 mx-2 rounded-xl cursor-pointer transition-all ${view === 'report' ? 'bg-orange-600/10 text-orange-400 border border-orange-500/20 shadow-sm font-bold' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent font-medium'}`}
                                        >
                                            <PlusCircle className="w-5 h-5" /> 
                                            <span>Report Issue</span>
                                        </div>
                                        
                                        <button onClick={() => handleOpenModal(setShowTrackerModal)} className="w-full flex items-center justify-between p-3 px-5 hover:bg-slate-800/50 text-slate-300 font-medium transition-colors rounded-xl border border-transparent">
                                            <div className="flex items-center gap-3"><BarChart3 className="w-5 h-5 text-purple-400" /> <span>{t('citizen.liveTracker') || "Live Tracker"}</span></div>
                                        </button>
                                        
                                        <button onClick={() => handleOpenModal(setShowForecast)} className="w-full flex items-center justify-between p-3 px-5 hover:bg-slate-800/50 text-slate-300 font-medium transition-colors rounded-xl border border-transparent">
                                            <div className="flex items-center gap-3"><BrainCircuit className="w-5 h-5 text-indigo-400" /> <span>{t('citizen.aiForecast') || "Gemini Forecast"}</span></div>
                                        </button>
                                        
                                        <button 
                                            onClick={() => handleNavigation('my-reports')} 
                                            className={`w-full flex items-center justify-between p-3 px-5 transition-all rounded-xl ${view === 'my-reports' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm font-bold' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white border border-transparent font-medium'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className={`w-5 h-5 ${view === 'my-reports' ? 'text-blue-400' : 'text-orange-400'}`} /> 
                                                <span>{t('citizen.myReports') || "My Reports"}</span>
                                            </div>
                                        </button>
                                    </div>

                                    <div className="p-4 border-t border-slate-800/50 mt-2 xl:hidden">
                                        <div className="flex items-center gap-2 px-4 mb-4 text-slate-500">
                                            <TrendingUp className="w-4 h-4" />
                                            <p className="text-xs font-bold uppercase tracking-widest">Community Feed</p>
                                        </div>
                                        <div className="space-y-3 pb-20">
                                            {issues.map((issue) => (
                                                <IssueCard 
                                                    key={issue.id} 
                                                    issue={issue} 
                                                    onClick={() => { setSelectedIssue(issue); setIsSidebarOpen(false); }} 
                                                    compact={true} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border-t border-slate-800 bg-slate-950/30 z-40 relative">
                                    <button onClick={() => { setShowProfileModal(true); setIsSidebarOpen(false); }} className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-800 transition-all group">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-violet-500 p-[2px] shadow-lg shadow-blue-500/20">
                                            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                                                {currentUser?.photoURL ? (
                                                    <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                ) : (
                                                    <User className="w-5 h-5 text-white" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                                                {currentUser?.displayName || 'Citizen'}
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-medium">View Profile</p>
                                        </div>
                                        <Settings className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                                    </button>
                                </div>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                <main className="flex-1 h-full overflow-y-auto p-8 lg:p-12 scroll-smooth relative z-10">
                    <div className="max-w-5xl mx-auto">
                        
                        {view === 'dashboard' && (
                            <div className="animate-in fade-in zoom-in duration-500 space-y-10">
                                <div className="text-center space-y-4 py-10">
                                    <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-blue-200 tracking-tight">
                                        Welcome, {currentUser?.displayName?.split(' ')[0] || 'Citizen'}
                                    </h1>
                                    <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
                                        Empowering our community to build a safer, cleaner, and smarter city. 
                                        Report issues instantly and track their resolution in real-time.
                                    </p>
                                    <div className="pt-6 flex justify-center gap-4">
                                        <button onClick={() => handleNavigation('report')} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/25 transition-all active:scale-95 flex items-center gap-2">
                                            <PlusCircle className="w-5 h-5" /> Report Issue
                                        </button>
                                        <button onClick={() => handleNavigation('my-reports')} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-bold border border-slate-700 transition-all active:scale-95 flex items-center gap-2">
                                            <User className="w-5 h-5" /> My Activity
                                        </button>
                                    </div>
                                </div>

                                {/* --- USER CENTRIC STATS CARDS --- */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl flex items-center justify-between">
                                        <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Reports</p><p className="text-4xl font-black text-white">{myTotalCount}</p></div>
                                        <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20"><FileText className="w-6 h-6" /></div>
                                    </div>
                                    <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl flex items-center justify-between">
                                        <div><p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">Active Work</p><p className="text-4xl font-black text-white">{myInProgressCount}</p></div>
                                        <div className="p-4 bg-orange-500/10 rounded-2xl text-orange-400 border border-orange-500/20"><Activity className="w-6 h-6" /></div>
                                    </div>
                                    <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl flex items-center justify-between">
                                        <div><p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">Fixed</p><p className="text-4xl font-black text-white">{myResolvedCount}</p></div>
                                        <div className="p-4 bg-green-500/10 rounded-2xl text-green-400 border border-green-500/20"><CheckCircle2 className="w-6 h-6" /></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {view === 'report' && (
                            <ReportForm user={currentUser} onRefresh={() => handleNavigation('my-reports')} />
                        )}

                        {view === 'my-reports' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-4">
                                    <button onClick={() => handleNavigation('dashboard')} className="p-3 bg-slate-800/50 hover:bg-slate-700 rounded-full transition-all shadow-sm border border-slate-700 group backdrop-blur-sm">
                                        <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white" />
                                    </button>
                                    <div>
                                        <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('citizen.myReports') || "My Reports"}</h1>
                                        <p className="text-slate-400 font-medium">Your impact on the city infrastructure.</p>
                                    </div>
                                    </div>

                                    {myReports.length === 0 ? (
                                    <div className="text-center py-20 bg-slate-900/40 border-2 border-dashed border-slate-700/50 rounded-3xl backdrop-blur-md">
                                        <p className="text-slate-500 font-medium mb-4">You haven't reported any issues yet.</p>
                                        <button onClick={() => handleNavigation('report')} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold">Report Now</button>
                                    </div>
                                    ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {myReports.map(issue => <IssueCard key={issue.id} issue={issue} onClick={() => setSelectedIssue(issue)} onSubmitReview={handleSubmitReview} />)}
                                    </div>
                                    )}
                            </div>
                        )}
                    </div>
                </main>
                
                <aside className="hidden xl:flex w-96 bg-slate-900/60 backdrop-blur-2xl border-l border-slate-700/50 h-full flex-col shadow-2xl z-20 flex-shrink-0 overflow-hidden">
                    <div className="p-6 border-b border-slate-700/50 bg-slate-900/40 flex-shrink-0">
                        <h2 className="font-extrabold flex items-center gap-3 text-white">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20"><TrendingUp className="w-5 h-5"/></div> 
                            Community Reports
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 scroll-smooth custom-scrollbar">
                        {issues.map((issue) => (
                            <IssueCard key={issue.id} issue={issue} onClick={() => setSelectedIssue(issue)} compact={true} />
                        ))}
                    </div>
                </aside>
            </div>
        )}
      </div>
    </div>
  );
}

export default App;
