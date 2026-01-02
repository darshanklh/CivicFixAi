// src/components/ConfirmationModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, X, Info } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, type = 'info', confirmText = 'Confirm', cancelText = 'Cancel' }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    if (type === 'danger') return <AlertTriangle className="w-6 h-6 text-red-500" />;
    if (type === 'success') return <CheckCircle2 className="w-6 h-6 text-green-500" />;
    return <Info className="w-6 h-6 text-blue-500" />;
  };

  const getButtonColor = () => {
    if (type === 'danger') return 'bg-red-600 hover:bg-red-700 shadow-red-900/20';
    if (type === 'success') return 'bg-green-600 hover:bg-green-700 shadow-green-900/20';
    return 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        >
          <div className="p-6 text-center">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-slate-800 border border-slate-700`}>
              {getIcon()}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">{message}</p>
            
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 font-medium hover:bg-slate-800 transition-colors text-sm"
              >
                {cancelText}
              </button>
              <button 
                onClick={() => { onConfirm(); onClose(); }}
                className={`flex-1 px-4 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all active:scale-95 ${getButtonColor()}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmationModal;
