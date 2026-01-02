// src/components/IssueCard.jsx
import React, { useState } from 'react';
import { MapPin, Clock, Star, Send, User, Coins, CheckCircle2 } from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion'; 
import { doc, updateDoc, increment } from 'firebase/firestore'; 
import { db } from '../firebase'; 
import ConfirmationModal from './ConfirmationModal'; // Ensure this path is correct

const IssueCard = ({ issue, onClick, onSubmitReview, compact = false }) => {
  const { category } = issue.aiAnalysis || {};
  
  // Review State
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Tipping State
  const [customTip, setCustomTip] = useState('');
  
  // Modal State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // --- STATE LOGIC ---
  const isResolved = issue.status === 'Resolved';
  const isInProgress = issue.status === 'In Progress';
  const hasReviewed = issue.isReviewed === true;
  
  // Decision is made if: 1. Tip exists (>0) OR 2. User explicitly skipped/denied tip (true)
  const tipDecisionMade = (Number(issue.tipAmount) || 0) > 0 || issue.tipSkipped === true;

  // 1. Handle Sending Tip (With Modal)
  const requestSendTip = (amount, e) => {
    e.stopPropagation();
    if (!amount) return;
    
    setConfirmModal({
        isOpen: true,
        type: 'success',
        title: 'Confirm Tip Payment',
        message: `Would you like to send a ₹${amount} tip to ${issue.contractorName}? This will be deducted from your account.`,
        confirmText: `Pay ₹${amount}`,
        onConfirm: async () => {
            try {
                const issueRef = doc(db, "issues", issue.id);
                await updateDoc(issueRef, {
                    tipAmount: increment(Number(amount)),
                    tipSkipped: false 
                });
            } catch (error) {
                console.error("Error tipping:", error);
                alert("Failed to send tip.");
            }
        }
    });
  };

  // 2. Handle "No Thanks" (With Modal)
  const requestSkipTip = (e) => {
      e.stopPropagation();
      setConfirmModal({
        isOpen: true,
        type: 'info',
        title: 'Skip Tipping?',
        message: 'This action cannot be undone. You will proceed to review the work without leaving a tip.',
        confirmText: 'Yes, Skip',
        cancelText: 'Go Back',
        onConfirm: async () => {
            try {
                const issueRef = doc(db, "issues", issue.id);
                await updateDoc(issueRef, {
                    tipSkipped: true 
                });
            } catch (error) {
                console.error("Error skipping tip:", error);
            }
        }
      });
  };

  // 3. Handle Review Submission
  const handleReviewSubmit = async (e) => {
    e.stopPropagation(); 
    if (rating === 0) return alert("Please select a star rating!");
    
    setIsSubmitting(true);
    if (onSubmitReview) {
        await onSubmitReview(issue.id, rating, comment);
    }
    setIsSubmitting(false);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Resolved': return 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.15)]';
      case 'In Progress': return 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.15)]';
      default: return 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.15)]';
    }
  };

  const statusClass = getStatusStyle(issue.status || 'Open');

  return (
    <>
    <ConfirmationModal 
        {...confirmModal} 
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
    />
    
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
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${statusClass} uppercase tracking-wider backdrop-blur-md`}>
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
                
                {/* 1. Contractor Info + Tip Receipt */}
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
                        {/* Tip Badge - ONLY Shows if tip was actually given */}
                        {(Number(issue.tipAmount) || 0) > 0 && (
                             <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                                <Coins className="w-3 h-3" /> ₹{issue.tipAmount}
                             </span>
                        )}
                    </div>
                )}

                {/* 2. TIPPING GATE (Only visible if NOT decided yet AND NOT Reviewed) */}
                {/* Once they review, this block is GONE regardless of tip status */}
                {((isResolved && !tipDecisionMade && !hasReviewed) || (isInProgress && !tipDecisionMade)) && (
                    <div className="bg-slate-800/80 border border-yellow-500/30 p-3 rounded-xl backdrop-blur-md animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-200 flex items-center gap-1 font-semibold">
                                <Coins className="w-3 h-3 text-yellow-500"/> 
                                {isResolved ? "Final Step: Add a Tip?" : "Motivate with a Tip?"}
                            </span>
                            <button onClick={requestSkipTip} className="text-[10px] text-slate-500 hover:text-white hover:underline decoration-slate-500 transition-colors">
                                No thanks
                            </button>
                        </div>
                        
                        <div className="flex gap-2">
                            {[30, 50, 100].map(amt => (
                                <button 
                                    key={amt}
                                    onClick={(e) => requestSendTip(amt, e)}
                                    className="flex-1 bg-slate-700 hover:bg-yellow-600 hover:text-black text-slate-300 hover:font-bold text-xs font-medium py-1.5 rounded-lg transition-all border border-slate-600 active:scale-95"
                                >
                                    ₹{amt}
                                </button>
                            ))}
                            <div className="relative flex-1">
                                    <span className="absolute left-2 top-1.5 text-xs text-slate-500">₹</span>
                                    <input 
                                    type="number" 
                                    placeholder=".." 
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-1.5 pl-4 pr-1 text-xs text-white outline-none focus:border-yellow-500 transition-colors"
                                    value={customTip}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => setCustomTip(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && requestSendTip(customTip, e)}
                                    />
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. REVIEW FORM (Only if Resolved & Decision Made & Not Reviewed) */}
                {isResolved && tipDecisionMade && !hasReviewed && (
                    <div className="bg-slate-800/80 border border-blue-500/30 p-3 rounded-xl backdrop-blur-md animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Work Complete - Please Rate</p>
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
                {/* Once reviewed, EVERYTHING else above (Tip UI, Review Form) is hidden */}
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
