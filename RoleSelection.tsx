import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { UserRole } from '../types';

interface RoleSelectionProps {
    onSelectRole: (role: UserRole) => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelectRole }) => {
    const { user } = useUser();

    return (
        <div className="min-h-screen bg-sky-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Decorative Orbs */}
            <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-15%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] p-8 md:p-14 animate-in zoom-in-95 duration-500 relative z-10 border border-white/5 text-center">

                <div className="mb-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-blue-600 rounded-[28px] mx-auto mb-6 flex items-center justify-center text-white shadow-2xl shadow-sky-500/30">
                        <span className="text-3xl font-bold">M</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-3">
                        Welcome, {user?.firstName || 'User'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight text-lg">
                        Please select your role to initialize your session node.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                        onClick={() => onSelectRole(UserRole.PATIENT)}
                        className="group relative p-8 rounded-[32px] bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:border-sky-500 transition-all duration-300 hover:shadow-2xl hover:shadow-sky-500/20 text-left"
                    >
                        <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4.871 4A17.926 17.926 0 0 0 3 12c0 2.874.673 5.59 1.871 8m14.13 0a17.926 17.926 0 0 0 1.87-8c0-2.874-.673-5.59-1.87-8M9 9h1.246a1 1 0 0 1 .961.727l1.586 6.544a1 1 0 0 1-.961 1.229H10.5a.5.5 0 0 1-.5-.5v-2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v2.5a.5.5 0 0 1-.5.5H5.808a1 1 0 0 1-.961-1.229l1.586-6.544A1 1 0 0 1 7.394 9H9zm0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4m-6 4h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Patient</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Access your medical history, appointments, and prescriptions.</p>
                    </button>

                    {/* Doctor Selection Removed - Admin Provisioning Only */}

                    <button
                        onClick={() => {
                            const key = prompt("Enter Administrator Access Key:");
                            if (key === "admin") {
                                onSelectRole(UserRole.ADMIN);
                            } else if (key) {
                                alert("Access Denied: Invalid Neural Signature");
                            }
                        }}
                        className="group relative p-8 rounded-[32px] bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:border-indigo-500 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/20 text-left"
                    >
                        <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Admin</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">System oversight and network management.</p>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default RoleSelection;
