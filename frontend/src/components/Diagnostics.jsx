import React, { useState } from 'react';
import axios from 'axios';
import { Activity, ShieldCheck, AlertTriangle, PlayCircle, HardDrive, Zap, Cpu, Terminal, ArrowRight, Loader2, Shield, Globe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Diagnostics = () => {
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [scanPhase, setScanPhase] = useState("");
    const [benchmarks, setBenchmarks] = useState(null);

    const runDiagnostics = async () => {
        setRunning(true);
        setResults(null);
        setErrorMsg(null);
        
        const phases = [
            "Initializing Tensor Core...",
            "Decrypting MySQL Packets...",
            "Running Lead-Time Variance Analysis...",
            "Computing Defect Probability Matrices...",
            "Finalizing Neural Inference..."
        ];

        let i = 0;
        const phaseInterval = setInterval(() => {
            if (i < phases.length) {
                setScanPhase(phases[i]);
                i++;
            } else {
                clearInterval(phaseInterval);
            }
        }, 800);

        try {
            const res = await axios.get('http://localhost:5000/api/admin/run-diagnostics');
            setResults(res.data);
            
            // Also fetch security benchmarks
            try {
                const benchRes = await axios.get('http://localhost:5000/api/admin/security-benchmarks');
                setBenchmarks(benchRes.data);
            } catch (e) {
                console.error("Benchmarks failed", e);
            }
        } catch (err) {
            console.error(err);
            setErrorMsg("Neural engine link failure.");
            setResults({
                status: "error",
                system_score: 0,
                interpretation: "Neural connection severed. Verify backend node connectivity.",
                anomalies: [
                    { severity: "critical", message: "CRITICAL: Neural core cannot reach the database cluster. Analysis aborted." }
                ]
            });
        } finally {
            clearInterval(phaseInterval);
        }
        setRunning(false);
    };

    const handleExportLog = () => {
        if (!results) return;
        const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        const logContent = `
NEXUSMED NEURAL CORE DIAGNOSTIC LOG
Generated: ${timestamp}
-----------------------------------
System Stability Score: ${results.system_score}/100
Interpretation: ${results.interpretation}

ANOMALIES DETECTED:
${results.anomalies.map(a => `[${a.severity.toUpperCase()}] ${a.message}`).join('\n')}

-----------------------------------
FASTAPI TENSOR MICROSERVICE // CLUSTER HEALTH: OPTIMAL
        `.trim();

        const blob = new Blob([logContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nexusmed_diag_${new Date().getTime()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-8 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col">
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0 border-b border-slate-100 pb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-800 flex items-center">
                        <Cpu className="w-10 h-10 mr-4 text-indigo-500 fill-indigo-500/10" /> 
                        Neural Core Health
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium italic">Simulate deep-learning diagnostics across the global pharmaceutical node.</p>
                </div>
                <div className="flex space-x-3">
                    <div className="px-4 py-2 bg-indigo-100 border border-indigo-200 rounded-xl text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center">
                        <Terminal className="w-4 h-4 mr-2" />
                        Root Access Authorized
                    </div>
                </div>
            </header>

            <div className="p-10 rounded-[2.5rem] bg-white/60 border border-slate-200 backdrop-blur-3xl shadow-xl relative overflow-hidden flex-1 flex flex-col items-center justify-center min-h-[500px] shadow-3xl group">
                {/* Background Ambient Pulse */}
                <div className={`absolute inset-0 transition-all duration-1000 ${running ? 'bg-indigo-100 opacity-100' : 'bg-transparent opacity-0'}`}></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-[100px] -mr-16 -mt-16 pointer-events-none"></div>

                {/* STATE 1: Idling */}
                {!running && !results && (
                    <div className="text-center relative z-10 w-full max-w-sm mx-auto animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-white/60 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-2xl group-hover:bg-indigo-500/10 transition-all">
                            <HardDrive className="w-12 h-12 text-slate-400 group-hover:text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-3 uppercase tracking-tighter">System Diagnostic Node</h2>
                        <p className="text-slate-400 mb-10 leading-relaxed font-medium">Verify structural integrity and predict fleet-wide supply shocks using active ML tensor models.</p>
                        <button onClick={runDiagnostics} className="px-10 py-5 bg-white text-black hover:bg-indigo-500 hover:text-slate-900 shadow-2xl transition-all rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center w-full active:scale-95 group/btn">
                            <PlayCircle className="w-5 h-5 mr-3 group-hover/btn:animate-pulse" /> Initiate Full Neural Scan
                        </button>
                    </div>
                )}

                {/* STATE 2: Running */}
                {running && (
                    <div className="flex flex-col items-center justify-center relative z-10 animate-in fade-in duration-500">
                        <div className="relative w-32 h-32 mb-10">
                            <div className="absolute inset-0 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-4 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin direction-reverse"></div>
                            <Activity className="absolute inset-0 m-auto w-10 h-10 text-slate-800 animate-pulse" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tighter uppercase">{scanPhase}</h3>
                        <div className="flex items-center text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            Analyzing Stock Variance Packets...
                        </div>
                    </div>
                )}

                {/* STATE 3: Results */}
                {!running && results && (
                    <div className="w-full relative z-10 animate-in slide-in-from-bottom-12 duration-700">
                        <div className="flex flex-col md:flex-row items-center justify-between mb-12 pb-8 border-b border-slate-100 gap-6">
                            <div>
                                <h2 className="text-3xl font-black text-slate-800 flex items-center tracking-tighter uppercase leading-none">
                                    <ShieldCheck className="w-8 h-8 mr-4 text-emerald-600" /> 
                                    Diagnostic Manifest Decrypted
                                </h2>
                                <p className="text-slate-400 mt-2 text-xs font-bold uppercase tracking-widest">Temporal Analysis complete @ Nexus-ML Cluster</p>
                            </div>
                            <div className="flex space-x-3">
                                {results.status !== 'standby' && (
                                    <button onClick={handleExportLog} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-800 transition-all text-[10px] font-black border border-indigo-400/20 uppercase tracking-widest active:scale-95 shadow-lg shadow-indigo-600/20">
                                        Download Log
                                    </button>
                                )}
                                <button onClick={()=>setResults(null)} className="px-6 py-3 rounded-xl bg-white/60 hover:bg-slate-50 text-slate-500 transition-all text-[10px] font-black border border-slate-200 uppercase tracking-widest active:scale-95">
                                    Flash Cache & Reboot
                                </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-4">
                                {results.anomalies.map((anomaly, idx) => (
                                    <div key={idx} className={`p-6 rounded-[1.8rem] border flex items-start group hover:translate-x-2 transition-all ${
                                        anomaly.severity === 'critical' ? 'bg-rose-500/5 border-rose-500/20' :
                                        anomaly.severity === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                                        'bg-indigo-50 border-indigo-200'
                                    }`}>
                                        <div className={`p-4 rounded-2xl shrink-0 mt-0.5 mr-6 ${
                                            anomaly.severity === 'critical' ? 'bg-rose-50 text-rose-500' :
                                            anomaly.severity === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-100 text-indigo-600'
                                        }`}>
                                            {anomaly.severity === 'critical' ? <AlertTriangle className="w-6 h-6" /> : 
                                             anomaly.severity === 'warning' ? <Zap className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h4 className={`font-black uppercase tracking-widest text-[9px] mb-2 ${
                                                anomaly.severity === 'critical' ? 'text-rose-500' :
                                                anomaly.severity === 'warning' ? 'text-amber-500' : 'text-indigo-600'
                                            }`}>{anomaly.severity} Flag Identified</h4>
                                            <p className="text-slate-600 font-medium italic text-sm leading-relaxed">{anomaly.message}</p>
                                        </div>
                                    </div>
                                ))}

                            </div>
                            
                            {/* Visual Detail Panel */}
                            <div className="p-8 rounded-[2rem] bg-slate-100/50 border border-slate-100 flex flex-col justify-center relative overflow-hidden h-full">
                                <Activity className={`absolute -bottom-16 -right-16 w-64 h-64 text-emerald-500/5 rotate-12 ${results.system_score < 50 ? 'text-rose-500/5' : ''}`} />
                                <div className="relative z-10 h-full flex flex-col">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Neural Interpretation</p>
                                    <div className="space-y-6 flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-500">System Stability Score</span>
                                            <span className={`font-black font-mono ${results.system_score > 70 ? 'text-emerald-600' : results.system_score > 40 ? 'text-amber-600' : 'text-rose-500'}`}>
                                                {results.system_score}/100
                                            </span>
                                        </div>
                                        <div className="w-full bg-white/60 h-1.5 rounded-full overflow-hidden">
                                            <div className={`h-full transition-all duration-1000 ${results.system_score > 70 ? 'bg-emerald-500' : results.system_score > 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${results.system_score}%` }}></div>
                                        </div>
                                        <div className="flex items-center text-xs text-slate-600 italic mt-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-inner">
                                            "{results.interpretation}"
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-8">
                                        <button 
                                            onClick={handleExportLog}
                                            className="w-full py-4 bg-white/60 hover:bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center active:scale-95"
                                        >
                                            Export Neural Log <ArrowRight className="w-3 h-3 ml-2" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="mt-8 text-center text-[9px] font-black text-gray-700 uppercase tracking-[0.3em]">
                FastAPI Tensor Microservice // Cluster Health: Optimal
            </div>
        </div>
    );
};
export default Diagnostics;
