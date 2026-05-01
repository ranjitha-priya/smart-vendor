import React, { useState } from 'react';
import { Activity, Package, Users, ShieldCheck, TrendingUp, LogOut, CheckSquare } from 'lucide-react';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import InventoryManager from './components/InventoryManager';
import SupplierManager from './components/SupplierManager';
import SupplierIntelligence from './components/SupplierIntelligence';
import Diagnostics from './components/Diagnostics';
import AdminApprovals from './components/AdminApprovals';
import SupplierPortal from './components/SupplierPortal';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDrugId, setSelectedDrugId] = useState(null);

  const handleNavigateWithDrug = (tab, drugId) => {
    setSelectedDrugId(drugId || null);
    setActiveTab(tab);
  };

  if (!user) {
      return <AuthPage onLogin={setUser} />
  }

  // If the user is an authorized SUPPLIER, lock them directly into their isolated Vendor Portal
  if (user.role === 'supplier') {
      return <SupplierPortal user={user} onLogout={() => setUser(null)} />
  }

  // Else, the user is a full ADMIN -> render the comprehensive NexusMed AI Dashboard
  return (
    <div className="flex shrink-0 min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-200">
      
      <aside className="w-20 lg:w-72 border-r border-slate-100 bg-white/80 backdrop-blur-3xl shadow-xl flex flex-col items-center lg:items-start py-10 transition-all relative z-50">
        <div className="px-8 w-full flex items-center justify-center lg:justify-start mb-14">
          <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl shadow-indigo-200 rotate-3 transition-transform hover:rotate-0">
            <Activity className="w-7 h-7 text-slate-800" />
          </div>
          <div className="ml-4 hidden lg:block overflow-hidden">
            <span className="font-black text-2xl block tracking-tighter text-slate-800 leading-none">Pharma Sense AI</span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-600 block mt-1">Intelligence</span>
          </div>
        </div>
        
        <nav className="w-full px-4 space-y-2 flex-1">
          {[
            { id: 'dashboard', icon: TrendingUp, label: 'Control Center' },
            { id: 'inventory', icon: Package, label: 'Asset Repository' },
            { id: 'intelligence', icon: ShieldCheck, label: 'Selection Protocol' },
            { id: 'suppliers', icon: Users, label: 'Fleet Intelligence' },
            { id: 'approvals', icon: CheckSquare, label: 'Governance' },
            { id: 'diagnostics', icon: Activity, label: 'Neural Health' },
          ].map((item) => (
            <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center p-4 rounded-xl transition-all duration-200 cursor-pointer group ${
                    activeTab === item.id 
                    ? 'bg-white/60 text-indigo-600 border-l-2 border-indigo-500' 
                    : 'text-slate-400 hover:bg-slate-100 hover:text-gray-300 border-l-2 border-transparent'
                }`}
            >
              <item.icon className={`w-5 h-5 shrink-0 mx-auto lg:mx-0 transition-transform ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="ml-4 hidden lg:block text-xs uppercase tracking-widest font-black">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-4 w-full mt-10">
            <button onClick={() => setUser(null)} className="w-full flex items-center p-4 rounded-2xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all group">
                <LogOut className="w-5 h-5 shrink-0 mx-auto lg:mx-0 group-hover:rotate-12 transition-transform" />
                <span className="ml-4 hidden lg:block text-[10px] font-black uppercase tracking-widest">Logout Protocol</span>
            </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white">
         {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} onNavigateWithDrug={handleNavigateWithDrug} />}
         {activeTab === 'inventory' && <InventoryManager />}
         {activeTab === 'intelligence' && <SupplierIntelligence initialDrugId={selectedDrugId} />}
         {activeTab === 'suppliers' && <SupplierManager />}
         {activeTab === 'approvals' && <AdminApprovals />}
         {activeTab === 'diagnostics' && <Diagnostics />}
      </main>
    </div>
  )
}

export default App;
