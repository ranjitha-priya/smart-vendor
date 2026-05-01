import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, TrendingUp, AlertTriangle, ArrowRight, Zap, Calculator, BarChart3, Globe, List, Package, Activity, ChevronDown, Search, Shield, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const SupplierIntelligence = ({ initialDrugId }) => {
    const [suppliers, setSuppliers] = useState([]);
    const [trends, setTrends] = useState([]);
    const [logs, setLogs] = useState([]);
    const [drugs, setDrugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recommendation, setRecommendation] = useState(null);
    const [recLoading, setRecLoading] = useState(false);
    const [recError, setRecError] = useState(null);
    const [expirationData, setExpirationData] = useState({ horizon: [], exposure_risk: 0, top_risk_medication: null, total_stock: 0 });
    const [priority, setPriority] = useState('reliability');
    const [drugId, setDrugId] = useState(initialDrugId || '');
    const [drugSelectorOpen, setDrugSelectorOpen] = useState(false);

    const fetchData = async () => {
        try {
            try {
                const drugsRes = await axios.get('http://localhost:5000/api/drugs');
                setDrugs(drugsRes.data);
                if (initialDrugId) {
                    setDrugId(initialDrugId);
                } else if (drugsRes.data.length > 0 && !drugId) {
                    setDrugId(drugsRes.data[0].id);
                }
            } catch (e) {
                console.error('Failed to fetch drugs', e);
                setDrugs([]);
            }

            // 2. Fetch approved supplier scores
            try {
                const res = await axios.get('http://localhost:5000/api/suppliers/approved');
                if (res.data.length > 0) {
                    const scoredSuppliers = await Promise.all(res.data.map(async (s) => {
                        try {
                            const riskRes = await axios.post('http://localhost:8000/predict-risk', {
                                supplier_id: s.id,
                                historical_delays: [Math.floor(Math.random() * 5), Math.floor(Math.random() * 5), Math.floor(Math.random() * 5)],
                                volatility_index: Math.random()
                            });
                            return { ...s, intelligence: riskRes.data };
                        } catch (e) {
                            // ML offline — compute from real DB reliability_score
                            const score = s.reliability_score || 0;
                            return { ...s, intelligence: {
                                risk_level: score >= 80 ? 'Low' : score >= 60 ? 'Medium' : score > 0 ? 'High' : 'Ungraded',
                                disruption_probability: score > 0 ? Math.round(100 - score) : null,
                                trend: score >= 80 ? 'Stable' : score >= 60 ? 'Increasing' : 'Volatile'
                            }};
                        }
                    }));
                    setSuppliers(scoredSuppliers);
                } else {
                    setSuppliers([]); 
                }
            } catch (e) {
                setSuppliers([]); 
            }

            // 3. Fetch real vendor metrics
            try {
                const metricsRes = await axios.get('http://localhost:5000/api/analytics/supplier-metrics');
                setTrends(metricsRes.data || []);
            } catch (e) {
                setTrends([]);
            }

            // 4. Fetch real shipment logs
            try {
                const logsRes = await axios.get('http://localhost:5000/api/admin/shipment-logs');
                setLogs(logsRes.data || []);
            } catch (e) {
                setLogs([]);
            }

            // 5. Fetch real expiration horizon data
            try {
                const expRes = await axios.get('http://localhost:5000/api/analytics/expiration-horizon');
                setExpirationData(expRes.data);
            } catch (e) {
                console.error("Failed to fetch expiration data", e);
            }

        } catch (err) {
            console.error("Critical AI Intel failure", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [initialDrugId]);

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, {
                status: newStatus,
                delivery_date: newStatus === 'delivered' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null,
                quality_rating: 5 
            });
            
            // Re-run the full intelligence scan to update all UI components safely
            await fetchData();
            
            alert(`Shipment status updated to ${newStatus.toUpperCase()}. Neural grades recalculated.`);
        } catch (err) {
            console.error("Failed to update shipment", err);
            alert("Verification protocol failed.");
        }
    };

    const getRecommendation = async () => {
        if (!drugId) {
            setRecError("Please select a drug to analyse.");
            return;
        }
        setRecLoading(true);
        setRecError(null);
        setRecommendation(null);
        try {
            const res = await axios.post('http://localhost:5000/api/recommend-supplier', {
                drug_id: drugId,
                priority
            });
            if (res.data.error) {
                setRecError(res.data.error);
            } else {
                setRecommendation(res.data);
            }
        } catch (err) {
            setRecError("Intelligence Engine is offline. Start the Python ML service on port 8000.");
        } finally {
            setRecLoading(false);
        }
    };

    const selectedDrug = drugs.find(d => d.id === drugId || d.id === parseInt(drugId));

    if (loading) return (
        <div className="flex h-96 items-center justify-center flex-col text-indigo-600 space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] font-black tracking-widest uppercase">Decrypting Supplier Intelligence via ML...</span>
        </div>
    );

    return (
        <div className="p-8 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between space-y-4 md:space-y-0 border-b border-slate-100 pb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-800 flex items-center">
                        <ShieldCheck className="w-10 h-10 mr-4 text-indigo-500 fill-indigo-500/10" /> 
                        NexusMed Selection Protocol
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">Predictive vendor ranking &amp; pharmaceutical risk mitigation engine.</p>
                </div>
                <div className="flex bg-white/60 border border-slate-200 p-1 rounded-xl">
                    {['cost', 'urgency', 'reliability', 'security'].map(p => (
                        <button key={p} onClick={() => setPriority(p)} className={`px-4 py-2 rounded-lg text-sm transition-all font-bold capitalize ${priority === p ? 'bg-indigo-500 text-slate-800 shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-900'}`}>{p}</button>
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* Procurement Matrix Panel */}
                <div className="lg:col-span-1 p-8 rounded-3xl bg-indigo-600 shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Calculator className="w-32 h-32 text-slate-800" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Automated Procurement Matrix</h2>
                        <p className="text-indigo-200 text-sm mb-8 font-medium">Select a drug and priority to run a live ML recommendation against your vendor fleet.</p>
                        
                        {/* Drug Selector */}
                        <div className="mb-6 relative">
                            <label className="block text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2">Target Drug</label>
                            <button 
                                onClick={() => setDrugSelectorOpen(!drugSelectorOpen)}
                                className="w-full bg-white border border-slate-300 rounded-2xl px-5 py-4 text-slate-800 text-sm font-bold flex items-center justify-between hover:bg-white/20 transition-all"
                            >
                                <span className="truncate">{selectedDrug ? selectedDrug.name : 'Select a medication...'}</span>
                                <ChevronDown className={`w-4 h-4 ml-2 transition-transform shrink-0 ${drugSelectorOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {drugSelectorOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-slate-300 rounded-2xl shadow-2xl z-50 max-h-52 overflow-y-auto">
                                    {drugs.map(d => (
                                        <button 
                                            key={d.id}
                                            onClick={() => { setDrugId(d.id); setDrugSelectorOpen(false); setRecommendation(null); }}
                                            className={`w-full text-left px-5 py-3 text-sm transition-all hover:bg-indigo-500/10 hover:text-indigo-400 ${d.id === drugId || d.id === parseInt(drugId) ? 'bg-indigo-100 text-indigo-600 font-bold' : 'text-slate-600'}`}
                                        >
                                            {d.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={getRecommendation}
                            disabled={recLoading || !drugId}
                            className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {recLoading ? (
                                <><Activity className="w-5 h-5 animate-pulse mr-2" /> Analysing Fleet...</>
                            ) : (
                                <>Run ML Recommendation <ArrowRight className="w-4 h-4 ml-2" /></>
                            )}
                        </button>

                        {recError && (
                            <div className="mt-6 p-4 bg-rose-100 border border-rose-500/30 rounded-2xl">
                                <p className="text-rose-300 text-xs font-medium leading-relaxed">{recError}</p>
                            </div>
                        )}

                        {recommendation && !recLoading && (
                            <div className="mt-8 pt-8 border-t border-slate-200 space-y-4">
                                <p className="text-[10px] text-indigo-200 font-black uppercase tracking-widest">Top Tier Selection — {priority} priority</p>
                                {recommendation.top_recommendations?.map((rec, idx) => (
                                    <div key={rec.id} className={`p-5 rounded-2xl ${idx === 0 ? 'bg-white text-indigo-900' : 'bg-white text-slate-800'}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={`text-xs font-black uppercase tracking-widest ${idx === 0 ? 'text-indigo-500' : 'text-slate-500'}`}>
                                                #{idx + 1} {idx === 0 ? '⭐ Optimal' : 'Backup'}
                                            </div>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                                rec.risk_level === 'Low' ? 'bg-emerald-100 text-emerald-600' :
                                                rec.risk_level === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                                            }`}>{rec.risk_level} Risk</span>
                                        </div>
                                        <h4 className="font-black text-lg leading-tight mb-3">{rec.name}</h4>
                                        <div className="grid grid-cols-3 gap-2 text-[10px]">
                                            <div className={`p-2 rounded-xl ${idx === 0 ? 'bg-indigo-50' : 'bg-black/20'}`}>
                                                <span className="block opacity-60 mb-1">Score</span>
                                                <span className="font-black">{rec.ai_score}%</span>
                                            </div>
                                            <div className={`p-2 rounded-xl ${idx === 0 ? 'bg-indigo-50' : 'bg-black/20'}`}>
                                                <span className="block opacity-60 mb-1">Price</span>
                                                <span className="font-black">${rec.price?.toFixed(2)}</span>
                                            </div>
                                            <div className={`p-2 rounded-xl ${idx === 0 ? 'bg-indigo-50' : 'bg-black/20'}`}>
                                                <span className="block opacity-60 mb-1">Lead</span>
                                                <span className="font-black">{rec.lead_time}d</span>
                                            </div>
                                            <div className={`p-2 rounded-xl ${idx === 0 ? 'bg-indigo-50' : 'bg-black/20'}`}>
                                                <span className="block opacity-60 mb-1 font-bold flex items-center"><Shield className="w-2 h-2 mr-1" /> Security</span>
                                                <span className="font-black">{rec.security_score || 'N/A'}%</span>
                                            </div>
                                        </div>
                                        {idx === 0 && rec.reason && (
                                            <p className="mt-3 text-[10px] text-indigo-600 italic leading-relaxed border-t border-indigo-100 pt-3">
                                                <Zap className="w-3 h-3 inline mr-1" />"{rec.reason}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Volatility Chart */}
                <div className="lg:col-span-2 p-8 rounded-3xl bg-white/60 border border-slate-200 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-black text-slate-800 flex items-center">
                            <BarChart3 className="w-5 h-5 mr-3 text-indigo-600" /> Vendor Fleet Matrix
                        </h3>
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-400/10 px-3 py-1 rounded-full border border-indigo-400/20">
                            {trends.length > 0 ? 'Live DB Stream' : 'Live: Empty State'}
                        </div>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="supplier" stroke="#444" axisLine={false} tickLine={false} tick={{fill: '#666'}} />
                                <YAxis yAxisId="left" stroke="#444" axisLine={false} tickLine={false} tick={{fill: '#666'}} label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', fill: '#666' }} />
                                <YAxis yAxisId="right" orientation="right" stroke="#444" axisLine={false} tickLine={false} tick={{fill: '#666'}} label={{ value: 'Value ($, Days)', angle: 90, position: 'insideRight', fill: '#666' }} />
                                <Tooltip cursor={{fill: '#111'}} contentStyle={{backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '12px'}} />
                                <Bar yAxisId="left" dataKey="reliability" name="Reliability Score (%)" fill="#10b981" radius={[4, 4, 0, 0]} minPointSize={3} />
                                <Bar yAxisId="left" dataKey="security" name="Security Score (%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} minPointSize={3} />
                                <Bar yAxisId="right" dataKey="cost" name="Avg Cost ($)" fill="#6366f1" radius={[4, 4, 0, 0]} minPointSize={3} />
                                <Bar yAxisId="right" dataKey="urgency" name="Avg Urgency (Days)" fill="#f43f5e" radius={[4, 4, 0, 0]} minPointSize={3} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>



            {/* Monitored Global Vendors */}
            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center">
                <Globe className="w-5 h-5 mr-3 text-indigo-600" /> Monitored Global Vendors
                <span className="ml-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {suppliers.length === 0 ? '—' : `${suppliers.length} nodes active`}
                </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {suppliers.length === 0 ? (
                    <div className="col-span-full text-center py-16 text-slate-500 italic">No approved vendors found. Approve suppliers via the Governance tab.</div>
                ) : suppliers.map(s => (
                    <div key={s.id} className="p-8 rounded-[2rem] bg-white/60 border border-slate-200 hover:border-indigo-500/50 transition-all hover:translate-y-[-8px] relative group h-full flex flex-col overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div>
                                <h4 className="text-slate-800 font-extrabold text-xl group-hover:text-indigo-400 transition-colors uppercase tracking-tight leading-none truncate pr-4">{s.name}</h4>
                                <p className="text-slate-400 text-[10px] font-mono mt-1">NEX-ID-{s.id}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100 ${
                                s.intelligence.risk_level === 'High' ? 'text-rose-600 bg-rose-400/10' : 
                                s.intelligence.risk_level === 'Medium' ? 'text-amber-600 bg-amber-400/10' : 'text-emerald-600 bg-emerald-400/10'
                            }`}>
                                {s.intelligence.risk_level} Risk
                            </span>
                        </div>
                        <div className="flex-1 space-y-6 relative z-10">
                            <div>
                                <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-widest">
                                    <span className="text-slate-400">Stability Grade</span>
                                    <span className="text-slate-800 font-mono">{s.reliability_score || 0}%</span>
                                </div>
                                <div className="w-full bg-white/60 h-2 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000" style={{ width: `${s.reliability_score || 0}%` }}></div>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-100/50 rounded-3xl border border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Security Score</p>
                                    <span className={`text-2xl font-black ${s.security_score > 70 ? 'text-purple-400' : 'text-slate-800'}`}>
                                        {s.security_score || 0}%
                                    </span>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.security_score > 70 ? 'bg-purple-500/10 text-purple-400' : 'bg-white/60 text-slate-400'}`}>
                                     <Shield className="w-5 h-5 flex-shrink-0" />
                                </div>
                            </div>
                            <div className="p-4 bg-slate-100/50 rounded-3xl border border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Disruption index</p>
                                    <span className={`text-2xl font-black ${s.intelligence.disruption_probability > 60 ? 'text-rose-500' : 'text-slate-800'}`}>
                                        {s.intelligence.disruption_probability}%
                                    </span>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.intelligence.disruption_probability > 60 ? 'bg-rose-50 text-rose-500' : 'bg-white/60 text-slate-400'}`}>
                                     <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 flex items-center text-[10px] font-bold text-slate-400 border-t border-slate-100 pt-6 relative z-10 uppercase tracking-widest">
                            {s.intelligence.trend === 'Increasing' ? <TrendingUp className="w-4 h-4 mr-2 text-rose-600" /> : <ShieldCheck className="w-4 h-4 mr-2 text-emerald-600" />}
                            <span className={s.intelligence.trend === 'Increasing' ? 'text-rose-600' : 'text-emerald-600'}>
                                {s.intelligence.trend} volatility trend
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Shipment Ledger */}
            <div className="p-8 rounded-3xl bg-white/60 border border-slate-200 backdrop-blur-md overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-slate-800 flex items-center">
                        <List className="w-5 h-5 mr-3 text-indigo-600" /> 
                        Centralized Shipment Ledger
                    </h3>
                    <div className="flex items-center text-xs text-slate-400 bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-100">
                        <Globe className="w-3 h-3 mr-2 text-emerald-600" /> 
                        {logs.length} Transactions Decoded
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-widest">
                                <th className="py-4 px-4 font-bold">Timestamp</th>
                                <th className="py-4 px-4 font-bold">Medication</th>
                                <th className="py-4 px-4 font-bold">Vendor Source</th>
                                <th className="py-4 px-4 font-bold">Quantity</th>
                                <th className="py-4 px-4 font-bold">Unit Price</th>
                                <th className="py-4 px-4 font-bold">Total</th>
                                <th className="py-4 px-4 font-bold">Status</th>
                                <th className="py-4 px-4 font-bold text-right">Protocol Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-400 italic">No shipment records found. Suppliers can add shipments via the Vendor Portal.</td>
                                </tr>
                            ) : logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-100 transition-colors group">
                                    <td className="py-4 px-4 text-xs font-mono text-slate-500">{new Date(log.order_date).toLocaleDateString()}</td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center">
                                            <Package className="w-4 h-4 mr-2 text-indigo-600 opacity-50" />
                                            <span className="text-slate-800 font-bold">{log.drug_name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-slate-600 font-medium">{log.supplier_name}</td>
                                    <td className="py-4 px-4 text-slate-800 font-mono">{log.quantity?.toLocaleString()}</td>
                                    <td className="py-4 px-4 text-indigo-300 font-mono">${parseFloat(log.unit_price || 0).toFixed(2)}</td>
                                    <td className="py-4 px-4">
                                        <span className="text-emerald-600 font-black font-mono">
                                            ${((log.quantity || 0) * (log.unit_price || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                            log.status === 'delivered' ? 'bg-emerald-100 text-emerald-600 border border-emerald-500/20' :
                                            log.status === 'cancelled' ? 'bg-rose-100 text-rose-600 border border-rose-500/20' :
                                            'bg-amber-100 text-amber-600 border border-amber-500/20'
                                        }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        {log.status === 'pending' && (
                                            <div className="flex justify-end space-x-2">
                                                <button 
                                                    onClick={() => handleUpdateStatus(log.id, 'delivered')}
                                                    className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                                                    title="Mark as Delivered"
                                                >
                                                    <ShieldCheck className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdateStatus(log.id, 'cancelled')}
                                                    className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                                                    title="Cancel Shipment"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        {log.status === 'delivered' && (
                                            <span className="text-[10px] font-black text-slate-300 uppercase italic">Verified Ledger</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SupplierIntelligence;
