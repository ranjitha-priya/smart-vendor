import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    PackageOpen, Activity, Plus, Database, LogOut, DollarSign,
    Clock, CheckCircle, AlertTriangle, ArrowRight, Package,
    ShieldCheck, Zap, History
} from 'lucide-react';

const SupplierPortal = ({ user, onLogout }) => {
    const [drugName, setDrugName] = useState('');
    const [quantity, setQuantity] = useState(100);
    const [unitPrice, setUnitPrice] = useState(12.50);
    const [daysToDeliver, setDaysToDeliver] = useState(3);
    const [batchNumber, setBatchNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');

    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    // Fetch this supplier's shipment history
    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/shipment-logs`);
            // Filter only this supplier's logs
            const myLogs = res.data.filter(log => log.supplier_name === user.name);
            setHistory(myLogs);
        } catch (e) {
            setHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => { fetchHistory(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/supplier/add-inventory`, {
                supplier_id: user.id,
                drug_name: drugName,
                quantity: parseInt(quantity),
                unit_price: parseFloat(unitPrice),
                lead_time_days: parseInt(daysToDeliver),
                batch_number: batchNumber || `BATCH-${Math.floor(Math.random() * 90000) + 10000}`,
                expiry_date: expiryDate
            });
            setSuccessMsg(`${quantity} units of "${drugName}" committed to the NexusMed pipeline.`);
            setDrugName('');
            setQuantity(100);
            setUnitPrice(12.50);
            setBatchNumber('');
            setExpiryDate('');
            fetchHistory(); // Refresh history after submit
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Failed to push inventory. Check that the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const totalPrice = (parseFloat(quantity) * parseFloat(unitPrice) || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2, maximumFractionDigits: 2
    });

    const inputClass = "w-full bg-slate-100/50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 placeholder-gray-600 focus:outline-none focus:border-emerald-500/70 focus:bg-white/80 transition-all font-mono text-sm";
    const labelClass = "block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest";

    return (
        <div className="flex shrink-0 min-h-screen bg-[#0a0a0a] text-slate-800 font-sans">

            {/* Sidebar */}
            <aside className="w-20 lg:w-72 border-r border-slate-100 bg-white/80 backdrop-blur-3xl shadow-xl flex flex-col items-center lg:items-start py-10 shrink-0">
                <div className="px-8 w-full flex items-center justify-center lg:justify-start mb-14">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl shadow-emerald-500/30 rotate-3 hover:rotate-0 transition-transform">
                        <Activity className="w-7 h-7 text-slate-800" />
                    </div>
                    <div className="ml-4 hidden lg:block">
                        <span className="font-black text-2xl block tracking-tighter text-slate-800 leading-none">NexusMed</span>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 block mt-1">Vendor Node</span>
                    </div>
                </div>

                <nav className="w-full px-4 space-y-2 flex-1">
                    <div className="w-full flex items-center p-4 rounded-xl bg-white/60 text-emerald-600 border-l-2 border-emerald-500">
                        <PackageOpen className="w-5 h-5 shrink-0 mx-auto lg:mx-0" />
                        <span className="ml-4 hidden lg:block text-xs uppercase tracking-widest font-black">Shipment Portal</span>
                    </div>
                </nav>

                {/* Vendor Info */}
                <div className="w-full px-4 mb-4 hidden lg:block">
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-500/10">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Logged In As</p>
                        <p className="text-sm font-black text-slate-800 truncate">{user.name}</p>
                        <p className="text-[10px] text-emerald-500 font-mono mt-1">ID: VND-{user.id}</p>
                    </div>
                </div>

                <div className="px-4 w-full mt-2">
                    <button onClick={onLogout} className="w-full flex items-center p-4 rounded-2xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all group">
                        <LogOut className="w-5 h-5 shrink-0 mx-auto lg:mx-0 group-hover:rotate-12 transition-transform" />
                        <span className="ml-4 hidden lg:block text-[10px] font-black uppercase tracking-widest">Disconnect</span>
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/10 via-[#0a0a0a] to-white p-8 lg:p-12 animate-in fade-in duration-500">

                {/* Header */}
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between border-b border-slate-100 pb-8 gap-4">
                    <div>
                        <p className="text-emerald-500 font-mono text-[10px] font-black uppercase tracking-[0.3em] mb-2">Access Granted ✓ Vendor Endpoint</p>
                        <h1 className="text-4xl font-black tracking-tighter text-slate-800">
                            Welcome, <span className="text-emerald-600">{user.name}</span>
                        </h1>
                        <p className="text-slate-400 mt-2 font-medium italic">Push pharmaceutical batches directly into the NexusMed intelligence network.</p>
                    </div>
                    <div className="px-5 py-3 bg-emerald-50 border border-emerald-500/20 rounded-2xl text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center">
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Verified Vendor Node
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                    {/* === FORM === */}
                    <div className="lg:col-span-3">
                        <div className="p-8 lg:p-10 rounded-[2.5rem] bg-white/60 border border-slate-200 backdrop-blur-3xl shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>

                            <h2 className="text-xl font-black text-slate-800 mb-10 flex items-center relative z-10 tracking-tight uppercase">
                                <Database className="w-6 h-6 mr-3 text-emerald-600 opacity-60" />
                                Integrate New Shipment Batch
                            </h2>

                            {errorMsg && (
                                <div className="mb-8 p-5 rounded-2xl bg-rose-50 border border-rose-500/20 text-rose-600 text-sm flex items-start animate-in slide-in-from-top-2 duration-300">
                                    <AlertTriangle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                                    {errorMsg}
                                </div>
                            )}
                            {successMsg && (
                                <div className="mb-8 p-5 rounded-2xl bg-emerald-50 border border-emerald-500/20 text-emerald-600 text-sm flex items-start animate-in slide-in-from-top-2 duration-300">
                                    <CheckCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-black mb-1">Committed Successfully</p>
                                        <p className="opacity-70">{successMsg}</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                <div>
                                    <label className={labelClass}>Medication Name</label>
                                    <input
                                        type="text" required
                                        value={drugName}
                                        onChange={e => setDrugName(e.target.value)}
                                        className={inputClass}
                                        placeholder="e.g. Paracetamol 500mg"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className={labelClass}>
                                            <PackageOpen className="w-3 h-3 inline mr-1" /> Unit Volume
                                        </label>
                                        <input
                                            type="number" required min="1"
                                            value={quantity}
                                            onChange={e => setQuantity(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            <DollarSign className="w-3 h-3 inline mr-1" /> Unit Price ($)
                                        </label>
                                        <input
                                            type="number" step="0.01" required min="0.01"
                                            value={unitPrice}
                                            onChange={e => setUnitPrice(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className={labelClass}>
                                            <Clock className="w-3 h-3 inline mr-1" /> Lead Time (Days)
                                        </label>
                                        <input
                                            type="number" required min="1"
                                            value={daysToDeliver}
                                            onChange={e => setDaysToDeliver(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Batch # Identifier</label>
                                        <input
                                            type="text"
                                            value={batchNumber}
                                            onChange={e => setBatchNumber(e.target.value)}
                                            className={inputClass}
                                            placeholder="Auto-generated if empty"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        <Activity className="w-3 h-3 inline mr-1" /> Pharmaceutical Expiry Date
                                    </label>
                                    <input
                                        type="date" required
                                        value={expiryDate}
                                        onChange={e => setExpiryDate(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>

                                {/* Live Shipment Total */}
                                <div className="p-5 bg-emerald-50 border border-emerald-500/20 rounded-2xl flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated Shipment Total</p>
                                        <p className="text-xs text-slate-500 mt-1">{quantity} units × ${parseFloat(unitPrice || 0).toFixed(2)}/unit</p>
                                    </div>
                                    <span className="text-emerald-600 font-black text-2xl font-mono">${totalPrice}</span>
                                </div>

                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full py-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 shadow-2xl shadow-emerald-500/20 text-[#050505] font-black transition-all flex items-center justify-center text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading
                                        ? <><Activity className="w-5 h-5 mr-3 animate-spin" /> Committing to Pipeline...</>
                                        : <><Plus className="w-5 h-5 mr-3" /> Commit to ML Pipeline <ArrowRight className="w-4 h-4 ml-3 opacity-60" /></>
                                    }
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* === HISTORY PANEL === */}
                    <div className="lg:col-span-2 flex flex-col gap-6">

                        {/* Info Card */}
                        <div className="p-6 rounded-[2rem] bg-emerald-50 border border-emerald-500/10 relative overflow-hidden">
                            <Zap className="absolute bottom-0 right-0 w-24 h-24 text-emerald-500/5 translate-x-6 translate-y-6" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">How it works</p>
                            <div className="space-y-4">
                                {[
                                    { step: '01', text: 'Submit your drug batch details using this form.' },
                                    { step: '02', text: 'The system logs it into inventory and creates an order record.' },
                                    { step: '03', text: 'The ML engine recalculates your reliability score automatically.' },
                                    { step: '04', text: 'The Admin\'s dashboard updates in real-time.' },
                                ].map(s => (
                                    <div key={s.step} className="flex items-start">
                                        <span className="text-[10px] font-black text-emerald-500 mr-3 mt-0.5 shrink-0">{s.step}</span>
                                        <p className="text-xs text-slate-500 leading-relaxed">{s.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Shipment History */}
                        <div className="flex-1 p-6 rounded-[2rem] bg-white/60 border border-slate-200 backdrop-blur-md">
                            <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center uppercase tracking-widest">
                                <History className="w-4 h-4 mr-2 text-emerald-600 opacity-60" />
                                My Shipment History
                            </h3>

                            {loadingHistory ? (
                                <div className="flex items-center justify-center py-12 text-emerald-400/40 flex-col space-y-3">
                                    <Activity className="w-8 h-8 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Decrypting logs...</span>
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-12 flex flex-col items-center">
                                    <Package className="w-12 h-12 text-gray-700 mb-4" />
                                    <p className="text-slate-400 text-sm font-bold">No shipments submitted yet.</p>
                                    <p className="text-gray-700 text-xs mt-1 italic">Your submissions will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                                    {history.map((log, idx) => (
                                        <div key={log.id} className="p-4 bg-slate-100/50 border border-slate-100 rounded-2xl hover:border-emerald-500/20 transition-all group">
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="text-slate-800 font-bold text-sm group-hover:text-emerald-400 transition-colors">{log.drug_name}</span>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                                                    log.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' :
                                                    log.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                                    'bg-rose-100 text-rose-600'
                                                }`}>{log.status}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                                <span>{log.quantity?.toLocaleString()} units × ${parseFloat(log.unit_price || 0).toFixed(2)}</span>
                                                <span>${((log.quantity || 0) * (log.unit_price || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                            </div>
                                            <p className="text-[9px] text-gray-700 mt-2 font-mono">{new Date(log.order_date).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SupplierPortal;
