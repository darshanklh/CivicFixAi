// src/components/ForecastModal.jsx
import React, { useState } from 'react';
import { X, Sparkles, Clock, AlertTriangle, Loader2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAiAdvice } from '../services/aiService'; 

const ForecastModal = ({ onClose }) => {
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handlePredict = async () => {
    if (!desc) return;
    setLoading(true);
    
    try {
        // 1. Create artificial delay (2.5 seconds)
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2500));

        // 2. Run AI service (passing null image, null title, and description)
        // Promise.all waits for both the AI and the Timer to finish
        const [advice] = await Promise.all([
            getAiAdvice(null, null, desc),
            minLoadingTime
        ]);

        setResult(advice);
    } catch (error) {
        console.error("Forecast Error:", error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-indigo-500/30 shadow-2xl overflow-hidden relative"
      >
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="p-8 border-b border-white/10 bg-gradient-to-r from-indigo-900/50 to-purple-900/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-500 p-2 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Gemini Insights</h2>
          </div>
          <p className="text-indigo-200">Predictive analytics for civic issues. Powered by Google Gemini.</p>
        </div>

        <div className="p-8">
          
          {/* Input Section */}
          {!result && (
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-400">Describe the issue to get a forecast:</label>
              <textarea 
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none h-32"
                placeholder="e.g., The main street light fell down during the storm..."
              />
              <button 
                onClick={handlePredict}
                disabled={loading || !desc}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                    <>
                        <Loader2 className="animate-spin" />
                        Calculating Probability...
                    </>
                ) : (
                    <>
                        <Activity className="w-5 h-5" />
                        Run Prediction
                    </>
                )}
              </button>
            </div>
          )}

          {/* Result Section */}
          {result && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
               <div className="grid grid-cols-2 gap-6 mb-8">
                 {/* Time Card */}
                 <div className="bg-indigo-500/10 border border-indigo-500/30 p-6 rounded-2xl text-center">
                   <Clock className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
                   <p className="text-sm text-indigo-200 uppercase font-bold tracking-wider">Est. Time</p>
                   <p className="text-3xl font-bold text-white mt-1">{result.estimatedTime || "24h"}</p>
                 </div>

                 {/* Impact Card */}
                 <div className="bg-purple-500/10 border border-purple-500/30 p-6 rounded-2xl text-center">
                   <AlertTriangle className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                   <p className="text-sm text-purple-200 uppercase font-bold tracking-wider">Impact</p>
                   <p className="text-lg font-bold text-white mt-2 leading-tight">{result.severity || "Medium"}</p>
                 </div>
               </div>

               <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <h4 className="font-bold text-slate-300 mb-2">AI Analysis:</h4>
                  {/* Safely handle if precautions array exists */}
                  <p className="text-slate-400 text-sm">
                    {result.precautions && result.precautions.length > 0 
                        ? result.precautions[0] 
                        : result.summary || "No specific advice available."}
                  </p>
               </div>

               <button 
                 onClick={() => { setResult(null); setDesc(''); }}
                 className="mt-6 w-full py-3 text-slate-400 hover:text-white font-semibold hover:underline"
               >
                 Run Another Prediction
               </button>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};

export default ForecastModal;
