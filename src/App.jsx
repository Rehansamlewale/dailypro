import React, { useState, useEffect } from 'react';
import { db, ref, set, get, onValue } from './services/firebase';
import { format, subDays, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { LayoutDashboard, Wallet, Landmark, Users, Calendar, Save, Plus, Trash2, TrendingUp, ArrowRightCircle, CheckCircle2, AlertCircle, X, RefreshCcw, Scale, FileText, Download, ChevronRight } from 'lucide-react';

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
    } else {
      setAccountDetails(accountDetails.filter((_, i) => i !== confirmModal.index));
    }
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const SaveButton = ({ label }) => (
    <button onClick={handleSave} className="w-full mt-10 bg-indigo-600 text-white py-5 rounded-[2.5rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all active:scale-[0.98]">
      <Save size={24} /> {label || 'Sync with Registry'}
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
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans selection:bg-indigo-100">
      
      {/* --- CUSTOM MODAL --- */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}></div>
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 mx-auto mb-6">
              <AlertCircle size={40} />
            </div>
            <h3 className="text-2xl font-black text-center text-slate-800 tracking-tighter mb-2">Confirm Removal?</h3>
            <p className="text-slate-500 text-center text-sm font-medium mb-10 px-4 leading-relaxed">
              Are you sure you want to delete <span className="font-black text-slate-800 underline decoration-rose-200 underline-offset-4">"{confirmModal.name || 'this item'}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="flex-1 py-4 rounded-2xl font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-colors"
              >
                No, Keep
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-4 rounded-2xl font-black text-white bg-rose-500 shadow-xl shadow-rose-100 uppercase tracking-widest hover:bg-rose-600 transition-all active:scale-95"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-2xl border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="bg-indigo-600 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl text-white shadow-xl shadow-indigo-100">
              <LayoutDashboard size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tighter">FinTrack</h1>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-3 sm:px-5 py-2 rounded-xl sm:rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors max-w-[150px] sm:max-w-none">
            <Calendar size={14} className="text-indigo-500 shrink-0" />
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              className="bg-transparent font-bold text-slate-600 focus:outline-none text-[12px] sm:text-sm cursor-pointer w-full" 
            />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* Navigation Tabs - Mobile Scrollable */}
        <div className="flex gap-2 mb-8 sm:mb-12 bg-slate-200/40 p-1.5 rounded-[2rem] shadow-inner overflow-x-auto no-scrollbar touch-pan-x">
          {[
            { id: 'dashboard', label: 'Summary', icon: LayoutDashboard },
            { id: 'cash', label: 'Cash', icon: Wallet },
            { id: 'bank', label: 'Bank IDs', icon: Landmark },
            { id: 'accounts', label: 'Accounts', icon: Users },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-5 sm:px-6 rounded-[1.7rem] font-black transition-all whitespace-nowrap uppercase tracking-widest text-[10px] ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-lg text-[11px]' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <tab.icon size={16} /> <span className="hidden xs:inline">{tab.label}</span>
              <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* --- SUMMARY VIEW --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* --- TOP SMALL STATS --- */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {[
                { label: 'Total Cash', val: totalCash, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
                { label: 'Bank Total', val: totalBank, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                { label: 'Accounts Sum', val: totalAccount, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
              ].map((stat, i) => (
                <div key={stat.label} className={`px-4 sm:px-6 py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] border ${stat.bg} shadow-sm flex flex-col items-center group hover:scale-105 transition-transform ${i === 2 ? 'col-span-2 md:col-span-1' : ''}`}>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 leading-none">{stat.label}</p>
                  <p className={`text-lg sm:text-xl font-black ${stat.color} leading-none`}>₹{stat.val.toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* --- PRIMARY DISPLAY ROW --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Opening Balance */}
              <div className="bg-white p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Opening Balance</p>
                <div className="flex items-baseline gap-1.5">
                   <span className="text-xl font-bold text-slate-300">₹</span>
                   <span className="text-3xl font-black tracking-tighter text-slate-800 leading-none">{openingBalance.toLocaleString()}</span>
                </div>
                <div className="mt-5 flex items-center gap-1.5 text-[9px] font-black text-emerald-500 bg-emerald-50 w-fit px-3 py-1 rounded-full uppercase tracking-widest leading-none">
                  <CheckCircle2 size={10} /> Live Yest.
                </div>
              </div>
              
              {/* Closing Total */}
              <div className="bg-indigo-600 p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl shadow-indigo-100 text-white relative overflow-hidden group">
                <p className="text-[9px] font-black text-indigo-100 uppercase tracking-[0.2em] mb-2 leading-none opacity-70">Closing Total</p>
                <div className="flex items-baseline gap-1.5">
                   <span className="text-xl font-bold text-indigo-300">₹</span>
                   <span className="text-3xl sm:text-4xl font-black tracking-tighter leading-none">{closingBalance.toLocaleString()}</span>
                </div>
                <div className="mt-5 flex items-center gap-1.5 text-[9px] font-black text-white bg-white/10 w-fit px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm leading-none">
                  <TrendingUp size={10} /> Today
                </div>
              </div>

              {/* Net Income */}
              <div className={`p-6 rounded-[2rem] sm:rounded-[2.5rem] border shadow-xl transition-all duration-500 flex flex-col justify-center relative overflow-hidden group ${closingBalance - openingBalance >= 0 ? 'bg-emerald-500 border-emerald-400 shadow-emerald-100' : 'bg-rose-500 border-rose-400 shadow-rose-100'}`}>
                <div className="relative z-10">
                  <p className="text-[9px] font-black text-white/70 uppercase tracking-[0.2em] mb-2 leading-none">Net Day Income</p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-white tracking-tighter leading-none">
                      {closingBalance - openingBalance >= 0 ? '+' : ''} ₹{(closingBalance - openingBalance).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-5">
                    <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 w-fit">
                        <p className="text-[9px] font-black text-white uppercase tracking-widest leading-none">
                          {closingBalance - openingBalance >= 0 ? '💰 Surplus' : '📉 Deficit'}
                        </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Financial Report Hub */}
            <div className="bg-slate-900 px-6 sm:px-10 py-10 sm:py-12 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden relative group">
               <div className="absolute top-0 left-0 w-full h-full bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors"></div>
               <div className="relative z-10">
                 <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 border border-white/10">
                    <FileText size={28} className="sm:w-8 sm:h-8" />
                 </div>
                 <h3 className="text-white text-xl sm:text-2xl font-black tracking-tight mb-2 text-center">Multi-Day Report Discovery</h3>
                 <p className="text-slate-400 text-[12px] sm:text-sm max-w-sm mx-auto mb-8 sm:mb-10 text-center">Consolidated financial performance sheet.</p>
                 
                 {/* Range Selector */}
                 <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-8 sm:mb-10">
                    <div className="bg-white/5 border border-white/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                       <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">From</p>
                       <input 
                        type="date" 
                        value={reportRange.start}
                        onChange={(e) => setReportRange({ ...reportRange, start: e.target.value })}
                        className="bg-transparent text-white font-bold outline-none cursor-pointer [color-scheme:dark] text-sm flex-1 sm:flex-none"
                       />
                    </div>
                    <div className="text-white/20 hidden sm:block">
                       <ChevronRight size={20} />
                    </div>
                    <div className="bg-white/5 border border-white/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                       <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">To</p>
                       <input 
                        type="date" 
                        value={reportRange.end}
                        onChange={(e) => setReportRange({ ...reportRange, end: e.target.value })}
                        className="bg-transparent text-white font-bold outline-none cursor-pointer [color-scheme:dark] text-sm flex-1 sm:flex-none"
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
                      const rows = [["FinTrack Consolidated Financial Report"], ["Range Selection", `${reportRange.start} to ${reportRange.end}`], [""], ["Date", "Opening Balance", "Total Cash", "Bank Total", "Account Total", "Closing Balance", "Profit/Loss"]];
                      range.forEach(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const data = allRecords[dateStr] || {};
                        const tc = Object.entries(data.cashDetails || {}).reduce((a, [d, c]) => a + (d * c), 0);
                        const tb = Object.values(data.bankDetails || {}).reduce((a, v) => a + (parseFloat(v) || 0), 0);
                        const ta = Object.values(data.accountDetails || {}).reduce((a, v) => a + (parseFloat(v) || 0), 0);
                        const cb = data.closingBalance || (tc + tb + ta);
                        const ob = data.openingBalance || 0;
                        rows.push([dateStr, ob, tc, tb, ta, cb, cb - ob]);
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
                  className="w-full sm:w-auto bg-white text-slate-900 px-8 sm:px-12 py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 mx-auto hover:bg-indigo-50 transition-all shadow-2xl active:scale-95 text-xs sm:text-base"
                 >
                   <Download size={20} className="sm:w-6 sm:h-6" /> Export Sheet
                 </button>
               </div>
            </div>
          </div>
        )}

        {/* --- CASH TAB --- */}
        {activeTab === 'cash' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="bg-white p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8 sm:space-y-12">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center text-indigo-600 shadow-sm">
                  <Wallet size={24} className="sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tighter leading-none mb-1 sm:mb-2">Liquid Cash</h2>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Entry of physical notes</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
                {[500, 200, 100, 50, 20, 10].map(den => (
                  <div key={den} className="flex flex-col gap-3 sm:gap-4 p-5 sm:p-8 bg-slate-50/50 rounded-2xl sm:rounded-[2.5rem] border border-slate-200/50 hover:bg-white hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-center px-1">
                      <span className="bg-indigo-600 text-white text-[9px] font-black px-3 py-1 rounded-lg tracking-widest uppercase">₹{den}</span>
                      <span className={`text-sm sm:text-lg font-black transition-all ${cashDetails[den] ? 'text-indigo-600' : 'text-slate-200'}`}>
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
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 sm:p-5 outline-none focus:ring-8 focus:ring-indigo-500/5 font-black text-xl sm:text-2xl text-slate-700"
                      />
                  </div>
                ))}
              </div>
              
              <div className="p-6 sm:p-10 bg-indigo-600 rounded-[2rem] sm:rounded-[3rem] shadow-2xl shadow-indigo-100 flex flex-col sm:flex-row items-center justify-between text-white gap-4">
                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest opacity-60">Calculated Cash Total</p>
                <p className="text-3xl sm:text-5xl font-black tracking-tighter">₹{totalCash.toLocaleString()}</p>
              </div>
              
              <SaveButton label="Record Cash Entry" />
            </div>
          </div>
        )}

        {/* --- BANK TAB --- */}
        {activeTab === 'bank' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="bg-white p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-8 sm:mb-12">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center text-blue-600 shadow-sm">
                    <Landmark size={24} className="sm:w-8 sm:h-8" />
                  </div>
                   <div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tighter leading-none mb-1 sm:mb-2">Bank Registry</h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Across all IDs</p>
                  </div>
                </div>
                <button 
                  onClick={() => setBankDetails([...bankDetails, { name: '', amount: 0 }])}
                  className="bg-blue-600 text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl hover:scale-110 transition-all shadow-xl shadow-blue-100 shrink-0"
                >
                  <Plus size={24} />
                </button>
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                {bankDetails.map((bank, idx) => (
                  <div key={idx} className="flex flex-col gap-4 p-4 sm:p-6 bg-slate-50/50 rounded-2xl sm:rounded-[2.5rem] border border-slate-200/50 hover:bg-white hover:shadow-xl transition-all">
                    <input 
                      placeholder="Bank Identifier" 
                      value={bank.name} 
                      onChange={(e) => {
                        const newBanks = [...bankDetails];
                        newBanks[idx].name = e.target.value;
                        setBankDetails(newBanks);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 outline-none font-bold text-base sm:text-lg text-slate-800"
                    />
                    <div className="flex gap-3">
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
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none font-black text-blue-600 text-lg sm:text-xl"
                      />
                      <button 
                        onClick={() => setConfirmModal({ isOpen: true, name: bank.name, type: 'bank', index: idx })} 
                        className="bg-rose-50 px-4 rounded-xl text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                      >
                        <Trash2 size={20} />
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
            <div className="bg-white p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-8 sm:mb-12">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center text-emerald-600 shadow-sm">
                    <Users size={24} className="sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tighter leading-none mb-1 sm:mb-2">Ledgers</h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Client balances</p>
                  </div>
                </div>
                <button 
                  onClick={() => setAccountDetails([...accountDetails, { name: '', amount: 0 }])}
                  className="bg-emerald-600 text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl hover:scale-110 transition-all shadow-xl shadow-emerald-100 shrink-0"
                >
                  <Plus size={24} />
                </button>
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                {accountDetails.map((acc, idx) => (
                  <div key={idx} className="flex flex-col gap-4 p-4 sm:p-6 bg-slate-50/50 rounded-2xl sm:rounded-[2.5rem] border border-slate-200/50 hover:bg-white hover:shadow-xl transition-all">
                    <input 
                      placeholder="Account Entity" 
                      value={acc.name} 
                      onChange={(e) => {
                        const newAccs = [...accountDetails];
                        newAccs[idx].name = e.target.value;
                        setAccountDetails(newAccs);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 outline-none font-bold text-base sm:text-lg text-slate-800"
                    />
                    <div className="flex gap-3">
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
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none font-black text-emerald-600 text-lg sm:text-xl text-center"
                      />
                      <button 
                        onClick={() => setConfirmModal({ isOpen: true, name: acc.name, type: 'accounts', index: idx })} 
                        className="bg-rose-50 px-4 rounded-xl text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <SaveButton label="Commit Account Values" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
