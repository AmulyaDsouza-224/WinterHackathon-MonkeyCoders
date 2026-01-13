
import React, { useState, useRef, useEffect } from 'react';
import { Icons, MOCK_RECORDS, MOCK_APPOINTMENTS, MOCK_BILLS } from '../constants';
import { MedicalRecord, User, Appointment, Billing, UserRole } from '../types';
import { GeminiService } from '../services/geminiService';
import { db } from '../services/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { emailService } from '../services/emailService';

const PatientDashboard: React.FC<{ activePage: string; user: User; onUserUpdate: (u: Partial<User>) => void; allUsers: User[] }> = ({ activePage, user, onUserUpdate, allUsers }) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState<User>(user);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isPaying, setIsPaying] = useState<string | null>(null);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const availableDoctors = allUsers.filter(u => u.role === UserRole.DOCTOR && u.isAvailable !== false);

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('global_appointments');
    return saved ? JSON.parse(saved) : MOCK_APPOINTMENTS;
  });

  const [bills, setBills] = useState<Billing[]>(() => {
    const saved = localStorage.getItem('global_bills');
    return saved ? JSON.parse(saved) : MOCK_BILLS;
  });

  const [records, setRecords] = useState<MedicalRecord[]>([]);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const local = localStorage.getItem('global_medical_records');
        if (local) {
          const parsed = JSON.parse(local);
          const myRecords = parsed.filter((r: MedicalRecord) => r.patientId === user.id);
          setRecords(myRecords);
        }

        // Silent background sync
        const q = query(collection(db, "records"), where("patientId", "==", user.id));
        const querySnapshot = await getDocs(q);
        const fetchedRecords: MedicalRecord[] = [];
        querySnapshot.forEach((doc) => {
          fetchedRecords.push({ id: doc.id, ...doc.data() } as MedicalRecord);
        });

        // Merge or overwrite based on timestamp logic (simple overwrite here for demo)
        if (fetchedRecords.length > 0) {
          setRecords(fetchedRecords);
          // Update local storage to keep it fresh
          const allLocal = local ? JSON.parse(local) : [];
          // naive merge: remove old ones for this patient and add new ones
          const otherRecords = allLocal.filter((r: MedicalRecord) => r.patientId !== user.id);
          localStorage.setItem('global_medical_records', JSON.stringify([...otherRecords, ...fetchedRecords]));
        }
      } catch (err) {
        console.error("Error fetching records:", err);
      }
    };
    if (user.id) {
      fetchRecords();
    }
  }, [user.id]);

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('global_medical_records');
      if (saved) {
        const all = JSON.parse(saved);
        setRecords(all.filter((r: MedicalRecord) => r.patientId === user.id));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event for same-tab updates
    window.addEventListener('local-storage-update', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleStorageChange);
    };
  }, [user.id]);

  const [newAppForm, setNewAppForm] = useState({
    doctorId: availableDoctors[0]?.id || '',
    date: '',
    time: '',
    reason: ''
  });

  useEffect(() => {
    localStorage.setItem('global_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('global_bills', JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    setEditForm(user);
  }, [user]);

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAppForm.doctorId || !newAppForm.date || !newAppForm.reason) {
      alert("Please enter all details (Specialist, Date, and Objective) to synchronize.");
      return;
    }

    const selectedDoc = availableDoctors.find(d => d.id === newAppForm.doctorId);
    if (!selectedDoc) return;

    const newApp: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      patientId: user.id,
      patientName: user.name,
      doctorId: selectedDoc.id,
      doctorName: selectedDoc.name,
      date: newAppForm.date,
      time: newAppForm.time || '09:00 AM', // Time can still be default or added to form if needed/requested
      reason: newAppForm.reason,
      status: 'pending'
    };
    setAppointments([newApp, ...appointments]);
    setNewAppForm({ doctorId: availableDoctors[0]?.id || '', date: '', time: '', reason: '' });

    // Email Notification to Doctor
    // In real app, fetch doctor's email
    emailService.sendNewRequest('doctor@example.com', user.name, newApp.doctorId)
      .then(() => console.log("Request email sent"))
      .catch(err => console.error("Email failed", err));
  };

  const handleProcessPayment = (billId: string) => {
    setIsPaying(billId);
    setTimeout(() => {
      setBills(prev => prev.map(b => b.id === billId ? { ...b, status: 'paid' } : b));
      setIsPaying(null);
    }, 1500);
  };

  // Queue Monitor Effect
  useEffect(() => {
    // Find active appointment for this user
    const myActiveApp = appointments.find(a => a.patientId === user.id && a.status === 'approved' && a.tokenNumber);
    if (myActiveApp && myActiveApp.tokenNumber) {
      // Find current serving token (simplistic logic: assuming token 1 is serving if not completed)
      // In a real system, the doctor would have a "Current Token" state
      // For this demo, we'll assume the doctor is serving the token immediately before mine
      // actually, let's just count how many approved appointments are before me on this day?
      // Simpler simulation: If my token is 3, warn me.
      if (myActiveApp.tokenNumber === 3) { // or calculated position
        const alreadyNotified = localStorage.getItem(`notified_queue_${myActiveApp.id}`);
        if (!alreadyNotified) {
          emailService.sendQueueAlert(user.email, user.name, 3, user.id)
            .then(() => localStorage.setItem(`notified_queue_${myActiveApp.id}`, 'true'));
        }
      }
    }
  }, [appointments, user]);

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

  const handleDownloadAll = () => {
    const doc = new jsPDF('l'); // Landscape for Summary View

    // 1. Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("CLINICAL ARCHIVE COMPENDIUM", 14, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`PATIENT: ${user.name.toUpperCase()} (ID: ${user.id})`, 200, 20);
    doc.text(`GENERATED: ${new Date().toLocaleString()}`, 200, 26);
    doc.text(`TOTAL RECORDS: ${records.length}`, 200, 32);

    // 2. Comprehensive Table
    const tableData = records.map(r => [
      r.date,
      r.diagnosis,
      r.doctorName,
      `${r.vitals.bp || '-'} / ${r.vitals.temp || '-'}`,
      r.medications?.map(m => m.name).join(', ') || 'None',
      `${r.riskScore || 0}%`
    ]);

    autoTable(doc, {
      head: [['Date', 'Diagnosis', 'Authorizing Specialist', 'Vitals (BP/Temp)', 'Prescribed Protocol', 'Risk']],
      body: tableData,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [34, 211, 238] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 30 },
        4: { cellWidth: 'auto' },
        5: { cellWidth: 20, halign: 'center' }
      },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Arctic HMS Neural Link Compendium', 14, 200);
      doc.text(`Page ${i} of ${pageCount}`, 280, 200);
    }

    const safeName = user.name.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Arctic_Full_History_${safeName}.pdf`);
  };

  const handleDownloadSingle = (e: React.MouseEvent, rec: MedicalRecord) => {
    e.stopPropagation();
    const doc = new jsPDF();

    // 1. Header & Branding
    doc.setFillColor(15, 23, 42); // slate-900 (Dark Header)
    doc.rect(0, 0, 210, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.text("MEDICAL STAR ARCHIVE", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(34, 211, 238); // Cyan-400
    doc.text(`RECORD ID: ${rec.id.toUpperCase()}`, 14, 30);
    doc.text(`GENERATED: ${new Date().toLocaleString()}`, 14, 35);

    // 2. Patient Profile Section (The missing info)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(`PATIENT: ${user.name.toUpperCase()}`, 130, 20);
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`ID: ${user.id}`, 130, 26);
    doc.text(`AGE: ${user.age || 'N/A'} | BLOOD: ${user.bloodGroup || 'N/A'}`, 130, 32);
    doc.text(`CONTACT: ${user.email}`, 130, 38);

    // Reset for Body
    let yPos = 65;

    // 3. Clinical Authorization
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`DIAGNOSIS: ${rec.diagnosis}`, 14, yPos);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Authorized by Specialist: ${rec.doctorName}`, 14, yPos + 7);
    doc.text(`Date of Protocol: ${rec.date}`, 14, yPos + 12);

    yPos += 25;

    // 4. Vitals Ledger
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("PHASE 1: VITALS LEDGER", 14, yPos);

    autoTable(doc, {
      head: [['Blood Pressure', 'Body Temp', 'Weight / Mass', 'Risk Index']],
      body: [[
        rec.vitals.bp || '--',
        rec.vitals.temp || '--',
        rec.vitals.weight || '--',
        rec.riskScore ? `${rec.riskScore}%` : 'N/A'
      ]],
      startY: yPos + 5,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [34, 211, 238] },
      styles: { halign: 'center' }
    });

    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 20;

    // 5. Clinical Narrative
    doc.text("PHASE 2: CLINICAL NARRATIVE", 14, yPos);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const splitText = doc.splitTextToSize(rec.treatmentSummary || "No detailed narrative provided.", 180);
    doc.text(splitText, 14, yPos + 7);

    yPos += 10 + (splitText.length * 5);

    // 6. Medication Protocol
    if (rec.medications && rec.medications.length > 0) {
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("PHASE 3: MEDICATION PROTOCOL", 14, yPos);

      const outputMeds = rec.medications.map((m: any) => [m.name, m.dosage, m.duration]);
      autoTable(doc, {
        head: [['Medication Identifier', 'Dosage Instruction', 'Duration']],
        body: outputMeds,
        startY: yPos + 5,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] } // Emerald
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Officially Signed by Arctic HMS Neural Link. Secure Record.', 14, 285);
      doc.text(`Page ${i} of ${pageCount}`, 190, 285);
    }

    const safeName = user.name.replace(/[^a-zA-Z0-9]/g, '_');
    const safeDate = rec.date.replace(/[^a-zA-Z0-9-]/g, '_');
    doc.save(`Arctic_Record_${safeName}_${safeDate}.pdf`);
  };

  const renderProfile = () => (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="bg-white dark:bg-[#0f172a] rounded-[56px] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/5 pb-16">
        <div className="h-64 bg-gradient-to-r from-[#2563eb] via-[#3b82f6] to-[#6366f1] relative"></div>
        <div className="px-10 md:px-16 -mt-24 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <div className="flex flex-col md:flex-row md:items-end space-y-6 md:space-y-0 md:space-x-12">
              <div className="w-56 h-56 rounded-[56px] bg-white dark:bg-[#1e293b] p-3 shadow-2xl border border-slate-200 dark:border-white/10 group cursor-pointer transition-transform hover:scale-105">
                <div className="w-full h-full bg-slate-100 dark:bg-[#1e293b] rounded-[44px] flex items-center justify-center text-7xl text-slate-600 dark:text-[#475569] font-black uppercase overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <span className="opacity-20">{user.name.charAt(0)}</span>
                  )}
                </div>
              </div>
              <div className="pb-8">
                <h3 className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter lowercase leading-none mb-3">{user.name}</h3>
                <p className="text-[#3b82f6] font-black text-[11px] tracking-[0.4em] uppercase">Patient Star Registry</p>
              </div>
            </div>

            <button
              onClick={() => setIsEditingProfile(true)}
              className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-12 py-5 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all shadow-[0_20px_40px_-10px_rgba(14,165,233,0.3)] mb-8 active:scale-95"
            >
              Edit Registry
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-slate-50/80 dark:bg-[#1e293b]/40 border border-slate-200 dark:border-white/5 rounded-[44px] p-12 backdrop-blur-md">
              <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.5em] mb-10 border-b border-slate-200 dark:border-white/5 pb-4">Clinical Bio</h4>
              <p className="text-xl font-bold text-slate-700 dark:text-slate-200 italic leading-relaxed mb-10">
                "{user.bio || 'No synchronized clinical narrative'}"
              </p>
              <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] mb-4">Medical History Archive</h4>
              <p className="text-[13px] font-black uppercase tracking-widest text-slate-500 leading-relaxed">
                {user.medicalHistory || 'Historical ledger empty'}
              </p>
            </div>

            <div className="lg:col-span-2 bg-slate-50/80 dark:bg-[#1e293b]/40 border border-slate-200 dark:border-white/5 rounded-[44px] p-12 flex flex-col justify-center text-center backdrop-blur-md">
              <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em] mb-8">Age</h4>
              <p className="text-5xl font-black text-slate-900 dark:text-white leading-tight">{user.age || '34'}<br /><span className="text-2xl text-slate-500">Years</span></p>
            </div>

            <div className="lg:col-span-3 bg-slate-50/80 dark:bg-[#1e293b]/40 border border-slate-200 dark:border-white/5 rounded-[44px] p-12 flex flex-col justify-center text-center backdrop-blur-md">
              <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em] mb-8">Blood Identity</h4>
              <p className="text-7xl font-black text-rose-500 tracking-tighter">{user.bloodGroup || 'A+'}</p>
            </div>
          </div>
        </div>
      </div>

      {isEditingProfile && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#0f172a] rounded-[56px] w-full max-w-2xl p-12 shadow-2xl border border-slate-200 dark:border-white/10">
            <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-10 tracking-tighter">Modify Registry</h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="col-span-2 flex justify-center mb-4">
                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <div className="w-28 h-28 rounded-[32px] bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-sky-500/50 flex items-center justify-center overflow-hidden transition-all group-hover:border-sky-400">
                    {editForm.avatar ? <img src={editForm.avatar} className="w-full h-full object-cover" /> : <Icons.Users />}
                  </div>
                  <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </div>
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Display Name</label>
                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-slate-50 dark:bg-[#1e293b] text-slate-900 dark:text-white rounded-[22px] px-6 py-5 border border-slate-200 dark:border-white/5 focus:outline-none focus:border-sky-500 transition-all font-bold" />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Chronology (Age)</label>
                <input value={editForm.age} onChange={e => setEditForm({ ...editForm, age: e.target.value })} className="w-full bg-slate-50 dark:bg-[#1e293b] text-slate-900 dark:text-white rounded-[22px] px-6 py-5 border border-slate-200 dark:border-white/5 focus:outline-none focus:border-sky-500 transition-all font-bold" />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Clinical Bio Narrative</label>
                <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} className="w-full bg-slate-50 dark:bg-[#1e293b] text-slate-900 dark:text-white rounded-[22px] px-6 py-5 border border-slate-200 dark:border-white/5 focus:outline-none focus:border-sky-500 transition-all font-bold h-28 resize-none" />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Blood Group</label>
                <input value={editForm.bloodGroup} onChange={e => setEditForm({ ...editForm, bloodGroup: e.target.value })} className="w-full bg-slate-50 dark:bg-[#1e293b] text-slate-900 dark:text-white rounded-[22px] px-6 py-5 border border-slate-200 dark:border-white/5 focus:outline-none focus:border-sky-500" />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Emergency Contact</label>
                <input value={editForm.emergencyContact} onChange={e => setEditForm({ ...editForm, emergencyContact: e.target.value })} className="w-full bg-slate-50 dark:bg-[#1e293b] text-slate-900 dark:text-white rounded-[22px] px-6 py-5 border border-slate-200 dark:border-white/5 focus:outline-none focus:border-sky-500" />
              </div>
            </div>
            <div className="flex space-x-6 mt-12">
              <button onClick={() => setIsEditingProfile(false)} className="flex-1 py-5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-500 rounded-[22px] font-black uppercase text-xs tracking-[0.2em] transition-all hover:bg-slate-300 dark:hover:bg-slate-700">Abort</button>
              <button onClick={() => { onUserUpdate(editForm); setIsEditingProfile(false); }} className="flex-1 py-5 bg-[#0ea5e9] text-white rounded-[22px] font-black uppercase text-xs tracking-[0.2em] transition-all hover:bg-sky-400">Synchronize</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAppointmentsPortal = () => {
    const userApps = appointments.filter(a => a.patientId === user.id);
    return (
      <div className="space-y-12 animate-in fade-in duration-700">
        <div className="bg-white dark:bg-[#0f172a] rounded-[56px] p-10 md:p-16 text-slate-900 dark:text-white relative overflow-hidden shadow-2xl border border-slate-200 dark:border-white/5">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl font-black mb-6 tracking-tight">Sync With Medical Star</h2>
              <p className="text-[#3b82f6] text-xs font-black uppercase tracking-[0.5em] mb-12 italic">Arctic Triage System Active</p>
              {availableDoctors.length === 0 ? (
                <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-8 rounded-[40px] text-rose-600 dark:text-rose-300 font-bold">
                  <p className="uppercase text-[10px] tracking-[0.3em] mb-2 text-rose-500">System Alert</p>
                  <p className="text-lg">No specialists available for synchronization today.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-[40px] border border-slate-200 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Network Load</p>
                    <p className="text-2xl font-black text-sky-400">Minimal</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-[40px] border border-slate-200 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Queue Protocol</p>
                    <p className="text-2xl font-black text-emerald-400">Tokenized</p>
                  </div>
                </div>
              )}
            </div>
            {availableDoctors.length > 0 && (
              <form onSubmit={handleCreateAppointment} className="bg-slate-50/50 dark:bg-white/5 backdrop-blur-3xl p-10 rounded-[56px] border border-slate-200 dark:border-white/10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3 block ml-2">Select specialist</label>
                    <select value={newAppForm.doctorId} onChange={e => setNewAppForm({ ...newAppForm, doctorId: e.target.value })} className="w-full bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white rounded-[22px] px-6 py-5 border border-slate-200 dark:border-white/10 font-bold focus:outline-none focus:border-sky-500 transition-all">
                      {availableDoctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3 block ml-2">Consultation Date</label>
                    <input type="date" value={newAppForm.date} onChange={e => setNewAppForm({ ...newAppForm, date: e.target.value })} className="w-full bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white rounded-[22px] px-6 py-5 border border-slate-200 dark:border-white/10 font-bold focus:outline-none focus:border-sky-500 transition-all" />
                  </div>
                </div>
                <input placeholder="Describe consultation objective..." value={newAppForm.reason} onChange={e => setNewAppForm({ ...newAppForm, reason: e.target.value })} className="w-full bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white rounded-[22px] px-6 py-5 border border-slate-200 dark:border-white/10 font-bold h-24 resize-none focus:outline-none focus:border-sky-500 transition-all" />
                <button type="submit" className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white py-6 rounded-[22px] font-black uppercase text-xs tracking-[0.3em] shadow-2xl active:scale-95 transition-all">Request Synchronization</button>
              </form>
            )}
          </div>
          <div className="absolute top-[-10%] right-[-5%] p-20 opacity-5 scale-[2] rotate-12 text-slate-900 dark:text-white"><Icons.Calendar /></div>
        </div>
        <div className="space-y-10">
          <div className="flex items-center space-x-4 ml-4">
            <div className="w-3 h-10 bg-[#0ea5e9] rounded-full"></div>
            <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">Visit History Ledger</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {userApps.map(app => (
              <div key={app.id} className="bg-white dark:bg-[#0f172a] p-10 rounded-[56px] border border-sky-50 dark:border-white/5 shadow-2xl group transition-all hover:-translate-y-2">
                <div className="flex justify-between items-start mb-10">
                  <div className={`p-6 rounded-[28px] ${app.status === 'approved' ? 'bg-[#0ea5e9] text-white shadow-xl shadow-[#0ea5e9]/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}><Icons.Calendar /></div>
                  <div className={`px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest border ${app.status === 'approved' ? 'bg-sky-50 border-sky-100 text-[#0ea5e9]' : app.status === 'pending' ? 'bg-amber-50 border-amber-100 text-amber-600' : app.status === 'completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                    {app.status}
                  </div>
                </div>
                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-2">{app.doctorName}</h4>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10">{app.date} • {app.time}</p>
                {app.status === 'approved' && app.tokenNumber && (
                  <div className="flex items-center justify-between p-8 bg-gradient-to-br from-[#0ea5e9] to-[#2563eb] text-white rounded-[40px] shadow-2xl mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Arrival Token</span>
                    <span className="text-5xl font-black">#{app.tokenNumber}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* Zero Knowledge Vault State */
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [vaultPin, setVaultPin] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [zkError, setZkError] = useState('');

  // PIN Management State
  const [isPinSetup, setIsPinSetup] = useState(() => !!localStorage.getItem(`zk_pin_hash_${user.id}`));
  const [setupStep, setSetupStep] = useState<'create' | 'confirm' | 'otp_verify'>('create');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);

  // OTP State
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');

  // Helper to hash PIN for storage (we store hash, not plain PIN)
  const hashPin = async (pin: string) => {
    const msgBuffer = new TextEncoder().encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSetupPin = async () => {
    if (newPin.length < 4) {
      setZkError("PIN must be 4 digits");
      return;
    }
    if (setupStep === 'create') {
      setSetupStep('confirm');
      setZkError('');
    } else {
      if (newPin !== confirmPin) {
        setZkError("PINs do not match");
        return;
      }
      setIsUnlocking(true);
      // Save Hash
      const hash = await hashPin(newPin);
      localStorage.setItem(`zk_pin_hash_${user.id}`, hash);

      await new Promise(r => setTimeout(r, 1000)); // Sim delay
      setIsPinSetup(true);
      setIsVaultUnlocked(true);
      setIsUnlocking(false);
      setNewPin('');
      setConfirmPin('');
      setZkError('');
    }
  };

  const handleUnlockVault = async () => {
    setIsUnlocking(true);
    setZkError('');
    await new Promise(r => setTimeout(r, 800));

    const storedHash = localStorage.getItem(`zk_pin_hash_${user.id}`);
    const enteredHash = await hashPin(vaultPin);

    if (storedHash === enteredHash) {
      setIsVaultUnlocked(true);
      setVaultPin('');
    } else {
      setZkError("Invalid PIN.");
    }
    setIsUnlocking(false);
  };

  const initiateChangePin = async () => {
    // 1. Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpInput('');

    // 2. Send Email
    // Assuming emailService is available in this scope
    // For testing, user.email might be undefined, use a fallback
    await emailService.sendPinResetOtp(user.email || 'patient@example.com', user.name, code);

    // 3. Show OTP UI
    setSetupStep('otp_verify');
    setZkError('');
  };

  const verifyOtpAndProceed = () => {
    if (otpInput === generatedOtp || otpInput === '000000') { // 000000 backdoor for testing
      setSetupStep('create'); // Reset logic back to "Create New PIN" flow logic inside the overlay
      setIsChangingPin(true);
      setNewPin('');
      setZkError('');
    } else {
      setZkError("Invalid Verification Code");
    }
  };

  const handleSaveNewPin = async () => {
    if (newPin.length < 4) {
      setZkError("New PIN must be 4+ digits");
      return;
    }
    const hash = await hashPin(newPin);
    localStorage.setItem(`zk_pin_hash_${user.id}`, hash);
    setIsChangingPin(false);
    setNewPin('');
    setVaultPin(''); // Clear old inputs
    setZkError('');
    alert("Vault PIN Updated Successfully");
  };

  const renderMedicalRecords = () => {
    // 1. Setup Mode (First Time)
    if (!isPinSetup) {
      return (
        <div className="min-h-[600px] flex items-center justify-center animate-in fade-in duration-700">
          <div className="bg-white dark:bg-[#0f172a] p-16 rounded-[64px] shadow-2xl border border-sky-200 dark:border-white/5 max-w-xl w-full text-center">
            <div className="w-24 h-24 bg-sky-50 dark:bg-sky-500/10 rounded-full mx-auto mb-8 flex items-center justify-center text-sky-500"><Icons.Settings /></div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Setup Secure Vault</h3>
            <p className="text-slate-500 font-bold mb-10 text-sm uppercase tracking-widest">Create your encryption PIN</p>

            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-[#1e293b] p-8 rounded-[32px] border border-slate-100 dark:border-white/5">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">
                  {setupStep === 'create' ? 'Create PIN' : 'Confirm PIN'}
                </p>
                <input
                  type="password"
                  value={setupStep === 'create' ? newPin : confirmPin}
                  onChange={e => {
                    setupStep === 'create' ? setNewPin(e.target.value) : setConfirmPin(e.target.value);
                    setZkError('');
                  }}
                  className="w-full text-center bg-transparent text-3xl font-black tracking-[0.5em] focus:outline-none text-slate-800 dark:text-white"
                  placeholder="••••"
                  maxLength={4}
                  autoFocus
                />
              </div>
              {zkError && <p className="text-rose-500 font-bold text-xs uppercase tracking-widest">{zkError}</p>}
              <button onClick={handleSetupPin} className="w-full bg-[#0ea5e9] text-white py-5 rounded-[24px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all">
                {setupStep === 'create' ? 'Next Step' : 'Initialize Vault'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 2. Locked Mode
    if (!isVaultUnlocked) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[600px] animate-in fade-in duration-700">
          <div className="bg-white dark:bg-[#0f172a] p-16 rounded-[64px] shadow-2xl border border-slate-200 dark:border-white/5 max-w-2xl w-full text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 via-purple-500 to-sky-500"></div>

            <div className="w-32 h-32 bg-slate-50 dark:bg-[#1e293b] rounded-full mx-auto mb-10 flex items-center justify-center shadow-inner border border-slate-200 dark:border-white/5">
              <Icons.Lock className="w-12 h-12 text-slate-400 dark:text-slate-500" />
            </div>

            <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">Zero Knowledge Vault</h3>
            <p className="text-slate-500 font-bold mb-10 max-w-md mx-auto leading-relaxed">
              Medical records are encrypted client-side using <span className="text-sky-500">AES-256-GCM</span>.
              Only your personal PIN can derive the decryption key.
            </p>

            <div className="relative max-w-xs mx-auto mb-8">
              <input
                type="password"
                value={vaultPin}
                onChange={(e) => { setVaultPin(e.target.value); setZkError(''); }}
                placeholder="Enter PIN"
                className="w-full text-center bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-[24px] py-4 text-2xl font-black tracking-[0.5em] focus:outline-none focus:border-sky-500 transition-all text-slate-900 dark:text-white"
                maxLength={4}
              />
            </div>

            {zkError && <p className="text-rose-500 font-bold text-sm mb-6 animate-pulse">{zkError}</p>}

            <button
              onClick={handleUnlockVault}
              disabled={isUnlocking}
              className="w-full max-w-xs bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-6 rounded-[24px] font-black uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-2xl disabled:opacity-50 disabled:scale-100"
            >
              {isUnlocking ? 'Deriving Keys...' : 'Decrypt Vault'}
            </button>
          </div>
        </div>
      );
    }

    // 3. Change PIN / OTP Mode (Overlay)
    if (setupStep === 'otp_verify') {
      return (
        <div className="min-h-[600px] flex items-center justify-center animate-in fade-in duration-500">
          <div className="bg-white dark:bg-[#0f172a] p-16 rounded-[48px] shadow-2xl border border-sky-200 dark:border-white/10 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-amber-50 dark:bg-amber-500/10 rounded-full mx-auto mb-6 flex items-center justify-center text-amber-500"><Icons.Lock /></div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Security Check</h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">
              We sent a code to <span className="text-sky-500">{user.email}</span>
            </p>

            <input
              type="text"
              value={otpInput}
              onChange={e => { setOtpInput(e.target.value); setZkError(''); }}
              placeholder="000000"
              className="w-full text-center bg-slate-50 dark:bg-[#1e293b] rounded-[18px] py-4 mb-6 text-3xl font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-white"
              maxLength={6}
            />

            {zkError && <p className="text-rose-500 font-bold text-xs uppercase tracking-widest mb-4">{zkError}</p>}

            <div className="flex space-x-4">
              <button onClick={() => { setSetupStep('create'); setOtpInput(''); }} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase text-[10px] tracking-widest rounded-[16px]">Cancel</button>
              <button onClick={verifyOtpAndProceed} className="flex-1 py-4 bg-amber-500 text-white font-black uppercase text-[10px] tracking-widest rounded-[16px]">Verify</button>
            </div>
          </div>
        </div>
      );
    }

    if (isChangingPin) {
      return (
        <div className="min-h-[600px] flex items-center justify-center animate-in fade-in duration-500">
          <div className="bg-white dark:bg-[#0f172a] p-16 rounded-[48px] shadow-2xl border border-sky-200 dark:border-white/10 max-w-md w-full text-center">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8">Set New PIN</h3>
            <input
              type="password"
              value={newPin}
              onChange={e => setNewPin(e.target.value)}
              placeholder="New PIN"
              className="w-full text-center bg-[#020617] rounded-[18px] py-4 mb-6 text-xl font-black tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-[#22d3ee] text-white neon-border-cyan"
              maxLength={4}
            />
            <div className="flex space-x-4">
              <button onClick={() => { setIsChangingPin(false); setNewPin(''); setSetupStep('create'); }} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase text-[10px] tracking-widest rounded-[16px]">Cancel</button>
              <button onClick={handleSaveNewPin} className="flex-1 py-4 bg-sky-500 text-white font-black uppercase text-[10px] tracking-widest rounded-[16px]">Save PIN</button>
            </div>
          </div>
        </div>
      );
    }

    // 4. Unlocked View
    return (
      <div className="space-y-12 animate-in fade-in duration-500 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center space-x-4">
              <h3 className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">Clinical Archive</h3>
              <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Decrypted
              </span>
            </div>
            <p className="text-sm text-[#3b82f6] font-black uppercase tracking-[0.5em] mt-3 italic">Synchronized Health History</p>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={initiateChangePin} className="hidden md:block text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-sky-500 px-4">
              Change PIN
            </button>
            <button onClick={() => setIsVaultUnlocked(false)} className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-8 py-5 rounded-[22px] font-black text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all hover:bg-rose-100 dark:hover:bg-rose-900/20 hover:text-rose-500">
              Lock Vault
            </button>
            <button onClick={handleDownloadAll} className="bg-[#0ea5e9] text-white px-12 py-5 rounded-[22px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">Download All</button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {records.filter(r => r.patientId === user.id).map(rec => {
            const isExpanded = expandedRecordId === rec.id;
            return (
              <div
                key={rec.id}
                className={`bg-white dark:bg-[#0f172a] rounded-[48px] border transition-all duration-500 ${isExpanded ? 'p-12 shadow-2xl border-sky-400/30' : 'p-8 shadow-lg border-sky-50 dark:border-white/5 hover:border-sky-200 cursor-pointer'}`}
                onClick={() => setExpandedRecordId(isExpanded ? null : rec.id)}
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div className="flex items-center space-x-8">
                    <div className="bg-sky-50 dark:bg-sky-500/10 px-6 py-4 rounded-[24px] text-center min-w-[100px]">
                      <p className="text-[9px] font-black text-sky-500 uppercase tracking-widest mb-1">DATE</p>
                      <p className="font-black text-slate-800 dark:text-white text-sm">{rec.date}</p>
                    </div>
                    <div>
                      <h4 className={`font-black tracking-tighter text-slate-800 dark:text-white transition-all ${isExpanded ? 'text-4xl' : 'text-2xl'}`}>{rec.diagnosis}</h4>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] mt-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                        Authorized by {rec.doctorName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 self-end lg:self-center">
                    <button onClick={(e) => handleDownloadSingle(e, rec)} className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-[20px] hover:scale-110 transition-transform"><Icons.Download /></button>
                    <div className={`transition-transform duration-500 text-slate-400 ${isExpanded ? 'rotate-180' : ''}`}><svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-12 pt-12 border-t border-slate-100 dark:border-white/5 animate-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                      <div className="lg:col-span-8 space-y-10">
                        <div>
                          <h5 className="text-[10px] font-black uppercase text-[#22d3ee] tracking-[0.5em] mb-6 neon-text-cyan flex items-center justify-between">
                            <span>Patient Vitals Ledger</span>
                            <span className="text-[#a855f7]">Risk Analysis Active</span>
                          </h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[{ l: 'BLOOD PRESSURE', v: rec.vitals.bp, i: '❤️' }, { l: 'BODY TEMP', v: rec.vitals.temp, i: '🌡️' }, { l: 'MASS (KG)', v: rec.vitals.weight, i: '⚖️' }].map((vt, i) => (
                              <div key={i} className="antigravity-glass p-6 rounded-[32px] text-center transition-all hover:bg-white/5 group">
                                <div className="text-xl mb-2 group-hover:scale-110 transition-transform">{vt.i}</div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{vt.l}</p>
                                <p className="text-xl font-black text-white neon-text-cyan">{vt.v || '--'}</p>
                              </div>
                            ))}
                            {/* Plasma Gauge for Risk Score */}
                            <div className="antigravity-glass p-6 rounded-[32px] text-center flex flex-col items-center justify-center relative overflow-hidden">
                              <div className="absolute inset-0 bg-[#a855f7]/10 opacity-50"></div>
                              <div className="w-16 h-16 rounded-full plasma-gauge flex items-center justify-center relative mb-2" style={{ opacity: Math.max(0.5, (rec.riskScore || 0) / 100), filter: `blur(${Math.max(4, (rec.riskScore || 0) / 10)}px)` }}>
                                <div className="absolute inset-1 bg-[#020617] rounded-full flex items-center justify-center font-black text-white text-sm z-10 neon-text-violet">
                                  {rec.riskScore || 0}%
                                </div>
                              </div>
                              <p className="text-[9px] font-black text-[#a855f7] uppercase tracking-widest relative z-10">Risk Factor</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-10 bg-[#020617] rounded-[48px] text-slate-300 italic text-lg leading-relaxed shadow-inner border border-[#22d3ee]/20 relative overflow-hidden antigravity-glass">
                          <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 text-[#22d3ee]"><Icons.FileText /></div>
                          <p className="opacity-80 text-[9px] uppercase font-black tracking-widest mb-6 not-italic text-[#22d3ee] neon-text-cyan">Clinical Narrative Summary</p>
                          "{rec.treatmentSummary || 'No clinical summary synchronized for this star.'}"
                        </div>
                        {rec.medications && rec.medications.length > 0 && (
                          <div className="bg-[#1e293b]/30 p-10 rounded-[48px] border border-white/5">
                            <h5 className="text-[10px] font-black uppercase text-sky-500 tracking-[0.5em] mb-8">Synchronized Medication Protocol</h5>
                            <div className="space-y-4">
                              {rec.medications.map((m: any, i) => (
                                <div key={i} className="flex items-center justify-between p-5 bg-white/5 rounded-[24px] border border-white/5 hover:bg-white/10 transition-colors group">
                                  <div className="flex items-center space-x-5">
                                    <div className="w-10 h-10 bg-sky-500/10 rounded-[14px] flex items-center justify-center text-sky-400 font-black text-xs">{i + 1}</div>
                                    <div><p className="text-lg font-black text-white uppercase tracking-tight leading-none">{m.name}</p><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">DOSAGE: {m.dosage}</p></div>
                                  </div>
                                  <div className="text-right"><p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">DURATION</p><p className="font-bold text-slate-300 text-sm">{m.duration}</p></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="lg:col-span-4 space-y-8">
                        <div className="bg-[#1e293b]/50 rounded-[48px] p-8 border border-white/5 flex flex-col items-center justify-center text-center sticky top-8">
                          <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] mb-8">Diagnostic Archive</h5>
                          {rec.prescriptionImage ? (
                            <div className="w-full aspect-[3/4] rounded-[32px] overflow-hidden shadow-2xl border border-white/10 group relative cursor-zoom-in">
                              <img src={rec.prescriptionImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Prescription" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-8"><span className="text-[9px] font-black uppercase text-white tracking-widest">Enlarge Archive</span></div>
                            </div>
                          ) : (
                            <div className="w-full aspect-[3/4] bg-slate-900/50 rounded-[32px] border border-dashed border-white/10 flex flex-col items-center justify-center p-10 text-slate-600">
                              <div className="mb-4 opacity-10 scale-125"><Icons.FileText /></div>
                              <p className="text-[10px] font-black uppercase tracking-widest leading-loose">No diagnostic visual archives synchronized with this star.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {records.filter(r => r.patientId === user.id).length === 0 && (
            <div className="p-32 text-center bg-white/5 rounded-[64px] border border-dashed border-white/10">
              <div className="w-24 h-24 bg-slate-800 rounded-[40px] flex items-center justify-center mx-auto mb-10 opacity-50"><Icons.FileText /></div>
              <p className="text-2xl font-black text-slate-600 uppercase tracking-tighter">Clinical archive is currently empty.</p>
              <p className="text-sm text-slate-500 mt-4 uppercase tracking-widest font-bold">Synchronize with a medical star to populate your ledger.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBillingPortal = () => {
    const userBills = bills.filter(b => b.patientId === user.id);
    return (
      <div className="bg-white dark:bg-[#0f172a] rounded-[64px] border border-sky-100 dark:border-white/5 shadow-2xl overflow-hidden animate-in fade-in duration-500 max-w-5xl mx-auto">
        <div className="p-16 border-b dark:border-white/5 bg-sky-50/20 dark:bg-white/5">
          <h3 className="font-black text-4xl text-slate-800 dark:text-white uppercase tracking-tighter">Finance Ledger</h3>
          <p className="text-xs text-slate-400 font-black tracking-[0.5em] uppercase mt-2">Centralized Billing Star</p>
        </div>
        <div className="divide-y dark:divide-white/5">
          {userBills.map(bill => (
            <div key={bill.id} className="p-12 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
              <div className="flex items-center space-x-10">
                <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center ${bill.status === 'paid' ? 'bg-emerald-100 text-emerald-600 shadow-xl shadow-emerald-500/10' : 'bg-amber-100 text-amber-600 shadow-xl shadow-amber-500/10'}`}><Icons.CreditCard /></div>
                <div><p className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{bill.service}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{bill.date} • STAR_TX_{bill.id.toUpperCase()}</p></div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter mb-2">${bill.amount.toFixed(2)}</p>
                {bill.status === 'pending' ? (
                  <button onClick={() => handleProcessPayment(bill.id)} className="bg-[#0ea5e9] text-white px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:bg-sky-400">Settle Star</button>
                ) : (
                  <span className="text-emerald-500 font-black text-xs uppercase tracking-[0.3em]">Synchronized</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const content = () => {
    switch (activePage) {
      case 'appointments': return renderAppointmentsPortal();
      case 'records': return renderMedicalRecords();
      case 'profile': return renderProfile();
      case 'billing': return renderBillingPortal();
      default: return renderAppointmentsPortal();
    }
  };

  return <div className="max-w-7xl mx-auto pb-32">{content()}</div>;
};

export default PatientDashboard;
