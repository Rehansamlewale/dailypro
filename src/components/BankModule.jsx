import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Badge } from './UI';
import { Landmark, Plus, Trash2, Save, Settings2, CheckCircle2, UserPlus } from 'lucide-react';

export const BankModule = ({ initialData, onSave }) => {
  const [banks, setBanks] = useState([]);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setBanks(Object.entries(initialData).map(([name, amount]) => ({ name, amount })));
    }
  }, [initialData]);

  const addBank = () => setBanks([...banks, { name: '', amount: 0 }]);
  
  const removeBank = (index) => {
    const newBanks = [...banks];
    newBanks.splice(index, 1);
    setBanks(newBanks);
  };

  const updateBank = (index, field, value) => {
    const newBanks = [...banks];
    newBanks[index][field] = field === 'amount' ? (parseFloat(value) || 0) : value;
    setBanks(newBanks);
  };

  const total = banks.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const handleSave = async () => {
    setLoading(true);
    const data = banks.reduce((acc, curr) => {
      if (curr.name) acc[curr.name] = curr.amount;
      return acc;
    }, {});
    await onSave(data);
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card 
        title={isSetupMode ? "Setup Bank Identities" : "Daily Bank Balances"}
        className="relative shadow-2xl"
      >
        <div className="absolute top-8 right-8">
          <Button 
            variant={isSetupMode ? "success" : "secondary"} 
            onClick={() => setIsSetupMode(!isSetupMode)}
            className={`px-6 py-2.5 text-xs ${isSetupMode ? 'scale-105 shadow-emerald-200' : ''}`}
          >
            {isSetupMode ? <><CheckCircle2 size={16} /> Save & Exit Setup</> : <><Settings2 size={16} /> Manage Accounts</>}
          </Button>
        </div>

        {isSetupMode && (
          <div className="mb-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <UserPlus size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">Setup Mode Active</p>
              <p className="text-[10px] text-indigo-400 font-bold">Add or rename your bank accounts here. Amounts are hidden during setup.</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {banks.map((bank, index) => (
            <div key={index} className={`group flex flex-col md:flex-row gap-6 items-end md:items-center p-6 rounded-[2rem] border transition-all duration-300 ${isSetupMode ? 'bg-slate-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
              <div className="flex-grow w-full">
                {isSetupMode ? (
                  <Input
                    label="Bank ID / Account Name"
                    placeholder="e.g. HDFC Primary"
                    value={bank.name}
                    onChange={(e) => updateBank(index, 'name', e.target.value)}
                  />
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Account Identity</span>
                    <div className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 text-lg group-hover:bg-white group-hover:shadow-inner transition-all">
                      {bank.name || "Untitled Bank"}
                    </div>
                  </div>
                )}
              </div>

              {!isSetupMode && (
                <div className="w-full md:w-72">
                  <Input
                    label="Daily Balance"
                    type="number"
                    placeholder="Enter today's amount"
                    icon={Landmark}
                    value={bank.amount || ''}
                    onChange={(e) => updateBank(index, 'amount', e.target.value)}
                  />
                </div>
              )}

              {isSetupMode && (
                <Button variant="danger" onClick={() => removeBank(index)} className="p-4 rounded-2xl hover:rotate-6 transition-transform">
                  <Trash2 size={20} />
                </Button>
              )}
            </div>
          ))}
          
          {banks.length === 0 && (
            <div className="text-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[3rem]">
              <Landmark size={64} className="mx-auto mb-6 text-slate-200" />
              <p className="font-bold text-slate-400 uppercase tracking-[0.2em] text-xs">No Bank Records Found</p>
              <p className="text-xs text-slate-400 mt-2">Switch to "Manage Accounts" to define your bank list.</p>
            </div>
          )}

          {isSetupMode && (
            <Button variant="outline" onClick={addBank} className="w-full border-2 border-dashed border-indigo-200 py-8 rounded-[2rem] hover:bg-indigo-50/30 group">
              <Plus size={24} className="text-indigo-400 group-hover:scale-125 transition-transform" /> 
              <span className="text-indigo-600 font-black uppercase tracking-widest text-xs">Register New Bank Account</span>
            </Button>
          )}
        </div>
      </Card>

      {!isSetupMode && (
        <Card className="bg-indigo-600 border-none shadow-2xl shadow-indigo-200" noPadding>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-10">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl">
                <Landmark size={40} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge color="slate">Sync Ready</Badge>
                  <p className="text-indigo-100 text-[11px] font-black uppercase tracking-[0.2em]">Total Bank Ledger</p>
                </div>
                <p className="text-5xl font-black text-white tracking-tighter leading-none">₹{total.toLocaleString()}</p>
              </div>
            </div>
            
            <Button 
              variant="secondary" 
              onClick={handleSave} 
              disabled={loading}
              className="w-full md:w-auto px-12 py-5 bg-white text-indigo-600 hover:bg-slate-50 shadow-2xl text-lg rounded-[1.5rem]"
            >
              {loading ? 'Data Syncing...' : <><Save size={24} /> Post Daily Balances</>}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
