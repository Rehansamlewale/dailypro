import React from 'react';

export const Card = ({ title, children, className = "", noPadding = false }) => (
  <div className={`bg-white/70 backdrop-blur-md rounded-[2rem] border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden ${className}`}>
    {title && (
      <div className="px-8 pt-8 pb-4">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
      </div>
    )}
    <div className={noPadding ? "" : "p-8 pt-4"}>
      {children}
    </div>
  </div>
);

export const Input = ({ label, icon: Icon, ...props }) => (
  <div className="flex flex-col gap-1.5 w-full group">
    {label && <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>}
    <div className="relative flex items-center">
      {Icon && <Icon className="absolute left-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />}
      <input
        {...props}
        className={`w-full bg-slate-100/50 border border-slate-200/60 rounded-2xl py-3 px-4 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 text-slate-700 font-medium ${Icon ? 'pl-11' : ''}`}
      />
    </div>
  </div>
);

export const Button = ({ children, variant = "primary", className = "", ...props }) => {
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 active:scale-[0.98]",
    secondary: "bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-[0.98]",
    success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-100 active:scale-[0.98]",
    danger: "bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-100 active:scale-[0.98]",
    outline: "bg-transparent border-2 border-slate-200 text-slate-500 hover:border-indigo-500 hover:text-indigo-600 active:scale-[0.98]",
  };
  
  return (
    <button
      {...props}
      className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Badge = ({ children, color = "indigo" }) => {
  const colors = {
    indigo: "bg-indigo-100 text-indigo-700",
    emerald: "bg-emerald-100 text-emerald-700",
    rose: "bg-rose-100 text-rose-700",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${colors[color]}`}>
      {children}
    </span>
  );
};
