
import React, { useState, useRef, useEffect } from 'react';
import { Icons, MOCK_APPOINTMENTS, MOCK_BILLS, MOCK_RECORDS } from '@/constants';
import { GeminiService, MedicalAnalysisResult } from '@/services/geminiService';
import { Appointment, Billing, User, MedicalRecord, MedicationDetail } from '@/types';
import { db } from '../services/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { emailService } from '../services/emailService';

const DoctorDashboard: React.FC<{ activePage: string; user: User; onUserUpdate: (u: Partial<User>) => void }> = ({ activePage, user, onUserUpdate }) => {
    const [appointments, setAppointments] = useState<Appointment[]>(() => {
        const saved = localStorage.getItem('global_appointments');
        return saved ? JSON.parse(saved) : MOCK_APPOINTMENTS;
    });

    const [bills, setBills] = useState<Billing[]>(() => {
        const saved = localStorage.getItem('global_bills');
        return saved ? JSON.parse(saved) : MOCK_BILLS;
    });

    const [records, setRecords] = useState<MedicalRecord[]>(() => {
        const saved = localStorage.getItem('global_medical_records');
        return saved ? JSON.parse(saved) : MOCK_RECORDS;
    });

    const [showDiagnose, setShowDiagnose] = useState<string | null>(null);
    const [scanState, setScanState] = useState<'IDLE' | 'SCANNING' | 'RESULTS'>('IDLE');
    const [scanResult, setScanResult] = useState<MedicalAnalysisResult | null>(null);
    const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'deployed'>('idle');

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editForm, setEditForm] = useState<User>(user);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditForm(prev => ({ ...prev, avatar: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        localStorage.setItem('global_appointments', JSON.stringify(appointments));
        localStorage.setItem('global_bills', JSON.stringify(bills));
        localStorage.setItem('global_medical_records', JSON.stringify(records));
    }, [appointments, bills, records]);

    useEffect(() => {
        setEditForm(user);
    }, [user]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setScanState('SCANNING');

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = (reader.result as string).split(',')[1];
            try {
                const result = await GeminiService.getInstance().analyzeMedicalReport(base64, file.type);
                setScanResult(result);
                setScanState('RESULTS');
            } catch (err: any) {
                console.error("Analysis Failed", err);
                alert(`Neural Scan Failed: ${err.message || "Unknown Error"}. Please check console.`);
                setScanState('IDLE');
            }
        };
        reader.readAsDataURL(file);
    };

    const updateStatus = async (id: string, status: 'approved' | 'cancelled' | 'completed') => {
        // Optimistic UI update for appointments
        setAppointments(prev => {
            const targetApp = prev.find(a => a.id === id);
            if (!targetApp) return prev;
            let tokenNumber = targetApp.tokenNumber;

            if (status === 'approved' && !tokenNumber) {
                const approvedToday = prev.filter(a => a.date === targetApp.date && a.status === 'approved' && a.doctorId === user.id);
                tokenNumber = (approvedToday.length + 1);

                // Email Notification
                emailService.sendApptApproved('patient@example.com', targetApp.patientName, user.name, targetApp.time, targetApp.patientId)
                    .then(() => console.log("Email notification sent"))
                    .catch(err => console.error("Email failed", err));
            }

            if (status === 'completed' && scanResult) {
                const newBill: Billing = {
                    id: 'b' + Math.random().toString(36).substr(2, 5),
                    patientId: targetApp.patientId,
                    appointmentId: targetApp.id,
                    amount: 150.00,
                    date: new Date().toISOString().split('T')[0],
                    status: 'pending',
                    service: 'Clinical Consultation'
                };
                setBills(oldBills => [newBill, ...oldBills]);

                const newRecord: Omit<MedicalRecord, 'id'> = {
                    patientId: targetApp.patientId,
                    date: new Date().toISOString().split('T')[0],
                    diagnosis: "Clinical Assessment", // Default title
                    doctorName: user.name,
                    vitals: {
                        bp: scanResult.vitals["Blood Pressure"] || "N/A",
                        temp: scanResult.vitals["Temperature"] || "N/A",
                        weight: scanResult.vitals["Weight"] || "N/A"
                    },
                    treatmentSummary: scanResult.summary,
                    medications: scanResult.medications || [],
                    allergies: [],
                    prescriptionImage: '',
                    riskScore: scanResult.riskScore
                };

                // Save to Firestore
                try {
                    addDoc(collection(db, "records"), newRecord);
                } catch (e) {
                    console.error("Error adding document: ", e);
                }

                // Local state update
                setRecords(oldRecords => {
                    const updated = [{ ...newRecord, id: 'temp-' + Date.now() } as MedicalRecord, ...oldRecords];
                    localStorage.setItem('global_medical_records', JSON.stringify(updated));
                    return updated;
                });
            }
            return prev.map(a => a.id === id ? { ...a, status, tokenNumber } : a);
        });

        // Reset scanner state after completion
        if (status === 'completed') {
            setScanState('IDLE');
            setScanResult(null);
            setShowDiagnose(null);
        }
    };

    const handleDeploy = async () => {
        if (!showDiagnose) return;
        setDeployStatus('deploying');

        // Simulate network delay for "Deployment"
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Proceed with actual status update
        await updateStatus(showDiagnose, 'completed');

        setDeployStatus('deployed');

        // Close modal after showing success state
        setTimeout(() => {
            setDeployStatus('idle');
            setScanState('IDLE');
            setScanResult(null);
            setShowDiagnose(null);
        }, 1500);
    };

    const renderProfile = () => (
        <div className="animate-in fade-in duration-500 max-w-6xl mx-auto">
            <div className="bg-white dark:bg-[#020617] rounded-[56px] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/5 pb-16 backdrop-blur-2xl">
                <div className="h-64 bg-gradient-to-r from-[#2563eb] via-[#3b82f6] to-[#6366f1] relative"></div>
                <div className="px-10 md:px-16 -mt-24 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
                        <div className="flex flex-col md:flex-row md:items-end space-y-6 md:space-y-0 md:space-x-12">
                            <div className="w-56 h-56 rounded-[56px] bg-white dark:bg-[#020617] p-3 shadow-2xl border border-slate-200 dark:border-white/10 group overflow-hidden">
                                <div className="w-full h-full bg-slate-100 dark:bg-[#020617] rounded-[44px] flex items-center justify-center text-7xl text-slate-800 dark:text-white font-black uppercase shadow-inner shadow-cyan-500/20">
                                    {user.avatar ? (
                                        <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" />
                                    ) : (
                                        user.name.charAt(0)
                                    )}
                                </div>
                            </div>
                            <div className="pb-8">
                                <h3 className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter lowercase leading-none mb-3">{user.name}</h3>
                                <p className="text-[#22d3ee] font-black text-[11px] tracking-[0.4em] uppercase">{user.specialization || 'Clinical Specialist'}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsEditingProfile(true)}
                            className="bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/20 px-12 py-5 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_40px_-10px_rgba(34,211,238,0.3)] hover:bg-[#22d3ee] hover:text-[#020617]"
                        >
                            Modify Specialist Star
                        </button>
                    </div>
                </div>
            </div>
            {/* Edit Profile Modal */}
            {isEditingProfile && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 dark:bg-[#020617]/90 backdrop-blur-2xl animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#0f172a] rounded-[56px] w-full max-w-2xl p-12 border border-slate-200 dark:border-[#22d3ee]/20 shadow-2xl shadow-[#22d3ee]/10">
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-10 tracking-tighter">Update Star Identity</h3>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="col-span-2 flex justify-center mb-4">
                                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                                    <div className="w-28 h-28 rounded-[32px] bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-[#22d3ee]/50 flex items-center justify-center overflow-hidden transition-all group-hover:border-[#22d3ee]">
                                        {editForm.avatar ? <img src={editForm.avatar} className="w-full h-full object-cover" /> : <Icons.Users />}
                                    </div>
                                    <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                </div>
                            </div>
                            <div className="col-span-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Display Name</label>
                                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-slate-50 dark:bg-[#1e293b] text-slate-900 dark:text-white rounded-[22px] px-8 py-5 border border-slate-200 dark:border-white/5 font-bold focus:border-[#22d3ee] outline-none transition-all" />
                            </div>
                            <div className="col-span-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Specialization</label>
                                <input value={editForm.specialization} onChange={e => setEditForm({ ...editForm, specialization: e.target.value })} className="w-full bg-slate-50 dark:bg-[#1e293b] text-slate-900 dark:text-white rounded-[22px] px-8 py-5 border border-slate-200 dark:border-white/5 font-bold focus:border-[#22d3ee] outline-none transition-all" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Bio / Credentials</label>
                                <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} className="w-full bg-slate-50 dark:bg-[#1e293b] text-slate-900 dark:text-white rounded-[22px] px-8 py-5 border border-slate-200 dark:border-white/5 font-bold focus:border-[#22d3ee] outline-none transition-all h-28 resize-none" />
                            </div>
                            <div className="col-span-2">
                                <button onClick={() => { onUserUpdate(editForm); setIsEditingProfile(false); }} className="w-full py-5 bg-[#22d3ee] text-[#020617] rounded-[22px] font-black uppercase text-xs tracking-[0.2em] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] transition-all">Authorize Update</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderDashboardOverview = () => (
        <div className="space-y-12 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Active Syncs', value: appointments.filter(a => a.status === 'approved' && a.doctorId === user.id).length, icon: Icons.Users, color: 'text-[#22d3ee]' },
                    { label: 'Pending Slots', value: appointments.filter(a => a.status === 'pending' && a.doctorId === user.id).length, icon: Icons.Calendar, color: 'text-indigo-400' },
                    { label: 'Archived Cases', value: appointments.filter(a => a.status === 'completed' && a.doctorId === user.id).length, icon: Icons.CreditCard, color: 'text-emerald-400' },
                    { label: 'System Visibility', value: user.isAvailable ? 'Public' : 'Hidden', icon: Icons.Bot, color: 'text-rose-400' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white/80 dark:bg-[#0f172a]/50 p-10 rounded-[44px] border border-slate-200 dark:border-white/5 shadow-lg backdrop-blur-md transition-all hover:border-[#22d3ee]/30 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">{stat.label}</p>
                        <p className={`text-4xl font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-[#0f172a]/50 rounded-[56px] border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden backdrop-blur-md">
                <div className="px-12 py-8 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex justify-between items-center">
                    <h3 className="font-black text-2xl text-slate-900 dark:text-white uppercase tracking-tighter">Sync Requests</h3>
                    <span className="text-[10px] font-black text-[#22d3ee] uppercase tracking-widest animate-pulse">Protocol V2.0 Active</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {appointments.filter(a => a.status === 'pending' && a.doctorId === user.id).map(app => (
                        <div key={app.id} className="p-10 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                            <div className="flex items-center space-x-8">
                                <div className="w-16 h-16 rounded-[28px] bg-[#22d3ee]/10 flex items-center justify-center font-black text-[#22d3ee] text-2xl">{app.patientName.charAt(0)}</div>
                                <div><h4 className="font-black text-slate-900 dark:text-white text-2xl uppercase tracking-tighter">{app.patientName}</h4></div>
                            </div>
                            <div className="flex space-x-4">
                                <button onClick={() => updateStatus(app.id, 'approved')} className="bg-[#22d3ee] text-[#020617] px-8 py-4 rounded-[22px] text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:scale-105 transition-all">Authorize</button>
                            </div>
                        </div>
                    ))}
                    {appointments.filter(a => a.status === 'pending' && a.doctorId === user.id).length === 0 && (
                        <div className="p-24 text-center text-slate-500 font-black uppercase tracking-widest italic text-sm">No pending star synchronization requests.</div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderPatientTable = (filterStatus: 'approved' | 'completed') => {
        const list = appointments.filter(a => a.status === filterStatus && a.doctorId === user.id);
        return (
            <div className="bg-white dark:bg-[#0f172a] rounded-[48px] border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden animate-in fade-in">
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {list.map(app => (
                        <div key={app.id} className="flex justify-between items-center p-10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <span className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{app.patientName}</span>
                            {filterStatus === 'approved' ? (
                                <button onClick={() => { setShowDiagnose(app.id); setScanState('IDLE'); setScanResult(null); }} className="px-8 py-3 rounded-[18px] border border-[#22d3ee]/30 text-[#22d3ee] text-[10px] font-black uppercase tracking-widest hover:bg-[#22d3ee] hover:text-[#020617] transition-all shadow-[0_0_15px_rgba(34,211,238,0.1)]">Initiate Neural Scan</button>
                            ) : (
                                <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Archived</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderMyPatients = () => {
        const myAppointments = appointments.filter(a => a.doctorId === user.id && (a.status === 'completed' || a.status === 'approved'));
        const patientMap = new Map();
        myAppointments.forEach(app => {
            if (!patientMap.has(app.patientId)) {
                patientMap.set(app.patientId, {
                    id: app.patientId,
                    name: app.patientName,
                    lastVisit: app.date,
                    visitCount: 1,
                    status: app.status
                });
            } else {
                const p = patientMap.get(app.patientId);
                p.visitCount += 1;
                if (new Date(app.date) > new Date(p.lastVisit)) {
                    p.lastVisit = app.date;
                    p.status = app.status;
                }
            }
        });

        const myPatients = Array.from(patientMap.values());

        return (
            <div className="space-y-8 animate-in fade-in">
                <h3 className="text-4xl font-black tracking-tighter ml-4 text-slate-900 dark:text-white">My Patient Registry</h3>
                <div className="bg-white dark:bg-[#0f172a] rounded-[48px] border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden">
                    {myPatients.length === 0 ? (
                        <div className="p-24 text-center text-slate-500 font-black uppercase tracking-widest italic text-sm">
                            No patients assigned to your protocol yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                            {myPatients.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <div className="flex items-center space-x-6">
                                        <div className="w-12 h-12 rounded-full bg-[#22d3ee]/10 flex items-center justify-center text-[#22d3ee] font-black text-lg">
                                            {p.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{p.name}</div>
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                                Last Visit: {p.lastVisit} • {p.visitCount} Consultations
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border ${p.status === 'approved' ? 'bg-[#22d3ee]/10 text-[#22d3ee] border-[#22d3ee]/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                        {p.status === 'approved' ? 'Active' : 'Archived'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderScanner = () => (
        <div className="animate-in fade-in duration-700 w-full max-w-5xl mx-auto">
            {scanState === 'IDLE' && (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative h-96 rounded-[44px] border-2 border-dashed border-[#22d3ee]/30 bg-[#22d3ee]/5 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-[#22d3ee] force-field"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#22d3ee]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="w-24 h-24 rounded-full bg-[#020617] border border-[#22d3ee] flex items-center justify-center mb-10 shadow-[0_0_30px_rgba(34,211,238,0.4)] group-hover:scale-110 transition-transform duration-500">
                        <Icons.FileText className="text-[#22d3ee] w-10 h-10" />
                    </div>
                    <h4 className="text-3xl font-black text-white tracking-tight mb-4 neon-text-cyan">Initialize Data Dump</h4>
                    <p className="text-[#22d3ee] font-bold text-sm tracking-widest uppercase">Drag & Drop Clinical PDF / Text</p>
                    <input ref={fileInputRef} type="file" className="hidden" accept=".txt,.json,.pdf,.png,.jpg,.jpeg" onChange={handleFileUpload} />
                </div>
            )}

            {scanState === 'SCANNING' && (
                <div className="min-h-[500px] rounded-[40px] bg-black/40 border border-[#22d3ee]/20 relative overflow-hidden flex flex-col items-center justify-center">
                    {/* Neural Grid Animation */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [perspective:1000px] [transform:rotateX(60deg)] origin-top opacity-30 animate-pulse"></div>
                    <div className="relative z-10 text-center">
                        <div className="text-6xl font-black text-white tracking-tighter mb-4 animate-pulse">ANALYZING</div>
                        <p className="text-[#22d3ee] font-black uppercase tracking-[0.5em] text-xs">Decrypting Fine Print...</p>
                    </div>
                </div>
            )}

            {scanState === 'RESULTS' && scanResult && (
                <div className="space-y-8 animate-in slide-in-from-bottom-12 duration-700">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Risk Gauge */}
                        <div className="bg-slate-900/50 lg:col-span-1 rounded-[40px] p-10 flex flex-col items-center justify-center relative overflow-hidden border border-white/10">
                            <div className="relative w-48 h-48 mb-6">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="96" cy="96" r="88" className="stroke-slate-800" strokeWidth="12" fill="none" />
                                    <circle
                                        cx="96" cy="96" r="88"
                                        className={`stroke-current ${scanResult.riskLevel === 'CRITICAL' || scanResult.riskLevel === 'HIGH' ? 'text-rose-500' : scanResult.riskLevel === 'MODERATE' ? 'text-amber-400' : 'text-emerald-400'}`}
                                        strokeWidth="12"
                                        fill="none"
                                        strokeDasharray="553"
                                        strokeDashoffset={553 - (553 * scanResult.riskScore / 100)}
                                        strokeLinecap="round"
                                        style={{ transition: 'all 2s ease-out' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-5xl font-black text-white tracking-tighter">{scanResult.riskScore}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Risk Index</span>
                                </div>
                            </div>
                        </div>

                        {/* Vitals */}
                        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                            {Object.entries(scanResult.vitals).map(([key, value], i) => (
                                <div key={key} className="bg-slate-900/50 p-8 rounded-[32px] border border-white/5 hover:border-[#22d3ee]/30 transition-all hover:-translate-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                    <p className="text-2xl md:text-3xl font-black text-white tracking-tight">{value}</p>
                                </div>
                            ))}
                            <div className="col-span-2 bg-slate-900/50 p-8 rounded-[32px] border border-white/5">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Executive Summary</p>
                                <p className="text-slate-200 font-medium leading-relaxed">{scanResult.summary}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 p-10 rounded-[40px] border border-white/10">
                        <h4 className="text-sm font-black uppercase text-[#22d3ee] tracking-widest mb-6">Key Findings Extracted</h4>
                        <ul className="space-y-4">
                            {scanResult.keyFindings.map((finding, i) => (
                                <li key={i} className="flex items-start space-x-4 text-slate-300">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#22d3ee] shrink-0"></span>
                                    <span>{finding}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button
                        onClick={handleDeploy}
                        disabled={deployStatus !== 'idle'}
                        className={`w-full py-6 rounded-[24px] font-black uppercase text-sm tracking-[0.2em] transition-all shadow-lg ${deployStatus === 'deployed'
                            ? 'bg-emerald-500 text-white shadow-emerald-500/40'
                            : deployStatus === 'deploying'
                                ? 'bg-slate-700 text-slate-300 cursor-wait'
                                : 'bg-gradient-to-r from-[#2563eb] to-[#22d3ee] text-white shadow-[0_0_40px_rgba(34,211,238,0.4)] hover:shadow-[0_0_60px_rgba(34,211,238,0.6)]'
                            }`}
                    >
                        {deployStatus === 'idle' && 'Deploy Clinical Ledger'}
                        {deployStatus === 'deploying' && 'Deploying Protocol...'}
                        {deployStatus === 'deployed' && 'Deployment Successful'}
                    </button>
                </div>
            )}
        </div>
    );

    const renderAntigravityModal = () => (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-2xl animate-in fade-in duration-500">
            <div className="antigravity-glass rounded-[56px] w-full max-w-5xl p-16 shadow-[0_0_60px_-10px_rgba(34,211,238,0.15)] relative overflow-hidden h-5/6 overflow-y-auto custom-scrollbar">
                {/* Floating Header */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#22d3ee] to-transparent opacity-50"></div>

                <div className="flex justify-between items-start mb-16 relative z-10">
                    <div>
                        <h3 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-2">Clinical Protocol</h3>
                        <p className="text-[#a855f7] font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Antigravity Neural Link Active</p>
                    </div>
                    <button onClick={() => { setShowDiagnose(null); setScanState('IDLE'); }} className="p-4 rounded-full border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-[#22d3ee] transition-all hover:rotate-90">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Use the new scanner inside the modal */}
                {renderScanner()}
            </div>
        </div>
    );

    const content = () => {
        switch (activePage) {
            case 'appointments': return renderDashboardOverview();
            case 'reports': return <div className="space-y-8 animate-in fade-in"><h3 className="text-4xl font-black tracking-tighter ml-4 text-slate-900 dark:text-white">Historical Archive</h3>{renderPatientTable('completed')}</div>;
            case 'patients': return renderMyPatients();
            case 'profile': return renderProfile();
            default: return renderDashboardOverview();
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-32">
            {content()}
            {activePage === 'appointments' && (
                <div className="mt-16 animate-in slide-in-from-bottom-6">
                    <h3 className="text-4xl font-black tracking-tighter ml-4 mb-8 text-slate-900 dark:text-white">Current Synchronization Queue</h3>
                    {renderPatientTable('approved')}
                </div>
            )}
            {showDiagnose && renderAntigravityModal()}
        </div>
    );
};

export default DoctorDashboard;
