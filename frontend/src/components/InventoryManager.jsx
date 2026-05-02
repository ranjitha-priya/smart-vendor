import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, Plus, Trash2, Edit2, AlertTriangle, CheckCircle, Package, Zap, ArrowRight, Activity, ShieldCheck, Box } from 'lucide-react';

const InventoryManager = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', description: '', critical_threshold: 50 });
  const [editingId, setEditingId] = useState(null);
  const [isCommitting, setIsCommitting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/drugs`);
      
      // Smart Grouping Logic: Merge identical names to prevent duplicate UI rows
      const groupedData = res.data.reduce((acc, current) => {
        const name = current.name.trim();
        if (!acc[name]) {
          acc[name] = { ...current, ids: [current.id] };
        } else {
          // Sum the stock and take the safest threshold
          acc[name].current_stock += current.current_stock;
          acc[name].critical_threshold = Math.max(acc[name].critical_threshold, current.critical_threshold);
          acc[name].ids.push(current.id);
          // Keep the description if the original was empty
          if (!acc[name].description && current.description) acc[name].description = current.description;
        }
        return acc;
      }, {});

      setItems(Object.values(groupedData));
      setErrorMsg(null);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || "Neural link to Asset Database failed.");
      if (items.length === 0) {
          setItems([
              { id: 991, name: "Amoxicillin 500mg", description: "Standard antibiotic batch protocol", critical_threshold: 100 },
              { id: 992, name: "Ibuprofen 200mg", description: "Non-steroidal anti-inflammatory", critical_threshold: 50 },
          ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    setIsCommitting(true);
    
    try {
      if (editingId) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/drugs/${editingId}`, formData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/drugs`, formData);
      }
      setFormData({ name: '', description: '', critical_threshold: 50 });
      setEditingId(null);
      fetchItems();
    } catch (err) {
      setErrorMsg("Transaction aborted: Protocol mismatch or database timeout.");
    } finally {
      setIsCommitting(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({ name: item.name, description: item.description, critical_threshold: item.critical_threshold });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Authorize permanent deletion of this asset record?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/drugs/${id}`);
      fetchItems();
    } catch (err) {
      setErrorMsg("Failed to purge asset record.");
    }
  };

  const handleExportCSV = () => {
    if (items.length === 0) return;
    const headers = ["ID", "Medication Name", "Description", "Current Stock", "Safety Threshold"];
    const csvRows = [
      headers.join(","),
      ...items.map(item => [
        item.id,
        `"${item.name}"`,
        `"${item.description}"`,
        item.current_stock,
        item.critical_threshold
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'nexusmed_inventory_ledger.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="p-8 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0 border-b border-slate-100 pb-8">
        <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-800 flex items-center">
                <Box className="w-10 h-10 mr-4 text-indigo-500 fill-indigo-500/10" /> 
                Asset Repository
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Manage pharmaceutical identities and critical stock safety protocols.</p>
        </div>
        <div className="flex space-x-3">
             <div className="px-4 py-2 bg-white/60 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center">
                 <Database className="w-3 h-3 mr-2 text-indigo-600" />
                 MySQL Cluster Active
             </div>
             <div className="px-4 py-2 bg-emerald-50 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase text-emerald-600 tracking-widest flex items-center">
                 <ShieldCheck className="w-3 h-3 mr-2" />
                 Protocol 4.0.0
             </div>
        </div>
      </header>

      {errorMsg && (
        <div className="mb-8 p-6 rounded-2xl bg-rose-50 border border-rose-500/20 flex items-start animate-in zoom-in-95 duration-300">
            <AlertTriangle className="w-6 h-6 text-rose-600 mr-4 mt-0.5" />
            <div>
                <h3 className="text-rose-600 font-black uppercase tracking-widest text-xs mb-1">Warning: Connection Disruption</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{errorMsg}</p>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        
        {/* Form Panel: Transaction Entry */}
        <div className="col-span-1">
            <div className="sticky top-12 p-8 rounded-[2rem] bg-indigo-600/5 border border-indigo-200 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                    <Activity className="w-32 h-32 text-indigo-600" />
                </div>
                
                <h3 className="text-xl font-black mb-8 text-slate-800 flex items-center relative z-10">
                  {editingId ? <Edit2 className="w-5 h-5 mr-3 text-indigo-600" /> : <Plus className="w-5 h-5 mr-3 text-emerald-600" />}
                  {editingId ? "Update Asset" : "Commit New Asset"}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Medication Identity</label>
                        <input 
                          type="text" 
                          required
                          value={formData.name} 
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          className="w-full bg-[#050505] border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-mono text-sm"
                          placeholder="e.g. Paracetamol 500mg"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Protocol Description</label>
                        <textarea 
                          required
                          value={formData.description} 
                          onChange={e => setFormData({...formData, description: e.target.value})}
                          className="w-full bg-[#050505] border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-mono text-sm resize-none"
                          placeholder="Summarize medication purpose..."
                          rows="4"
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Critical Threshold (Units)</label>
                        <input 
                          type="number" 
                          required
                          value={formData.critical_threshold} 
                          onChange={e => setFormData({...formData, critical_threshold: parseInt(e.target.value)})}
                          className="w-full bg-[#050505] border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-mono text-sm"
                        />
                    </div>
                    
                    <button type="submit" disabled={isCommitting} className="w-full py-5 rounded-[1.5rem] bg-indigo-500 hover:bg-indigo-600 shadow-3xl shadow-indigo-500/30 text-slate-800 font-black transition-all flex items-center justify-center text-sm uppercase tracking-widest active:scale-95">
                       {isCommitting ? (
                           <Activity className="w-5 h-5 animate-pulse" />
                       ) : (
                           <>
                           {editingId ? <CheckCircle className="w-5 h-5 mr-3" /> : <ShieldCheck className="w-5 h-5 mr-3" />}
                           {editingId ? "Apply Update" : "Authorize Commit"}
                           </>
                       )}
                    </button>
                    {editingId && (
                        <button onClick={() => {setEditingId(null); setFormData({name: '', description: '', critical_threshold: 50})}} className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Abort Edit</button>
                    )}
                </form>
            </div>
        </div>

        {/* Data Table Panel: Ledger View */}
        <div className="col-span-1 lg:col-span-3">
            <div className="p-8 rounded-[2.5rem] bg-white/60 border border-slate-200 backdrop-blur-md relative overflow-hidden group">
                <div className="flex items-center justify-between mb-10">
                    <h3 className="text-xl font-black flex items-center text-slate-800">
                      <Zap className="w-6 h-6 mr-3 text-amber-500 fill-amber-500/10" />
                      Live Centralized Ledger
                    </h3>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Real-time DB Synchronization</div>
                </div>
                
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-indigo-600 opacity-50 space-y-4">
                        <Activity className="w-12 h-12 animate-spin-slow" />
                        <span className="text-[10px] font-black tracking-widest uppercase">Deciphering Asset Data...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                                    <th className="py-5 px-6">Medication Name</th>
                                    <th className="py-5 px-6 hidden md:table-cell">Asset Bio</th>
                                    <th className="py-5 px-6">Current Stock Volume</th>
                                    <th className="py-5 px-6">Safety Threshold</th>
                                    <th className="py-5 px-6 text-right">Administrative Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="py-16 text-center text-slate-400 italic font-medium">No assets registered in the current node.</td>
                                    </tr>
                                ) : items.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-100 transition-all group">
                                        <td className="py-6 px-6">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center mr-4 group-hover:bg-indigo-500/10 transition-colors">
                                                    <Package className="w-5 h-5 text-indigo-600 opacity-50 group-hover:opacity-100 transition-all" />
                                                </div>
                                                <div>
                                                    <span className="text-slate-800 font-black block tracking-tight">{item.name}</span>
                                                    <span className="text-[10px] font-mono text-slate-400">NEX-ID-{item.id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 px-6 text-slate-500 text-sm italic font-medium max-w-xs truncate hidden md:table-cell">
                                            "{item.description}"
                                        </td>
                                        <td className="py-6 px-6">
                                            <div className="flex flex-col">
                                                <span className={`text-lg font-mono font-black ${item.current_stock < item.critical_threshold ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {item.current_stock.toLocaleString()}
                                                </span>
                                                <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Units In Stock</span>
                                            </div>
                                        </td>
                                        <td className="py-6 px-6">
                                            <span className="px-4 py-2 bg-indigo-50 border border-indigo-500/10 rounded-xl text-xs text-indigo-600 font-bold font-mono group-hover:bg-indigo-500/10 transition-all">
                                                {item.critical_threshold.toLocaleString()} UNITS
                                            </span>
                                        </td>
                                        <td className="py-6 px-6 text-right">
                                            <div className="flex justify-end space-x-3">
                                                <button onClick={() => handleEdit(item)} className="p-3 bg-white/60 text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-slate-100 rounded-xl transition-all active:scale-95">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all active:scale-95">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            {/* Context Footer (New) */}
            <div className="mt-8 flex items-center justify-between p-6 rounded-2xl bg-indigo-50 border border-slate-100">
                <div className="flex items-center text-xs text-indigo-400/70 font-medium">
                    <Activity className="w-4 h-4 mr-3" />
                    Asset Repository provides centralized CRUD authority over the global pharmaceutical node.
                </div>
                <button 
                  onClick={handleExportCSV}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors flex items-center"
                >
                    Export Ledger Data <ArrowRight className="w-3 h-3 ml-2" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryManager;
