// src/components/ReportForm.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Disc } from 'lucide-react';
import { getAiAdvice } from '../services/aiService';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Loader2, Send, UploadCloud, Sparkles, ShieldAlert,
  Droplets, Construction, Trash2, Lightbulb, HelpCircle, MapPin, ArrowLeft
} from 'lucide-react';
import { INDIAN_LOCATIONS } from '../data/locations';
import ConfirmationModal from './ConfirmationModal'; 

const ReportForm = ({ onRefresh, user }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1); 
  
  const [formData, setFormData] = useState({
    category: '', 
    title: '', 
    description: '',
    state: '',      
    city: '',       
    pincode: '',    
    addressDetail: '' 
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // AI Loading State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState(null);

  // Modal State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const CLOUD_NAME = "dtdkkjk1p"; 
  const UPLOAD_PRESET = "ml_default"; 

  const categories = [
    { id: 'Water Leakage', label: t('cat.Water Leakage') || "Water Leakage", icon: <Droplets className="w-10 h-10 text-white" />, bg: 'bg-gradient-to-br from-blue-600 to-blue-800', shadow: 'shadow-blue-500/30', border: 'border-blue-500/30' },
    { id: 'Potholes', label: t('cat.Potholes') || "Potholes", icon: <Construction className="w-10 h-10 text-white" />, bg: 'bg-gradient-to-br from-orange-600 to-orange-800', shadow: 'shadow-orange-500/30', border: 'border-orange-500/30' },
    { id: 'Garbage', label: t('cat.Garbage') || "Garbage", icon: <Trash2 className="w-10 h-10 text-white" />, bg: 'bg-gradient-to-br from-green-600 to-green-800', shadow: 'shadow-green-500/30', border: 'border-green-500/30' },
    { id: 'Street Light', label: t('cat.Street Light') || "Street Light", icon: <Lightbulb className="w-10 h-10 text-white" />, bg: 'bg-gradient-to-br from-yellow-600 to-yellow-800', shadow: 'shadow-yellow-500/30', border: 'border-yellow-500/30' },
    { id: 'Manhole', label: t('cat.Manhole') || "Manhole", icon: <Disc className="w-10 h-10 text-white" />, bg: 'bg-gradient-to-br from-red-600 to-red-800', shadow: 'shadow-red-500/30', border: 'border-red-500/30' },
    { id: 'Other', label: t('cat.Other') || "Other", icon: <HelpCircle className="w-10 h-10 text-white" />, bg: 'bg-gradient-to-br from-slate-600 to-slate-800', shadow: 'shadow-slate-500/30', border: 'border-slate-500/30' },
  ];

  const handleCategorySelect = (selectedCategory) => {
    if (selectedCategory !== formData.category) {
        setFormData({ 
            category: selectedCategory, 
            title: '', 
            description: '', 
            state: '', 
            city: '', 
            pincode: '', 
            addressDetail: '' 
        });
        setImage(null);
        setPreview(null);
        setAiAdvice(null);
    }
    setStep(2);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setAiAdvice(null);
    }
  };

  const handleStateChange = (e) => {
    setFormData({ ...formData, state: e.target.value, city: '', pincode: '' });
  };

  const handleCityChange = (e) => {
    setFormData({ ...formData, city: e.target.value, pincode: '' });
  };

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET); 
    data.append("cloud_name", CLOUD_NAME);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: data });
    const result = await res.json();
    return result.secure_url;
  };

  // --- AI Handler ---
  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!image || (!formData.description && !formData.title)) {
        return alert("Please add an image and at least a Title or Description!");
    }

    setAiLoading(true);
    
    try {
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2500));
        const [advice] = await Promise.all([
            getAiAdvice(image, formData.title, formData.description),
            minLoadingTime
        ]);
        setAiAdvice(advice);
    } catch (error) {
        console.error("AI Generation Error:", error);
        alert("Could not reach Gemini AI. Please check your connection.");
    } finally {
        setAiLoading(false);
    }
  };

  // --- CONFIRMATION HANDLER ---
  const handleConfirmSubmit = (e) => {
    e.preventDefault();

    // 1. Validation
    if (!image || !formData.title || !formData.description || !formData.state || !formData.city || !formData.pincode || !formData.addressDetail) {
      return alert("Please fill all fields, including full location details and an image!");
    }

    // 2. Open Confirmation Modal
    setConfirmModal({
        isOpen: true,
        type: 'info', // Info type for general confirmation
        title: 'Confirm Submission',
        message: `You are about to report a "${formData.category}" issue in ${formData.city}. Ensure all details are accurate for faster resolution.`,
        confirmText: 'Yes, Submit Report',
        onConfirm: executeSubmit // Pass the actual submit function here
    });
  };

  // --- ACTUAL SUBMISSION LOGIC ---
  const executeSubmit = async () => {
    setLoading(true);
    try {
      const imageUrl = await uploadToCloudinary(image);
      const fullLocationString = `${formData.addressDetail}, ${formData.city}, ${formData.state} - ${formData.pincode}`;
      const safeDefaultLocation = { lat: 12.9716, lng: 77.5946 }; 

      await addDoc(collection(db, "issues"), {
        title: formData.title,
        description: formData.description,
        state: formData.state,
        city: formData.city,
        pincode: formData.pincode,
        addressDetail: formData.addressDetail,
        locationText: fullLocationString, 
        location: safeDefaultLocation,
        imageUrl: imageUrl,
        status: "OPEN",
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        userName: user?.displayName || 'Anonymous Citizen',
        aiAnalysis: {
            category: formData.category, 
            severity: aiAdvice?.severity || "Medium",
            summary: formData.description.substring(0, 100),
            estimatedTime: aiAdvice?.estimatedTime || null,
            impactScope: aiAdvice?.impactScope || 0,
            precautions: aiAdvice?.precautions || [], 
            diyFixes: aiAdvice?.diyFixes || []        
        },
        createdAt: serverTimestamp(),
        votes: 0
      });

      // Reset form after success
      setStep(1);
      setFormData({ category: '', title: '', description: '', state: '', city: '', pincode: '', addressDetail: '' });
      setImage(null);
      setPreview(null);
      setAiAdvice(null);
      
      if (onRefresh) onRefresh();

    } catch (err) {
      console.error(err);
      alert("Error submitting report: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPincodeOptions = () => {
    if (!formData.state || !formData.city) return [];
    return INDIAN_LOCATIONS[formData.state][formData.city] || [];
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      
      {/* Confirmation Modal */}
      <ConfirmationModal 
        {...confirmModal} 
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
      />

      {/* STEP 1: CATEGORY SELECTION */}
      {step === 1 && (
        <div className="animate-in fade-in zoom-in duration-500">
           <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">{t('citizen.heading') || "What seems to be the problem?"}</h1>
                <p className="text-slate-400">{t('citizen.subheading') || "Select a category below to start your report."}</p>
           </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`relative group overflow-hidden rounded-3xl p-6 h-48 text-left transition-all duration-300 hover:scale-[1.02] ${cat.bg} border border-white/10 hover:border-white/30 shadow-lg hover:shadow-2xl ${cat.shadow}`}
              >
                <div className="absolute top-[-20px] right-[-20px] opacity-20 group-hover:opacity-30 transition-opacity transform scale-150 rotate-12">{cat.icon}</div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="bg-white/10 w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
                        {cat.icon}
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-1 shadow-black/10 drop-shadow-md">{cat.label}</h3>
                    </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: DARK FORM */}
      {step === 2 && (
        <div className="max-w-2xl mx-auto bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
          
          <div className="p-6 border-b border-slate-700/50 flex items-center gap-4 bg-slate-900/40">
            <button onClick={() => setStep(1)} className="p-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl transition-colors text-slate-300">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <h2 className="text-xl font-bold text-white">{t('citizen.reportTitle') || "Report Issue"}: {t(`cat.${formData.category}`) || formData.category}</h2>
            </div>
          </div>
          
          <form className="p-8 space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Issue Title</label>
              <input 
                type="text" 
                className="w-full p-4 bg-slate-950/50 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-white placeholder-slate-600 transition-all"
                placeholder={t('citizen.issueTitlePlaceholder') || "e.g., Heavy water leakage near Main Gate"}
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><MapPin className="w-3 h-3 text-blue-400"/> {t('citizen.locDetails') || "Location Details"}</label>
                
                <div className="grid grid-cols-2 gap-4">
                    <select value={formData.state} onChange={handleStateChange} className="w-full p-3 bg-slate-950/50 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-medium text-white custom-select">
                        <option value="" className="bg-slate-900 text-slate-400">{t('citizen.selectState') || "Select State"}</option>
                        {Object.keys(INDIAN_LOCATIONS).sort().map(state => <option key={state} value={state} className="bg-slate-900">{state}</option>)}
                    </select>

                    <select value={formData.city} onChange={handleCityChange} disabled={!formData.state} className="w-full p-3 bg-slate-950/50 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed">
                        <option value="" className="bg-slate-900 text-slate-400">{t('citizen.selectCity') || "Select City"}</option>
                        {formData.state && Object.keys(INDIAN_LOCATIONS[formData.state]).sort().map(city => <option key={city} value={city} className="bg-slate-900">{city}</option>)}
                    </select>
                </div>

                <div className="relative">
                      <input 
                        list="pincode-options"
                        type="text"
                        placeholder={t('citizen.enterPincode') || "Enter or Select Pincode"}
                        value={formData.pincode}
                        onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                        disabled={!formData.city}
                        className="w-full p-3 bg-slate-950/50 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-medium text-white disabled:opacity-50"
                      />
                      <datalist id="pincode-options">
                        {getPincodeOptions().map(pin => <option key={pin} value={pin} />)}
                      </datalist>
                </div>

                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-950/50 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-medium text-white placeholder-slate-600"
                  placeholder={t('citizen.addressPlaceholder') || "Street Name, Landmark, House No."}
                  value={formData.addressDetail}
                  onChange={(e) => setFormData({...formData, addressDetail: e.target.value})}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group relative h-full">
                <label className={`flex flex-col items-center justify-center w-full h-full min-h-[140px] border-2 border-dashed rounded-xl cursor-pointer transition-all ${preview ? 'border-blue-500 bg-slate-800/50' : 'border-slate-700 hover:border-blue-400 hover:bg-slate-800/30'}`}>
                    {preview ? <img src={preview} alt="Preview" className="h-full w-full object-cover rounded-xl" /> : <div className="flex flex-col items-center justify-center text-slate-400"><UploadCloud className="w-8 h-8 mb-2 group-hover:text-blue-400 transition-colors" /><p className="text-xs font-bold">{t('citizen.uploadPhoto') || "Upload Photo"}</p></div>}
                    <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        // Removed capture="environment" to allow Gallery option
                        onChange={handleImageChange} 
                    />
                </label>
                </div>
                <textarea 
                    className="w-full p-4 bg-slate-950/50 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm resize-none h-full min-h-[140px] text-white placeholder-slate-600"
                    placeholder={t('citizen.descPlaceholder') || "Describe the problem in detail..."}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={handleAskAI} disabled={aiLoading || loading} className="group bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 border border-indigo-500/30 transition-all active:scale-95">
                {aiLoading ? (
                    <><Loader2 className="animate-spin w-5 h-5" /> Analyzing...</>
                ) : (
                    <><Sparkles className="w-5 h-5 group-hover:text-indigo-200 transition-colors" /> {t('citizen.askAi') || "Ask Gemini"}</>
                )}
              </button>
              
              {/* TRIGGER CONFIRMATION MODAL ON CLICK */}
              <button 
                onClick={handleConfirmSubmit} 
                disabled={loading} 
                className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />} {t('citizen.submit') || "Submit Report"}
              </button>
            </div>
          </form>

          {aiAdvice && (
            <div className="p-6 bg-slate-950/80 text-white border-t border-slate-800 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
               <div className="flex items-center gap-2 mb-4">
                   <ShieldAlert className="text-yellow-400 w-5 h-5" />
                   <h3 className="font-bold text-lg">AI Analysis</h3>
                   <span className="ml-auto text-xs bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 px-2 py-1 rounded-lg uppercase tracking-wider font-bold">Severity: {aiAdvice.severity}</span>
               </div>
               <div className="grid grid-cols-2 gap-6 text-sm text-slate-300">
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <p className="font-bold text-blue-300 mb-2 uppercase text-xs tracking-wider">Precautions</p>
                    <ul className="list-disc list-inside space-y-1 marker:text-blue-500">{aiAdvice.precautions?.slice(0,3).map((tip, i) => <li key={i}>{tip}</li>)}</ul>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <p className="font-bold text-green-300 mb-2 uppercase text-xs tracking-wider">Quick Fixes</p>
                    <ul className="list-disc list-inside space-y-1 marker:text-green-500">{aiAdvice.diyFixes?.slice(0,3).map((fix, i) => <li key={i}>{fix}</li>)}</ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportForm;
