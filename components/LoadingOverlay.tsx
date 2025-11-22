// components/LoadingOverlay.tsx
import React from 'react';

const LoadingOverlay: React.FC<{ message?: string }> = ({ message = 'Restoring session — please wait...' }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#111111] p-6 rounded-xl shadow-lg flex flex-col items-center gap-4 w-80">
        <div className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin" />
        <div className="text-sm text-gray-700 dark:text-gray-200 text-center">{message}</div>
        <div className="text-[11px] text-gray-400 text-center">If this hangs >10s open DevTools → Console.</div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
