import React, { useState, useEffect } from 'react';
import { db, ref, set, get, onValue } from './services/firebase';
import { format, subDays, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { LayoutDashboard, Wallet, Landmark, Users, Calendar, Save, Plus, Trash2, TrendingUp, ArrowRightCircle, CheckCircle2, AlertCircle, X, RefreshCcw, Scale, FileText, Download, ChevronRight, ReceiptText } from 'lucide-react';

const App = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportRange, setReportRange] = useState({ start: format(new Date(), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Custom Modal State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, name: '', type: '', index: null });

  // App Data
  const [openingBalance, setOpeningBalance] = useState(0);
  const [cashDetails, setCashDetails] = useState({}); 
  const [bankDetails, setBankDetails] = useState([]); 
  const [accountDetails, setAccountDetails] = useState([]); 
  const [expenses, setExpenses] = useState([]); 
  
  // Summary Totals
  const totalCash = Object.entries(cashDetails).reduce((acc, [den, count]) => acc + (den * (count || 0)), 0);
  const totalBank = bankDetails.reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0);
  const totalAccount = accountDetails.reduce((acc, a) => acc + (parseFloat(a.amount) || 0), 0);
  const closingBalance = totalCash + totalBank + totalAccount;

  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Fetching Logic
  useEffect(() => {
    setIsInitialized(false);
    setLoading(true);
    const datePath = `dailyRecords/${selectedDate}`;
    
    // Initial One-Time Fetch
    const initData = async () => {
      try {
        const snapshot = await get(ref(db, datePath));
        const dayData = snapshot.val() || {};
        
        // Opening Balance
        let opBal = dayData.openingBalance;
        if (opBal === undefined || opBal === null) {
          const yesterday = format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd');
          const yesterdaySnap = await get(ref(db, `dailyRecords/${yesterday}`));
          opBal = yesterdaySnap.val()?.closingBalance || 0;
        }
        setOpeningBalance(opBal);
        setCashDetails(dayData.cashDetails || {});

        // Master List Persistence
        const masterSnap = await get(ref(db, `masterData`));
        const master = masterSnap.val() || {};
        
        const mergeList = (masterNames, todayAmounts) => {
          const names = masterNames || [];
          return names.map(name => ({ name, amount: todayAmounts?.[name] || 0 }));
        };

        setBankDetails(mergeList(master.bankIds, dayData.bankDetails));
        setAccountDetails(mergeList(master.accountNames, dayData.accountDetails));
        setExpenses(dayData.expenses || []);
        
        setIsInitialized(true);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    initData();

    // Real-time Updates (Optional for Closing Balance)
    const unsubscribe = onValue(ref(db, datePath), (snapshot) => {
      // Only sync background changes to opening balance if already initialized
      const dayData = snapshot.val() || {};
      if (dayData.openingBalance !== undefined) setOpeningBalance(dayData.openingBalance);
    });

    return () => unsubscribe();
  }, [selectedDate]);

  // 2. Saving Logic
  const handleSave = async () => {
    setLoading(true);
    try {
      const bankNames = bankDetails.map(b => b.name).filter(n => n?.trim() !== "");
      const accountNames = accountDetails.map(a => a.name).filter(n => n?.trim() !== "");
      await set(ref(db, `masterData/bankIds`), bankNames);
      await set(ref(db, `masterData/accountNames`), accountNames);

      const dailyData = {
        openingBalance,
        cashDetails,
        bankDetails: bankDetails.reduce((acc, b) => { if(b.name) acc[b.name] = b.amount; return acc; }, {}),
        accountDetails: accountDetails.reduce((acc, a) => { if(a.name) acc[a.name] = a.amount; return acc; }, {}),
        expenses,
        closingBalance
      };
      await set(ref(db, `dailyRecords/${selectedDate}`), dailyData);
      alert("✅ Records Synchronized!");
      setActiveTab('dashboard');
    } catch (error) {
      alert("❌ Sync Error!");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    if (confirmModal.type === 'bank') {
      setBankDetails(bankDetails.filter((_, i) => i !== confirmModal.index));
    } else if (confirmModal.type === 'accounts') {
      setAccountDetails(accountDetails.filter((_, i) => i !== confirmModal.index));
    } else if (confirmModal.type === 'expenses') {
      setExpenses(expenses.filter((_, i) => i !== confirmModal.index));
    }
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const SaveButton = ({ label }) => (
    <button onClick={handleSave} className="w-full mt-6 sm:mt-10 bg-indigo-600 text-white py-4 sm:py-5 rounded-2xl sm:rounded-[2.5rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all active:scale-[0.98] text-xs sm:text-base">
      <Save size={20} className="sm:w-6 sm:h-6" /> {label || 'Sync with Registry'}
    </button>
  );

  if (loading && !closingBalance) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCcw size={48} className="animate-spin text-indigo-400 mx-auto" />
          <p className="font-black text-slate-400 tracking-[0.3em] uppercase text-[10px]">Registry Link Active</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans selection:bg-indigo-100 overflow-x-hidden">
      
      {/* --- CUSTOM MODAL --- */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}></div>
          <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 max-w-md w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-rose-50 rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-rose-500 mx-auto mb-4 sm:mb-6">
              <AlertCircle size={32} className="sm:w-10 sm:h-10" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-center text-slate-800 tracking-tighter mb-1.5 sm:mb-2">Confirm Removal?</h3>
            <p className="text-slate-500 text-center text-[12px] sm:text-sm font-medium mb-6 sm:mb-10 px-2 sm:px-4 leading-relaxed">
              Are you sure you want to delete <span className="font-black text-slate-800 underline decoration-rose-200 underline-offset-4">"{confirmModal.name || 'this item'}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 sm:gap-4">
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-colors text-[10px] sm:text-xs"
              >
                No, Keep
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-white bg-rose-500 shadow-xl shadow-rose-100 uppercase tracking-widest hover:bg-rose-600 transition-all active:scale-95 text-[10px] sm:text-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-2xl border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="bg-indigo-600 p-1.5 sm:p-2.5 rounded-lg sm:rounded-2xl text-white shadow-xl shadow-indigo-100">
              <LayoutDashboard size={18} className="sm:w-6 sm:h-6" />
            </div>
            <h1 className="text-base sm:text-xl font-black tracking-tighter">FinTrack</h1>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-2 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors max-w-[130px] sm:max-w-none relative overflow-hidden">
            <Calendar size={12} className="text-indigo-500 shrink-0" />
            <span className="font-bold text-slate-600 text-[11px] sm:text-sm whitespace-nowrap">
               {format(new Date(selectedDate), 'dd-MM-yyyy')}
            </span>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              className="absolute inset-0 opacity-0 cursor-pointer" 
            />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* Navigation Tabs - Mobile Scrollable */}
        <div className="flex gap-1.5 sm:gap-2 mb-6 sm:mb-12 bg-slate-200/40 p-1 rounded-2xl sm:rounded-[2rem] shadow-inner overflow-x-auto no-scrollbar touch-pan-x">
          {[
            { id: 'dashboard', label: 'Summary', icon: LayoutDashboard },
            { id: 'cash', label: 'Cash', icon: Wallet },
            { id: 'bank', label: 'Bank IDs', icon: Landmark },
            { id: 'accounts', label: 'Accounts', icon: Users },
            { id: 'expenses', label: 'Expenses', icon: ReceiptText },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3.5 px-3 sm:px-6 rounded-xl sm:rounded-[1.7rem] font-black transition-all whitespace-nowrap uppercase tracking-widest text-[9px] sm:text-[10px] ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-lg text-[10px] sm:text-[11px]' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <tab.icon size={14} className="sm:w-4 sm:h-4" /> 
              <span className="hidden xs:inline">{tab.label}</span>
              <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* --- SUMMARY VIEW --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* --- TOP SMALL STATS --- */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
              {[
                { label: 'Total Cash', val: totalCash, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
                { label: 'Bank Total', val: totalBank, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                { label: 'Accounts Sum', val: totalAccount, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                { label: 'Today Expense', val: expenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0), color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
              ].map((stat, i) => (
                <div key={stat.label} className={`px-3 sm:px-6 py-3.5 sm:py-5 rounded-2xl sm:rounded-[2rem] border ${stat.bg} shadow-sm flex flex-col items-center group hover:scale-105 transition-transform ${i >= 2 ? 'col-span-2 md:col-span-1' : ''}`}>
                  <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 leading-none">{stat.label}</p>
                  <p className={`text-base sm:text-xl font-black ${stat.color} leading-none`}>₹{stat.val.toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* --- PRIMARY DISPLAY ROW --- */}
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Opening Balance */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Opening Balance</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-base sm:text-xl font-bold text-slate-300">₹</span>
                   <span className="text-2xl sm:text-3xl font-black tracking-tighter text-slate-800 leading-none">{openingBalance.toLocaleString()}</span>
                </div>
                <div className="mt-4 sm:mt-5 flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black text-emerald-500 bg-emerald-50 w-fit px-2.5 py-1 rounded-full uppercase tracking-widest leading-none">
                  <CheckCircle2 size={10} /> Live Yest.
                </div>
              </div>
              
              {/* Closing Total */}
              <div className="bg-indigo-600 p-5 sm:p-6 rounded-2xl sm:rounded-[2.5rem] shadow-xl shadow-indigo-100 text-white relative overflow-hidden group">
                <p className="text-[8px] sm:text-[9px] font-black text-indigo-100 uppercase tracking-[0.2em] mb-2 leading-none opacity-70">Closing Total</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-base sm:text-xl font-bold text-indigo-300">₹</span>
                   <span className="text-2xl sm:text-4xl font-black tracking-tighter leading-none">{closingBalance.toLocaleString()}</span>
                </div>
                <div className="mt-4 sm:mt-5 flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black text-white bg-white/10 w-fit px-2.5 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm leading-none">
                  <TrendingUp size={10} /> Today
                </div>
              </div>

              {/* Net Income */}
              <div className={`p-5 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border shadow-xl transition-all duration-500 flex flex-col justify-center relative overflow-hidden group xs:col-span-2 md:col-span-1 ${closingBalance - openingBalance >= 0 ? 'bg-emerald-500 border-emerald-400 shadow-emerald-100' : 'bg-rose-500 border-rose-400 shadow-rose-100'}`}>
                <div className="relative z-10">
                  <p className="text-[8px] sm:text-[9px] font-black text-white/70 uppercase tracking-[0.2em] mb-2 leading-none">Net Day Income</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tighter leading-none">
                      {closingBalance - openingBalance >= 0 ? '+' : ''} ₹{(closingBalance - openingBalance).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-4 sm:mt-5">
                    <div className="px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 w-fit">
                        <p className="text-[8px] sm:text-[9px] font-black text-white uppercase tracking-widest leading-none">
                          {closingBalance - openingBalance >= 0 ? '💰 Surplus' : '📉 Deficit'}
                        </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Financial Report Hub */}
            <div className="bg-slate-900 px-5 sm:px-10 py-8 sm:py-12 rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden relative group">
               <div className="absolute top-0 left-0 w-full h-full bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors"></div>
               <div className="relative z-10">
                 <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white mx-auto mb-4 sm:mb-6 border border-white/10">
                    <FileText size={24} className="sm:w-8 sm:h-8" />
                 </div>
                 <h3 className="text-white text-lg sm:text-2xl font-black tracking-tight mb-1 sm:mb-2 text-center">Multi-Day Report</h3>
                 <p className="text-slate-400 text-[10px] sm:text-sm max-w-[200px] sm:max-w-sm mx-auto mb-6 sm:mb-10 text-center">Consolidated financial performance sheet.</p>
                 
                 {/* Range Selector */}
                 <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-6 sm:mb-10">
                    <div className="bg-white/5 border border-white/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-4 w-full sm:w-auto relative overflow-hidden">
                       <p className="text-[7px] sm:text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">From</p>
                       <span className="text-white font-bold text-[12px] sm:text-sm">
                          {format(new Date(reportRange.start), 'dd-MM-yyyy')}
                       </span>
                       <input 
                        type="date" 
                        value={reportRange.start}
                        onChange={(e) => setReportRange({ ...reportRange, start: e.target.value })}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                       />
                    </div>
                    <div className="text-white/20 hidden sm:block">
                       <ChevronRight size={20} />
                    </div>
                    <div className="bg-white/5 border border-white/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-4 w-full sm:w-auto relative overflow-hidden">
                       <p className="text-[7px] sm:text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">To</p>
                       <span className="text-white font-bold text-[12px] sm:text-sm">
                          {format(new Date(reportRange.end), 'dd-MM-yyyy')}
                       </span>
                       <input 
                        type="date" 
                        value={reportRange.end}
                        onChange={(e) => setReportRange({ ...reportRange, end: e.target.value })}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                       />
                    </div>
                 </div>

                 <button 
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const range = eachDayOfInterval({ start: new Date(reportRange.start), end: new Date(reportRange.end) });
                      const allRecordsSnap = await get(ref(db, `dailyRecords`));
                      const allRecords = allRecordsSnap.val() || {};
                      const rows = [["FinTrack Consolidated Financial Report"], ["Range Selection", `${format(new Date(reportRange.start), 'dd-MM-yyyy')} to ${format(new Date(reportRange.end), 'dd-MM-yyyy')}`], [""], ["Date", "Opening Balance", "Total Cash", "Bank Total", "Account Total", "Closing Balance", "Profit/Loss"]];
                      range.forEach(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const displayDate = format(day, 'dd-MM-yyyy');
                        const data = allRecords[dateStr] || {};
                        const tc = Object.entries(data.cashDetails || {}).reduce((a, [d, c]) => a + (d * c), 0);
                        const tb = Object.values(data.bankDetails || {}).reduce((a, v) => a + (parseFloat(v) || 0), 0);
                        const ta = Object.values(data.accountDetails || {}).reduce((a, v) => a + (parseFloat(v) || 0), 0);
                        const cb = data.closingBalance || (tc + tb + ta);
                        const ob = data.openingBalance || 0;
                        rows.push([displayDate, ob, tc, tb, ta, cb, cb - ob]);
                      });
                      const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `FinTrack_Consolidated_${reportRange.start}_to_${reportRange.end}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } catch (err) { alert("Error generating range report."); } finally { setLoading(false); }
                  }}
                  className="w-full sm:w-auto bg-white text-slate-900 px-6 sm:px-12 py-3.5 sm:py-5 rounded-xl sm:rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-2.5 mx-auto hover:bg-indigo-50 transition-all shadow-2xl active:scale-95 text-[10px] sm:text-base"
                 >
                   <Download size={18} className="sm:w-6 sm:h-6" /> Export Sheet
                 </button>
               </div>
            </div>
          </div>
        )}

        {/* --- CASH TAB --- */}
        {activeTab === 'cash' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="bg-white p-5 sm:p-12 rounded-[2rem] sm:rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6 sm:space-y-12">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-10 h-10 sm:w-16 sm:h-16 bg-indigo-100 rounded-lg sm:rounded-[1.5rem] flex items-center justify-center text-indigo-600 shadow-sm">
                  <Wallet size={20} className="sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-3xl font-black tracking-tighter leading-none mb-1 sm:mb-2">Liquid Cash</h2>
                  <p className="text-slate-400 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">Entry of physical notes</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-10">
                {[500, 200, 100, 50, 20, 10].map(den => (
                  <div key={den} className="flex flex-col gap-2 sm:gap-4 p-3.5 sm:p-8 bg-slate-50/50 rounded-xl sm:rounded-[2.5rem] border border-slate-200/50 hover:bg-white hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-center px-0.5">
                      <span className="bg-indigo-600 text-white list-none text-[7px] sm:text-[9px] font-black px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg tracking-widest uppercase">₹{den}</span>
                      <span className={`text-[10px] sm:text-lg font-black transition-all ${cashDetails[den] ? 'text-indigo-600' : 'text-slate-200'}`}>
                        ₹{(den * (cashDetails[den] || 0)).toLocaleString()}
                      </span>
                    </div>
                      <input
                        type="number"
                        placeholder="0"
                        value={cashDetails[den] || ""}
                        onWheel={(e) => e.target.blur()}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        onChange={(e) => setCashDetails({ ...cashDetails, [den]: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white border border-slate-200 rounded-lg sm:rounded-xl p-2 sm:p-5 outline-none focus:ring-8 focus:ring-indigo-500/5 font-black text-base sm:text-2xl text-slate-700"
                      />
                  </div>
                ))}
              </div>
              
              <div className="p-5 sm:p-10 bg-indigo-600 rounded-2xl sm:rounded-[3rem] shadow-2xl shadow-indigo-100 flex flex-col sm:flex-row items-center justify-between text-white gap-2 sm:gap-4 text-center sm:text-left">
                <p className="text-indigo-200 text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-60">Calculated Cash Total</p>
                <p className="text-2xl sm:text-5xl font-black tracking-tighter">₹{totalCash.toLocaleString()}</p>
              </div>
              
              <SaveButton label="Record Cash Entry" />
            </div>
          </div>
        )}

        {/* --- BANK TAB --- */}
        {activeTab === 'bank' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="bg-white p-5 sm:p-12 rounded-[2rem] sm:rounded-[3.5rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-6 sm:mb-12">
                <div className="flex items-center gap-3 sm:gap-6">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 bg-blue-100 rounded-lg sm:rounded-[1.5rem] flex items-center justify-center text-blue-600 shadow-sm">
                    <Landmark size={20} className="sm:w-8 sm:h-8" />
                  </div>
                   <div>
                    <h2 className="text-xl sm:text-3xl font-black tracking-tighter leading-none mb-1 sm:mb-2">Bank Registry</h2>
                    <p className="text-slate-400 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">Across all IDs</p>
                  </div>
                </div>
                <button 
                  onClick={() => setBankDetails([...bankDetails, { name: '', amount: 0 }])}
                  className="bg-blue-600 text-white p-2.5 sm:p-4 rounded-lg sm:rounded-2xl hover:scale-110 transition-all shadow-xl shadow-blue-100 shrink-0"
                >
                  <Plus size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>
              
              <div className="space-y-3 sm:space-y-6">
                {bankDetails.map((bank, idx) => (
                  <div key={idx} className="flex flex-col gap-2.5 p-3.5 sm:p-6 bg-slate-50/50 rounded-xl sm:rounded-[2.5rem] border border-slate-200/50 hover:bg-white hover:shadow-xl transition-all">
                    <input 
                      placeholder="Bank Identifier" 
                      value={bank.name} 
                      onChange={(e) => {
                        const newBanks = [...bankDetails];
                        newBanks[idx].name = e.target.value;
                        setBankDetails(newBanks);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg sm:rounded-xl px-4 py-2 sm:px-5 sm:py-3 outline-none font-bold text-sm sm:text-lg text-slate-800"
                    />
                    <div className="flex gap-2.5">
                       <input 
                        type="number" 
                        placeholder="0.00" 
                        value={bank.amount || ""} 
                        onWheel={(e) => e.target.blur()}
                        inputMode="decimal"
                        onChange={(e) => {
                          const newBanks = [...bankDetails];
                          newBanks[idx].amount = parseFloat(e.target.value) || 0;
                          setBankDetails(newBanks);
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-lg sm:rounded-xl px-4 py-2 sm:px-5 sm:py-3 outline-none font-black text-blue-600 text-base sm:text-xl"
                      />
                      <button 
                        onClick={() => setConfirmModal({ isOpen: true, name: bank.name, type: 'bank', index: idx })} 
                        className="bg-rose-50 px-3.5 rounded-lg sm:rounded-xl text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                      >
                        <Trash2 size={18} className="sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <SaveButton label="Update Bank Records" />
            </div>
          </div>
        )}

        {/* --- ACCOUNTS TAB --- */}
        {activeTab === 'accounts' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="bg-white p-5 sm:p-12 rounded-[2rem] sm:rounded-[3.5rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-6 sm:mb-12">
                <div className="flex items-center gap-3 sm:gap-6">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 bg-emerald-100 rounded-lg sm:rounded-[1.5rem] flex items-center justify-center text-emerald-600 shadow-sm">
                    <Users size={20} className="sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-3xl font-black tracking-tighter leading-none mb-1 sm:mb-2">Ledgers</h2>
                    <p className="text-slate-400 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">Client balances</p>
                  </div>
                </div>
                <button 
                  onClick={() => setAccountDetails([...accountDetails, { name: '', amount: 0 }])}
                  className="bg-emerald-600 text-white p-2.5 sm:p-4 rounded-lg sm:rounded-2xl hover:scale-110 transition-all shadow-xl shadow-emerald-100 shrink-0"
                >
                  <Plus size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>
              
              <div className="space-y-3 sm:space-y-6">
                {accountDetails.map((acc, idx) => (
                  <div key={idx} className="flex flex-col gap-2.5 p-3.5 sm:p-6 bg-slate-50/50 rounded-xl sm:rounded-[2.5rem] border border-slate-200/50 hover:bg-white hover:shadow-xl transition-all">
                    <input 
                      placeholder="Account Entity" 
                      value={acc.name} 
                      onChange={(e) => {
                        const newAccs = [...accountDetails];
                        newAccs[idx].name = e.target.value;
                        setAccountDetails(newAccs);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg sm:rounded-xl px-4 py-2 sm:px-5 sm:py-3 outline-none font-bold text-sm sm:text-lg text-slate-800"
                    />
                    <div className="flex gap-2.5">
                       <input 
                        type="number" 
                        placeholder="0.00" 
                        value={acc.amount || ""} 
                        onWheel={(e) => e.target.blur()}
                        inputMode="decimal"
                        onChange={(e) => {
                          const newAccs = [...accountDetails];
                          newAccs[idx].amount = parseFloat(e.target.value) || 0;
                          setAccountDetails(newAccs);
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-lg sm:rounded-xl px-4 py-2 sm:px-5 sm:py-3 outline-none font-black text-emerald-600 text-base sm:text-xl text-center"
                      />
                      <button 
                        onClick={() => setConfirmModal({ isOpen: true, name: acc.name, type: 'accounts', index: idx })} 
                        className="bg-rose-50 px-3.5 rounded-lg sm:rounded-xl text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                      >
                        <Trash2 size={18} className="sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <SaveButton label="Commit Account Values" />
            </div>
          </div>
        )}
        {/* --- EXPENSES TAB --- */}
        {activeTab === 'expenses' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="bg-white p-5 sm:p-12 rounded-[2rem] sm:rounded-[3.5rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-6 sm:mb-12">
                <div className="flex items-center gap-3 sm:gap-6">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 bg-rose-100 rounded-lg sm:rounded-[1.5rem] flex items-center justify-center text-rose-600 shadow-sm">
                    <ReceiptText size={20} className="sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-3xl font-black tracking-tighter leading-none mb-1 sm:mb-2">Daily Expenses</h2>
                    <p className="text-slate-400 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">Outflow tracking</p>
                  </div>
                </div>
                <button 
                  onClick={() => setExpenses([{ title: '', amount: 0 }, ...expenses])}
                  className="bg-rose-600 text-white p-2.5 sm:p-4 rounded-lg sm:rounded-2xl hover:scale-110 transition-all shadow-xl shadow-rose-100 shrink-0"
                >
                  <Plus size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="bg-rose-50/50 p-4 sm:p-6 rounded-2xl border border-rose-100 mb-8 flex items-center justify-between">
                <div>
                  <p className="text-[8px] sm:text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Total Day Expense</p>
                  <p className="text-2xl sm:text-3xl font-black text-rose-600">₹{expenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0).toLocaleString()}</p>
                </div>
                <div className="bg-white p-3 rounded-xl shadow-sm border border-rose-100">
                  <ReceiptText className="text-rose-400" size={24} />
                </div>
              </div>
              
              <div className="space-y-3 sm:space-y-6">
                {expenses.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">No expenses recorded yet</p>
                  </div>
                )}
                {expenses.map((expense, idx) => (
                  <div key={idx} className="flex flex-col gap-2.5 p-3.5 sm:p-6 bg-slate-50/50 rounded-xl sm:rounded-[2.5rem] border border-slate-200/50 hover:bg-white hover:shadow-xl transition-all">
                    <input 
                      placeholder="Expense Title (e.g., Office Rent, Fuel)" 
                      value={expense.title} 
                      onChange={(e) => {
                        const newExp = [...expenses];
                        newExp[idx].title = e.target.value;
                        setExpenses(newExp);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg sm:rounded-xl px-4 py-2 sm:px-5 sm:py-3 outline-none font-bold text-sm sm:text-lg text-slate-800"
                    />
                    <div className="flex gap-2.5">
                       <input 
                        type="number" 
                        placeholder="0.00" 
                        value={expense.amount || ""} 
                        onWheel={(e) => e.target.blur()}
                        inputMode="decimal"
                        onChange={(e) => {
                          const newExp = [...expenses];
                          newExp[idx].amount = parseFloat(e.target.value) || 0;
                          setExpenses(newExp);
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-lg sm:rounded-xl px-4 py-2 sm:px-5 sm:py-3 outline-none font-black text-rose-600 text-base sm:text-xl"
                      />
                      <button 
                        onClick={() => setConfirmModal({ isOpen: true, name: expense.title, type: 'expenses', index: idx })} 
                        className="bg-rose-50 px-3.5 rounded-lg sm:rounded-xl text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                      >
                        <Trash2 size={18} className="sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <SaveButton label="Record All Expenses" />

              {/* Monthly Report Hub for Expenses */}
              <div className="mt-12 pt-12 border-t border-slate-100">
                <div className="bg-slate-900 rounded-[2rem] p-6 sm:p-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:scale-150 transition-transform duration-700">
                    <Download size={120} />
                  </div>
                  <div className="relative z-10 text-center">
                    <h3 className="text-white text-lg sm:text-2xl font-black mb-2">Monthly Expense Ledger</h3>
                    <p className="text-slate-400 text-[10px] sm:text-sm mb-8">Download consolidated expense sheet for the month.</p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                       <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3 w-full sm:w-auto">
                          <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none">Target Month</p>
                          <input 
                            type="month" 
                            defaultValue={format(new Date(), 'yyyy-MM')}
                            id="expense-month-picker"
                            className="bg-transparent text-white font-bold outline-none cursor-pointer [color-scheme:dark] text-sm"
                          />
                       </div>
                       
                       <button 
                        onClick={async () => {
                          setLoading(true);
                          try {
                            const monthVal = document.getElementById('expense-month-picker').value; // yyyy-MM
                            const [year, month] = monthVal.split('-');
                            const startDate = new Date(year, month - 1, 1);
                            const endDate = new Date(year, month, 0);
                            const days = eachDayOfInterval({ start: startDate, end: endDate });
                            
                            const allRecordsSnap = await get(ref(db, `dailyRecords`));
                            const allRecords = allRecordsSnap.val() || {};
                            
                            const monthDisplay = format(new Date(year, month - 1), 'MM-yyyy');
                            
                            const rows = [
                              ["FinTrack Monthly Expense Report"],
                              ["Month", monthDisplay],
                              [""],
                              ["Date", "Expense Title", "Amount"]
                            ];
                            
                            let totalMonthExpense = 0;
                            
                            days.forEach(day => {
                              const dateStr = format(day, 'yyyy-MM-dd');
                              const displayDate = format(day, 'dd-MM-yyyy');
                              const data = allRecords[dateStr] || {};
                              const dayExpenses = data.expenses || [];
                              
                              if (dayExpenses.length > 0) {
                                dayExpenses.forEach(exp => {
                                  rows.push([displayDate, exp.title, exp.amount]);
                                  totalMonthExpense += (parseFloat(exp.amount) || 0);
                                });
                              }
                            });
                            
                            rows.push([""], ["", "MONTHLY TOTAL", totalMonthExpense]);
                            
                            const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", `Expenses_Report_${monthVal}.csv`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          } catch (err) {
                            alert("Error generating month report.");
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 w-full sm:w-auto hover:bg-rose-50 transition-all active:scale-95 shadow-xl text-xs sm:text-sm"
                       >
                         <Download size={18} /> Export CSV
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
