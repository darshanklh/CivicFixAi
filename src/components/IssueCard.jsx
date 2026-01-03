// src/components/IssueCard.jsx
import React, { useState } from 'react';
import { MapPin, Clock, Star, Send, User, Coins, CheckCircle2, X } from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion'; 
import { doc, updateDoc, increment } from 'firebase/firestore'; 
import { db } from '../firebase'; 

const IssueCard = ({ issue, onClick, onSubmitReview, compact = false }) => {
  const { category } = issue.aiAnalysis || {};
  
  // Review State
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Tipping Modal State
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipStep, setTipStep] = useState('ask'); // 'ask' | 'input'
  const [customTip, setCustomTip] = useState('');
  const [tipLoading, setTipLoading] = useState(false);

  // --- LOGIC ---
  const isResolved = issue.status === 'Resolved';
  const isInProgress = issue.status === 'In Progress';
  const hasReviewed = issue.isReviewed === true;
  
  // Decision is made if: 1. Tip exists (>0) OR 2. User explicitly skipped tip (true)
  const tipDecisionMade = (Number(issue.tipAmount) || 0) > 0 || issue.tipSkipped === true;

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Resolved': return 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.15)]';
      case 'In Progress': return 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.15)]';
      default: return 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.15)]';
    }
  };

  // --- HANDLERS ---

  // 1. Triggered when user clicks "Rate & Review"
  const handleInitiateReview = (e) => {
    e.stopPropagation();
    // If resolved AND no tip decision yet, show the Tipping Popup first
    if (isResolved && !tipDecisionMade) {
        setTipStep('ask');
        setShowTipModal(true);
    } else {
        // Otherwise, go straight to review
        setShowReviewForm(true);
    }
  };

  // 2. Handle "No Thanks" in Popup
  const handleSkipTip = async () => {
    setTipLoading(true);
    try {
        const issueRef = doc(db, "issues", issue.id);
        await updateDoc(issueRef, { tipSkipped: true });
        setShowTipModal(false);
        setShowReviewForm(true); // Proceed to review
    } catch (error) {
        console.error(error);
    } finally {
        setTipLoading(false);
    }
  };

  // 3. Handle "Yes" -> "Pay" in Popup
  const handleSendTip = async () => {
    if (!customTip || Number(customTip) <= 0) return alert("Please enter a valid amount");
    setTipLoading(true);
    try {
        const issueRef = doc(db, "issues", issue.id);
        await updateDoc(issueRef, { 
            tipAmount: increment(Number(customTip)),
            tipSkipped: false 
        });
        setShowTipModal(false);
        setShowReviewForm(true); // Proceed to review
    } catch (error) {
        console.error(error);
        alert("Transaction failed");
    } finally {
        setTipLoading(false);
    }
  };

  // 4. Submit the actual review
  const handleReviewSubmit = async (e) => {
    e.stopPropagation(); 
    if (rating === 0) return alert("Please select a star rating!");
    
    setIsSubmitting(true);
    if (onSubmitReview) {
        await onSubmitReview(issue.id, rating, comment);
    }
    setIsSubmitting(false);
    setShowReviewForm(false);
  };

  return (
    <>
    {/* --- TIPPING POPUP MODAL (Citizen Section Only) --- */}
    <AnimatePresence>
        {showTipModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm relative overflow-hidden"
                >
                    {/* Background Glow */}
                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent pointer-events-none" />

                    <div className="relative z-10 text-center">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                            <Coins className="w-8 h-8 text-yellow-400" />
                        </div>
                        
                        {tipStep === 'ask' ? (
                            <>
                                <h3 className="text-xl font-bold text-white mb-2">Leave a Tip?</h3>
                                <p className="text-slate-400 text-sm mb-6">
                                    The contractor has marked this issue as <strong>Resolved</strong>. Would you like to appreciate their work with a tip?
                                </p>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={handleSkipTip}
                                        disabled={tipLoading}
                                        className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-300 font-bold text-sm hover:bg-slate-800 transition-colors"
                                    >
                                        No Thanks
                                    </button>
                                    <button 
                                        onClick={() => setTipStep('input')}
                                        className="flex-1 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm shadow-lg shadow-yellow-500/20 transition-colors"
                                    >
                                        Yes, Add Tip
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold text-white mb-2">Enter Amount</h3>
                                <p className="text-slate-400 text-sm mb-4">How much would you like to tip?</p>
                                
                                <div className="relative mb-6">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input 
                                        type="number" 
                                        autoFocus
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white font-bold outline-none focus:border-yellow-500 transition-colors"
                                        placeholder="50"
                                        value={customTip}
                                        onChange={(e) => setCustomTip(e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setTipStep('ask')}
                                        className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-300 font-bold text-sm hover:bg-slate-800"
                                    >
                                        Back
                                    </button>
                                    <button 
                                        onClick={handleSendTip}
                                        disabled={tipLoading}
                                        className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm shadow-lg shadow-green-500/20 transition-colors flex justify-center items-center gap-2"
                                    >
                                        {tipLoading ? "Processing..." : "Pay Tip"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>

    {/* --- MAIN CARD --- */}
    <motion.div 
      onClick={onClick}
      whileHover={{ y: -4, borderColor: 'rgba(59, 130, 246, 0.4)' }}
      className={`bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/60 overflow-hidden flex flex-col relative shadow-xl cursor-pointer group hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-300 ${compact ? 'mb-3' : 'h-full'}`}
    >
      {/* Image Section */}
      <div className={`relative overflow-hidden ${compact ? 'h-24' : 'h-48'}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 opacity-60"></div>
        <motion.img 
          src={issue.imageUrl} 
          alt={category} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
        />
        <div className="absolute top-3 right-3 z-20">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(issue.status || 'Open')} uppercase tracking-wider backdrop-blur-md`}>
            {issue.status || "Open"}
          </span>
        </div>
      </div>
      
      {/* Content Section */}
      <div className={`${compact ? 'p-3' : 'p-5'} flex-1 flex flex-col`}>
        <div className="flex justify-between items-start mb-2">
            <h3 className={`font-bold text-white line-clamp-1 group-hover:text-blue-400 transition-colors ${compact ? 'text-xs' : 'text-lg'}`}>
            {issue.title || category || "Reported Issue"}
            </h3>
        </div>

        {/* --- DYNAMIC INTERACTION SECTION --- */}
        {!compact && (
            <div className="mb-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                
                {/* 1. Contractor Info + Tip Receipt (If Tip Exists) */}
                {(isInProgress || isResolved) && issue.contractorName && (
                    <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-500/20 rounded-full border border-blue-500/30">
                                <User className="w-3 h-3 text-blue-400"/>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Contractor</p>
                                <p className="text-xs font-bold text-white">{issue.contractorName}</p>
                            </div>
                        </div>
                        {/* Static Tip Badge (Visual Only) */}
                        {(Number(issue.tipAmount) || 0) > 0 && (
                             <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                                <Coins className="w-3 h-3" /> ₹{issue.tipAmount}
                             </span>
                        )}
                    </div>
                )}

                {/* 2. THE ACTION BUTTON (Visible if Resolved & Not Reviewed) */}
                {isResolved && !hasReviewed && !showReviewForm && (
                    <button 
                        onClick={handleInitiateReview}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                    >
                        <Star className="w-4 h-4 fill-white" /> Rate & Review Work
                    </button>
                )}

                {/* 3. REVIEW FORM (Only visible after Tip Logic is Done) */}
                {showReviewForm && (
                    <div className="bg-slate-800/80 border border-blue-500/30 p-3 rounded-xl backdrop-blur-md animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Work Complete - Please Rate</p>
                            <button onClick={() => setShowReviewForm(false)} className="text-slate-500 hover:text-white"><X className="w-3 h-3"/></button>
                        </div>
                        <div className="flex justify-center gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)} className="focus:outline-none hover:scale-110 transition-transform">
                                    <Star className={`w-5 h-5 ${star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Write a review..." 
                                value={comment} 
                                onChange={(e) => setComment(e.target.value)} 
                                className="flex-1 bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500 transition-all" 
                            />
                            <button 
                                onClick={handleReviewSubmit} 
                                disabled={isSubmitting}
                                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500 transition-colors shadow-lg disabled:opacity-50"
                            >
                                <Send className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                )}

                {/* 4. FINAL STATE: Review Summary (ReadOnly) */}
                {hasReviewed && (
                    <div className="bg-slate-950/30 border border-slate-800 rounded-lg p-2 flex gap-2 items-start">
                        <div className="mt-0.5"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500"/></div>
                        <div>
                            <p className="text-xs font-bold text-white">{issue.rating}/5 Rating</p>
                            <p className="text-[10px] text-slate-400 italic">"{issue.review}"</p>
                        </div>
                    </div>
                )}

            </div>
        )}

        {/* Fallback Description for Compact Mode */}
        {compact && (
            <p className={`text-slate-400 mb-2 line-clamp-2 leading-relaxed text-[10px]`}>
                {issue.description || issue.aiAnalysis?.summary}
            </p>
        )}

      </div>
    </motion.div>
    </>
  );
};

export default IssueCard;
