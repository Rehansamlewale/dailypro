import React from 'react';
import { Card, Badge } from './UI';
import { TrendingUp, Wallet, Landmark, Users, ArrowRightCircle, Scale, ChevronRight } from 'lucide-react';

const SummaryCard = ({ title, amount, icon: Icon, color, subtitle, isMain = false }) => (
  <Card className={`group relative transition-all duration-300 hover:-translate-y-1 ${isMain ? 'bg-indigo-600 border-none shadow-xl shadow-indigo-200' : ''}`} noPadding>
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${isMain ? 'bg-white/20 text-white' : `${color} bg-opacity-10 ${color.replace('bg-', 'text-')}`}`}>
          <Icon size={24} />
        </div>
        {!isMain && <ChevronRight className="text-slate-300 group-hover:text-slate-500 transition-colors" size={20} />}
      </div>
      
      <div>
        <p className={`text-sm font-bold uppercase tracking-widest mb-1 ${isMain ? 'text-indigo-100' : 'text-slate-400'}`}>
          {title}
        </p>
        <div className="flex items-baseline gap-1">
          <span className={`text-lg font-bold ${isMain ? 'text-indigo-200' : 'text-slate-400'}`}>₹</span>
          <span className={`text-3xl font-black tracking-tighter ${isMain ? 'text-white' : 'text-slate-800'}`}>
            {parseFloat(amount || 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
    
    {subtitle && (
      <div className={`px-6 py-3 border-t ${isMain ? 'border-white/10 bg-white/5 text-indigo-100' : 'border-slate-50 bg-slate-50/50 text-slate-500'} text-[11px] font-bold uppercase tracking-wider`}>
        {subtitle}
      </div>
    )}
  </Card>
);

export const Dashboard = ({ data }) => {
  const { 
    openingBalance = 0, 
    totalCash = 0, 
    totalBank = 0, 
    totalAccounts = 0, 
    closingBalance = 0,
    difference = 0
  } = data || {};

  return (
    <div className="space-y-8">
      {/* Featured Closing Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <SummaryCard 
            title="Current Closing Balance" 
            amount={closingBalance} 
            icon={TrendingUp} 
            color="bg-indigo-600"
            subtitle="Today's Real-time Final Total"
            isMain
          />
        </div>
        <Card className={`relative overflow-hidden border-none shadow-xl ${difference >= 0 ? 'bg-emerald-500 shadow-emerald-100' : 'bg-rose-500 shadow-rose-100'}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 -mr-16 -mt-16 rounded-full"></div>
          <div className="p-1">
            <p className="text-white/80 text-[11px] font-black uppercase tracking-[0.2em] mb-2">Net Day Difference</p>
            <div className="flex items-center gap-2 mb-4">
               <Scale className="text-white" size={28} />
               <span className="text-4xl font-black text-white tracking-tighter">
                {difference >= 0 ? '+' : ''}₹{difference.toLocaleString()}
               </span>
            </div>
            <Badge color={difference >= 0 ? 'emerald' : 'rose'}>
              {difference >= 0 ? 'Surplus Gained' : 'Deficit Lost'}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Grid Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          title="Opening Balance" 
          amount={openingBalance} 
          icon={ArrowRightCircle} 
          color="bg-slate-100"
          subtitle="Carried from yesterday"
        />
        <SummaryCard 
          title="Total Cash" 
          amount={totalCash} 
          icon={Wallet} 
          color="bg-indigo-100"
        />
        <SummaryCard 
          title="Bank Balances" 
          amount={totalBank} 
          icon={Landmark} 
          color="bg-blue-100"
        />
        <SummaryCard 
          title="Daily Accounts" 
          amount={totalAccounts} 
          icon={Users} 
          color="bg-emerald-100"
        />
      </div>

      {/* Visual Hint */}
      <div className="bg-white/40 border border-white/60 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Financial Insights</h4>
            <p className="text-xs text-slate-500 font-medium">Your data is synced automatically with Firebase Realtime DB.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-1 w-8 rounded-full bg-slate-200"></div>
          <div className="h-1 w-12 rounded-full bg-indigo-500"></div>
          <div className="h-1 w-8 rounded-full bg-slate-200"></div>
        </div>
      </div>
    </div>
  );
};
