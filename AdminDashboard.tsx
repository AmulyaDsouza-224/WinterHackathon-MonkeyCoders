
import React, { useState } from 'react';
import { Icons, MOCK_USERS, TEAM_MEMBERS } from '../constants';
import { User, UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard: React.FC<{ activePage: string; user: User; onUserUpdate: (u: Partial<User>) => void; allUsers: User[]; setAllUsers: React.Dispatch<React.SetStateAction<User[]>> }> = ({ activePage, user, onUserUpdate, allUsers, setAllUsers }) => {
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ name: '', email: '', password: '', specialization: '' });

  const chartData = [
    { name: 'Mon', count: 12 }, { name: 'Tue', count: 19 }, { name: 'Wed', count: 15 },
    { name: 'Thu', count: 22 }, { name: 'Fri', count: 30 }, { name: 'Sat', count: 45 }, { name: 'Sun', count: 10 },
  ];

  /* 2. Medicine Inventory State */
  const [medicines, setMedicines] = useState([
    { id: 'm1', name: 'Paracetamol', type: 'Tablet', stock: 500, status: 'In Stock' },
    { id: 'm2', name: 'Amoxicillin', type: 'Capsule', stock: 120, status: 'Low Stock' },
    { id: 'm3', name: 'Ibuprofen', type: 'Tablet', stock: 300, status: 'In Stock' },
    { id: 'm4', name: 'Cetirizine', type: 'Tablet', stock: 50, status: 'Critical' },
    { id: 'm5', name: 'Insulin Glargine', type: 'Injection', stock: 80, status: 'In Stock' },
  ]);

  /* 3. Calculate Doctor Stats Helper */
  const getDoctorStats = (docId: string) => {
    // In a real app, calculate from actual appointments
    // For demo, we stick to mock or localStorage data if accessible, otherwise random/mock
    // Let's assume we can simulate for now based on the requested feature
    return {
      patients: Math.floor(Math.random() * 50) + 10,
      hours: Math.floor(Math.random() * 40) + 20,
      days: 5
    };
  };

  const pieData = [
    { name: 'Patients', value: allUsers.filter(u => u.role === UserRole.PATIENT).length, color: '#0ea5e9' },
    { name: 'Doctors', value: allUsers.filter(u => u.role === UserRole.DOCTOR).length, color: '#6366f1' },
    { name: 'Admins', value: allUsers.filter(u => u.role === UserRole.ADMIN).length, color: '#1e293b' },
  ];

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    const doc: User = {
      id: 'd' + Math.random().toString(36).substr(2, 5),
      role: UserRole.DOCTOR,
      name: newDoctor.name,
      email: newDoctor.email,
      password: newDoctor.password,
      specialization: newDoctor.specialization,
      isAvailable: true
    };
    setAllUsers(prev => [...prev, doc]);
    setNewDoctor({ name: '', email: '', password: '', specialization: '' });
    setShowAddDoctor(false);
  };

  /* 4. Delete Logic */
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDeleteUser = (id: string) => {
    setDeleteId(id);
  };

  const confirmDeleteUser = () => {
    if (deleteId) {
      setAllUsers(prev => prev.filter(u => u.id !== deleteId));
      setDeleteId(null);
    }
  };

  const renderOverview = () => (
    <div className="space-y-12 animate-in fade-in duration-500 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Network Entities', value: allUsers.length, color: 'sky' },
          { label: 'Active Specialists', value: allUsers.filter(u => u.role === UserRole.DOCTOR && u.isAvailable).length, color: 'emerald' },
          { label: 'Patient Registry', value: allUsers.filter(u => u.role === UserRole.PATIENT).length, color: 'indigo' },
          { label: 'Ledger Status', value: 'Healthy', color: 'blue' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-[#0f172a] p-10 rounded-[44px] border border-sky-50 dark:border-white/5 shadow-2xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">{s.label}</p>
            <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-white dark:bg-[#0f172a] p-12 rounded-[56px] border border-sky-100 dark:border-white/5 shadow-2xl">
          <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-10 uppercase tracking-tighter">Patient Influx Tracker (Weekly)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: '900' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: '900' }} />
                <Tooltip cursor={{ fill: 'rgba(14,165,233,0.05)' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" fill="#0ea5e9" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white dark:bg-[#0f172a] p-12 rounded-[56px] border border-sky-100 dark:border-white/5 shadow-2xl flex flex-col items-center">
          <h3 className="text-2xl font-black text-slate-800 dark:text-white self-start mb-10 uppercase tracking-tighter">Ledger Allocation</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={90} outerRadius={120} paddingAngle={10} dataKey="value" stroke="none">
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStaffPortal = () => (
    <div className="space-y-12 animate-in fade-in duration-500 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div><h3 className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">Staff Nexus</h3><p className="text-sm text-[#0ea5e9] font-black uppercase tracking-[0.5em] mt-3 italic">Identity Provisioning Protocol</p></div>
        <button onClick={() => setShowAddDoctor(true)} className="bg-[#0ea5e9] hover:bg-sky-400 text-white px-12 py-6 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-[#0ea5e9]/20 transition-all active:scale-95">Deploy Specialist Star</button>
      </div>

      <div className="bg-white dark:bg-[#0f172a] rounded-[64px] border border-sky-100 dark:border-white/5 shadow-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] border-b dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
            <tr><th className="px-12 py-8">Medical Specialist</th><th className="px-12 py-8">Performance (Pts/Hrs)</th><th className="px-12 py-8">Status</th><th className="px-12 py-8 text-right">Ledger Control</th></tr>
          </thead>
          <tbody className="divide-y dark:divide-white/5">
            {allUsers.filter(u => u.role === UserRole.DOCTOR).map(u => (
              <tr key={u.id} className="hover:bg-sky-50 dark:hover:bg-white/5 transition-colors">
                <td className="px-12 py-10 flex items-center space-x-8">
                  <div className="w-16 h-16 rounded-[28px] bg-sky-100 dark:bg-sky-500/10 flex items-center justify-center font-black text-[#0ea5e9] text-2xl shadow-inner">{u.name.charAt(0)}</div>
                  <div><p className="font-black text-slate-800 dark:text-white text-2xl uppercase tracking-tighter">{u.name}</p><p className="text-[11px] font-black text-[#0ea5e9] uppercase tracking-widest mt-1">{u.specialization || 'Clinical Generalist'}</p></div>
                </td>
                <td className="px-12 py-10 text-slate-500 font-bold text-sm">
                  <div className="space-y-1">
                    <p>Patients: <span className="text-emerald-500">{getDoctorStats(u.id).patients}</span></p>
                    <p>Hours: <span className="text-sky-500">{getDoctorStats(u.id).hours} hrs</span> / {getDoctorStats(u.id).days} days</p>
                  </div>
                </td>
                <td className="px-12 py-10">
                  <span className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${u.isAvailable ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                    {u.isAvailable ? 'Active' : 'Standby'}
                  </span>
                </td>
                <td className="px-12 py-10 text-right">
                  <button onClick={() => handleDeleteUser(u.id)} className="p-5 hover:bg-rose-100 hover:text-rose-600 text-rose-400 rounded-3xl transition-all shadow-lg shadow-rose-500/5" title="Revoke Star">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            ))}
            {allUsers.filter(u => u.role === UserRole.DOCTOR).length === 0 && (
              <tr><td colSpan={4} className="p-32 text-center text-slate-400 font-black uppercase tracking-widest italic text-sm">No clinical stars provisioned in the ledger.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddDoctor && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-300">
          <form onSubmit={handleAddDoctor} className="bg-[#0f172a] rounded-[56px] w-full max-w-2xl p-12 shadow-2xl border border-white/10 space-y-8">
            <h3 className="text-4xl font-black text-white mb-10 tracking-tighter uppercase">Initialize Specialist Star</h3>
            <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Full Legal Identity</label><input required value={newDoctor.name} onChange={e => setNewDoctor({ ...newDoctor, name: e.target.value })} className="w-full bg-[#1e293b] text-white rounded-[22px] px-8 py-5 border border-white/5 font-bold" placeholder="e.g. Dr. Winter" /></div>
            <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Medical Field Endpoint</label><input required value={newDoctor.specialization} onChange={e => setNewDoctor({ ...newDoctor, specialization: e.target.value })} className="w-full bg-[#1e293b] text-white rounded-[22px] px-8 py-5 border border-white/5 font-bold" placeholder="e.g. Neuro-Cybernetics" /></div>
            <div className="grid grid-cols-2 gap-8">
              <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Endpoint Email</label><input required type="email" value={newDoctor.email} onChange={e => setNewDoctor({ ...newDoctor, email: e.target.value })} className="w-full bg-[#1e293b] text-white rounded-[22px] px-8 py-5 border border-white/5 font-bold" /></div>
              <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Secure Access Key (Pass)</label><input required type="text" value={newDoctor.password} onChange={e => setNewDoctor({ ...newDoctor, password: e.target.value })} className="w-full bg-[#1e293b] text-white rounded-[22px] px-8 py-5 border border-white/5 font-bold" /></div>
            </div>
            <div className="flex space-x-6 pt-10">
              <button type="button" onClick={() => setShowAddDoctor(false)} className="flex-1 py-5 bg-slate-800 text-slate-500 rounded-[22px] font-black uppercase text-xs tracking-widest hover:bg-slate-700">Abort Protocol</button>
              <button type="submit" className="flex-1 py-5 bg-[#0ea5e9] text-white rounded-[22px] font-black uppercase text-xs tracking-widest hover:bg-sky-400 shadow-2xl shadow-sky-500/20">Authorize Provisioning</button>
            </div>
          </form>
        </div>
      )}

      {/* Revoke Protocol Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-rose-950/90 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="bg-[#0f172a] rounded-[56px] w-full max-w-lg p-12 shadow-2xl border border-rose-500/20 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>

            <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-rose-500 animate-pulse">
              <Icons.Trash size={40} />
            </div>

            <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Revoke Star Identity?</h3>
            <p className="text-slate-400 font-medium mb-10 leading-relaxed">
              This action will permanently purge the specialist from the Arctic Ledger and <span className="text-rose-400 font-bold">erase their entire clinical history</span>. This is irreversible.
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={confirmDeleteUser}
                className="w-full py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-[24px] font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Icons.Trash size={16} /> Execute Purge Protocol
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="w-full py-5 bg-slate-800 text-slate-400 hover:text-white rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-slate-700 transition-colors"
              >
                Cancel Operation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="bg-[#0f172a] rounded-[56px] overflow-hidden shadow-2xl border border-white/5 pb-16">
        <div className="h-64 bg-gradient-to-r from-[#1e293b] via-[#334155] to-[#0f172a] relative"></div>
        <div className="px-10 md:px-16 -mt-24 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end space-x-0 md:space-x-12 mb-16">
            <div className="w-56 h-56 rounded-[56px] bg-[#1e293b] p-3 shadow-2xl border border-white/10 group overflow-hidden">
              <div className="w-full h-full bg-[#1e293b] rounded-[44px] flex items-center justify-center text-7xl text-[#0ea5e9] font-black uppercase tracking-tighter">{user.name.charAt(0)}</div>
            </div>
            <div className="pb-8 mt-6 md:mt-0">
              <h3 className="text-7xl font-black text-white tracking-tighter lowercase leading-none mb-4">{user.name}</h3>
              <p className="text-[#3b82f6] font-black text-[11px] tracking-[0.5em] uppercase">Central Systems Root Authority</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-[#1e293b]/40 border border-white/5 rounded-[44px] p-12 backdrop-blur-md">
              <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-0.4em mb-6">Authority Registry</h4>
              <p className="text-xl font-bold text-slate-200 italic leading-relaxed">"Global star supervisor with high-level synchronization and identity management permissions."</p>
            </div>
            <div className="bg-[#1e293b]/40 border border-white/5 rounded-[44px] p-12 flex flex-col justify-center backdrop-blur-md">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-0.4em mb-4">Access Protocol</p>
              <p className="text-5xl font-black text-white uppercase tracking-tighter leading-none">Tier 1 • <span className="text-[#0ea5e9]">Root</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMedicineInventory = () => (
    <div className="space-y-12 animate-in fade-in duration-500 px-4">
      <div className="flex justify-between items-center">
        <div><h3 className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">Pharmacy Ledger</h3><p className="text-sm text-[#0ea5e9] font-black uppercase tracking-[0.5em] mt-3 italic">Inventory Control Grid</p></div>
      </div>
      <div className="bg-white dark:bg-[#0f172a] rounded-[64px] border border-sky-100 dark:border-white/5 shadow-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] border-b dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
            <tr><th className="px-12 py-8">Molecule / Brand</th><th className="px-12 py-8">Form Factor</th><th className="px-12 py-8">Stock Level</th><th className="px-12 py-8 text-right">Supply Status</th></tr>
          </thead>
          <tbody className="divide-y dark:divide-white/5">
            {medicines.map((m) => (
              <tr key={m.id} className="hover:bg-sky-50 dark:hover:bg-white/5 transition-colors">
                <td className="px-12 py-10"><p className="font-black text-slate-800 dark:text-white text-xl uppercase tracking-tighter">{m.name}</p></td>
                <td className="px-12 py-10 text-slate-500 font-bold text-sm uppercase tracking-widest">{m.type}</td>
                <td className="px-12 py-10"><span className="text-2xl font-black text-slate-800 dark:text-white">{m.stock}</span> <span className="text-xs text-slate-400 font-bold">UNITS</span></td>
                <td className="px-12 py-10 text-right">
                  <span className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${m.status === 'In Stock' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : m.status === 'Critical' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                    {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-12 animate-in fade-in duration-500 px-4">
      <div><h3 className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">System Matrix</h3><p className="text-sm text-[#0ea5e9] font-black uppercase tracking-[0.5em] mt-3 italic">Configuration & Control</p></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-white dark:bg-[#0f172a] rounded-[48px] border border-sky-100 dark:border-white/5 shadow-2xl p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity"><Icons.Settings size={100} /></div>
          <h4 className="text-2xl font-black text-slate-800 dark:text-white mb-6 uppercase tracking-tighter">Network Protocol</h4>
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5">
            <span className="font-bold text-slate-500 text-sm uppercase tracking-widest">Maintenance Mode</span>
            <div className="w-16 h-8 bg-slate-200 dark:bg-slate-700 rounded-full relative cursor-pointer opacity-50">
              <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-sm"></div>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5">
            <span className="font-bold text-slate-500 text-sm uppercase tracking-widest">System Version</span>
            <span className="font-black text-slate-900 dark:text-white">Arctic v2.4.0</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] rounded-[48px] border border-rose-100 dark:border-rose-900/20 shadow-2xl p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity text-rose-500"><Icons.Trash size={100} /></div>
          <h4 className="text-2xl font-black text-slate-800 dark:text-white mb-6 uppercase tracking-tighter">Danger Zone</h4>
          <p className="text-slate-500 text-sm font-medium mb-8">Irreversible actions that affect the entire global ledger.</p>
          <button
            onClick={() => {
              if (confirm("CRITICAL WARNING: This will wipe all local data nodes. Continue?")) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="w-full py-5 bg-rose-500 hover:bg-rose-400 text-white rounded-[24px] font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-500/20 transition-all active:scale-95"
          >
            Reset System Data
          </button>
        </div>
      </div>
    </div>
  );

  const content = () => {
    switch (activePage) {
      case 'dashboard': return renderOverview();
      case 'users': return renderStaffPortal();
      case 'inventory': return renderMedicineInventory();
      case 'settings': return renderSettings();
      case 'profile': return renderProfile();
      default: return renderOverview();
    }
  };

  return <div className="max-w-6xl mx-auto pb-32">{content()}</div>;
};

export default AdminDashboard;
