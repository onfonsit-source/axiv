'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function GlobalOverlay() {
  const { toast, hideToast, confirm, hideConfirm } = useAppStore();

  return (
    <>
      {/* Toast Notification */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence>
          {toast.visible && (
            <motion.div
              initial={{ y: -100, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.9 }}
              className="pointer-events-auto"
            >
              <div className={`
                flex items-center gap-3 p-4 rounded-3xl shadow-2xl backdrop-blur-xl border
                ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : 
                  toast.type === 'error' ? 'bg-rose-500/90 border-rose-400 text-white' : 
                  'bg-slate-900/90 border-slate-700 text-white'}
              `}>
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
                {toast.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
                
                <p className="text-sm font-black flex-1">{toast.message}</p>
                
                <button onClick={hideToast} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirm.visible && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={hideConfirm}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{confirm.title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{confirm.message}</p>
                
                <div className="flex gap-3 pt-6">
                  <button
                    onClick={hideConfirm}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-sm font-black hover:bg-slate-200 transition-all"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => {
                      if (confirm.onConfirm) confirm.onConfirm();
                      hideConfirm();
                    }}
                    className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-sm font-black hover:scale-105 transition-all shadow-xl"
                  >
                    확인
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
