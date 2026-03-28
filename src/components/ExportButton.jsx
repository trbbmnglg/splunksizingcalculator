import React from 'react';

export default function ExportButton({ onClick, icon: Icon, label, className = '', disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center space-x-2 text-white px-4 py-2 text-sm font-medium transition-colors shadow-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
