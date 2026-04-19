import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Badge } from './UI';
import { Coins, Save, CreditCard } from 'lucide-react';

const DENOMINATIONS = [500, 200, 100, 50, 20, 10];

export const CashModule = ({ initialData, onSave }) => {
  const [counts, setCounts] = useState(initialData || {});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) setCounts(initialData);
  }, [initialData]);

  const handleChange = (denom, value) => {
    setCounts(prev => ({ ...prev, [denom]: parseInt(value) || 0 }));
  };

  const total = DENOMINATIONS.reduce((acc, d) => acc + (d * (counts[d] || 0)), 0);

  const handleSave = async () => {
    setLoading(true);
    await onSave(counts);
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card title="Cash Denominations">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DENOMINATIONS.map(denom => (
            <div key={denom} className="group flex flex-col gap-2 p-5 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-indigo-200 transition-all hover:bg-white hover:shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black">
                    ₹{denom}
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes</span>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Subtotal</p>
                   <p className="text-sm font-bold text-indigo-600">₹{(denom * (counts[denom] || 0)).toLocaleString()}</p>
                </div>
              </div>
              
              <Input
                type="number"
                placeholder="Enter count"
                value={counts[denom] || ''}
                onChange={(e) => handleChange(denom, e.target.value)}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-indigo-600 border-none shadow-xl shadow-indigo-100" noPadding>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-inner">
              <Coins size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge color="indigo">Live Calculation</Badge>
                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest">Total Cash Value</p>
              </div>
              <p className="text-4xl font-black text-white tracking-tighter leading-none">₹{total.toLocaleString()}</p>
            </div>
          </div>
          
          <Button 
            variant="secondary" 
            onClick={handleSave} 
            disabled={loading}
            className="w-full md:w-auto px-10 py-4 bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl"
          >
            {loading ? 'Processing...' : <><Save size={20} /> Confirm & Save Cash</>}
          </Button>
        </div>
      </Card>
    </div>
  );
};
