import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, CheckCircle, XCircle, Users, Activity, Lock, ArrowRight, UserCheck } from 'lucide-react';

const AdminApprovals = () => {
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPending = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/pending-suppliers`);
            setPending(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPending(); }, []);

    const handleAction = async (id, action) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/${action}-supplier/${id}`);
            fetchPending();
        } catch (err) {
            alert(`Neural link failure during ${action} protocol.`);
        }
    };

    return (
        <div className="p-8 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0 border-b border-slate-100 pb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-800 flex items-center">
                        <Lock className="w-10 h-10 mr-4 text-indigo-500 fill-indigo-500/10" /> 
                        Governance Protocol
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">Verify and authorize global vendor nodes into the trusted NexusMed infrastructure.</p>
                </div>
                <div className="flex space-x-3">
                    <div className="px-4 py-2 bg-white/60 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center">
                        <UserCheck className="w-4 h-4 mr-2 text-indigo-600" />
                        Verification Layer Active
                    </div>
                </div>
            </header>

            <div className="p-10 rounded-[2.5rem] bg-white/60 border border-slate-200 backdrop-blur-3xl shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                
                <h3 className="text-xl font-black mb-10 flex items-center text-slate-800">
                  <Activity className="w-6 h-6 mr-3 text-indigo-600 opacity-50" />
                  Incoming Access Requests
                </h3>

                {pending.length === 0 && !loading && (
                    <div className="text-center py-20 text-slate-500 flex flex-col items-center animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-white/60 rounded-3xl flex items-center justify-center mb-6 border border-slate-100">
                            <Users className="w-10 h-10 opacity-20" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Zero Pending Clearances</h3>
                        <p className="text-slate-400 text-sm italic font-medium">All global vendor applications have been successfully processed.</p>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-indigo-600 opacity-50 space-y-4">
                        <Activity className="w-12 h-12 animate-spin-slow" />
                        <span className="text-[10px] font-black tracking-widest uppercase">Validating Authentication Packets...</span>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {pending.map((sup, idx) => (
                            <div key={sup.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-8 bg-slate-100/50 border border-slate-100 rounded-[1.8rem] transition-all hover:bg-slate-100 hover:border-indigo-500/30 group animate-in slide-in-from-right-8 duration-500" style={{animationDelay: `${idx * 150}ms`}}>
                                <div className="relative z-10 flex items-center">
                                    <div className="w-14 h-14 bg-white/60 rounded-2xl flex items-center justify-center mr-6 border border-slate-100 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
                                        <ShieldCheck className="w-7 h-7 text-indigo-600 opacity-70 group-hover:opacity-100" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 mb-1 group-hover:text-indigo-400 transition-colors tracking-tight uppercase">{sup.name}</h3>
                                        <div className="text-[10px] font-mono font-bold text-slate-400 flex flex-col sm:flex-row sm:space-x-6 items-start sm:items-center">
                                            <span className="flex items-center"><ArrowRight className="w-3 h-3 mr-2" /> {sup.contact_email}</span>
                                            <span className="flex items-center"><ArrowRight className="w-3 h-3 mr-2" /> {sup.contact_phone}</span>
                                        </div>
                                        <p className="text-[9px] font-black text-gray-700 mt-4 uppercase tracking-[0.2em]">Application Timestamp: {new Date(sup.created_at).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="flex space-x-4 mt-8 md:mt-0 relative z-10">
                                    <button 
                                        onClick={() => handleAction(sup.id, 'reject')}
                                        className="px-6 py-4 bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-slate-900 rounded-[1.2rem] flex items-center transition-all text-[10px] font-black uppercase tracking-widest border border-rose-500/20 active:scale-95"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" /> Deny Access
                                    </button>
                                    <button 
                                        onClick={() => handleAction(sup.id, 'approve')}
                                        className="px-6 py-4 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-[#0a0a0a] rounded-[1.2rem] flex items-center transition-all text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-xl shadow-emerald-500/10 active:scale-95"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" /> Authorize Integration
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="mt-12 p-8 rounded-[2rem] bg-indigo-50 border border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center font-medium italic">
                    <Activity className="w-4 h-4 mr-3 text-indigo-600" />
                    "Approved agents will gain immediate clearance to push inventory datasets to the ML node."
                </div>
                <div className="hidden md:block font-black uppercase tracking-widest text-[10px]">Security Clearance L-4 Required</div>
            </div>
        </div>
    );
};

export default AdminApprovals;
