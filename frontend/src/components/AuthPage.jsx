import React, { useState } from 'react';
import axios from 'axios';
import { ShieldCheck, Users, LogIn, UserPlus, Activity, ArrowRight } from 'lucide-react';

const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('admin'); // 'admin' or 'supplier'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isLogin) {
        const res = await axios.post('http://localhost:5000/api/auth/login', { email, password, role });
        onLogin(res.data.user);
      } else {
        if (role === 'admin') {
           setErrorMsg("Admin registration is restricted. Contact system architect.");
           setLoading(false);
           return;
        }
        await axios.post('http://localhost:5000/api/auth/register-supplier', { name, email, phone, password });
        setSuccessMsg("NexusMed access request submitted. Pending manual approval.");
        setIsLogin(true);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Neural link to NexusMed backend failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-[#0a0a0a] to-white selection:bg-indigo-200">
      <div className="w-full max-w-md bg-white/60 border border-slate-200 p-10 rounded-[2.5rem] backdrop-blur-3xl shadow-xl shadow-2xl relative overflow-hidden transition-all">
        
        {/* Deep Cyberpunk Glow Accent */}
        <div className="absolute top-0 right-0 p-12 bg-indigo-100 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 p-12 bg-emerald-50 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>
        
        <div className="relative z-10 w-full">
            <div className="flex flex-col items-center mb-10 text-center">
                <div className="w-20 h-20 bg-indigo-500 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-indigo-200 rotate-3 transition-transform hover:rotate-0">
                    <Activity className="w-12 h-12 text-slate-800" />
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-slate-800 mb-2">NexusMed</h1>
                <p className="text-slate-400 font-medium uppercase tracking-widest text-[10px]">Global Pharma Intelligence Node</p>
            </div>

            {/* Switching Logic */}
            <div className="flex p-1.5 bg-white/60 rounded-2xl mb-8 border border-slate-100">
                <button 
                    onClick={() => setRole('admin')}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center uppercase tracking-widest ${role === 'admin' ? 'bg-indigo-500 text-slate-800 shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-gray-300'}`}
                >
                    <ShieldCheck className="w-4 h-4 mr-2" /> CORE ADMIN
                </button>
                <button 
                    onClick={() => setRole('supplier')}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center uppercase tracking-widest ${role === 'supplier' ? 'bg-emerald-500 text-[#0a0a0a] shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-gray-300'}`}
                >
                    <Users className="w-4 h-4 mr-2" /> VENDOR PORTAL
                </button>
            </div>

            {errorMsg && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-500/20 flex items-start text-xs">
                    <ShieldCheck className="w-4 h-4 text-rose-600 mr-2 shrink-0 mt-0.5" />
                    <p className="text-rose-600 font-medium">{errorMsg}</p>
                </div>
            )}
            
            {successMsg && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-500/20 flex items-start text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 mr-2 shrink-0 mt-0.5" />
                    <p className="text-emerald-600 font-medium">{successMsg}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                   <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Legal Entity / Full Name</label>
                      <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#050505] border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-mono" placeholder="e.g. PharmaCorp Global" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Direct Contact Line</label>
                      <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-[#050505] border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-mono" placeholder="+1 (555) 000-0000" />
                    </div>
                   </div>
                )}
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Neural Access Email</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#050505] border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-mono" placeholder="username@gmail.com" />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Secure Passphrase</label>
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#050505] border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-mono" placeholder="••••••••" />
                </div>
                
                <button disabled={loading} type="submit" className="w-full py-5 rounded-2xl bg-white text-black font-black hover:bg-gray-200 active:scale-95 transition-all text-sm flex items-center justify-center shadow-2xl uppercase tracking-widest">
                   {loading ? (
                       <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                   ) : (
                       isLogin ? <><LogIn className="w-4 h-4 mr-2" /> Establish Link</> : <><UserPlus className="w-4 h-4 mr-2" /> Request Integration</>
                   )}
                </button>
            </form>

            {/* Toggle Logic */}
            {role === 'supplier' && (
                <div className="mt-8 text-center border-t border-slate-100 pt-8">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3">
                        {isLogin ? "No Vendor Clearance?" : "Clearance already detected?"}
                    </p>
                    <button onClick={() => setIsLogin(!isLogin)} className="text-slate-800 font-black hover:text-indigo-400 transition-colors text-xs uppercase tracking-tighter flex items-center justify-center mx-auto">
                        {isLogin ? "Apply for Network Integration" : "Return to Access Screen"} <ArrowRight className="w-3 h-3 ml-2" />
                    </button>
                </div>
            )}
            
            {role === 'admin' && (
                 <div className="mt-8 text-center border-t border-slate-100 pt-8 text-[10px] font-bold text-slate-500 uppercase tracking-tighter italic">
                    Restricted Management Terminal. Unauthorized data tampering is logged.
                 </div>
            )}

            {/* <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em]">System Version 4.0.0-MLD // NexusMed</p>
            </div> */}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
