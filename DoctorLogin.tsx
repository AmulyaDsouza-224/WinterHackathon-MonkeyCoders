import React from 'react';
import { SignIn } from "@clerk/clerk-react";
import { Icons } from '../constants';

const DoctorLogin: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-sky-900/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="absolute top-8 left-8 z-20">
                <button onClick={onBack} className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors group">
                    <div className="p-2 rounded-full bg-slate-900/50 group-hover:bg-sky-500/20 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </div>
                    <span className="font-bold uppercase tracking-widest text-xs">Back to Lobby</span>
                </button>
            </div>

            <div className="relative z-10 w-full max-w-md flex flex-col items-center">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-2">DOCTOR <span className="text-sky-500">ACCESS</span></h1>
                    <p className="text-[#0ea5e9] font-black uppercase tracking-[0.3em] text-[10px]">Authorized Personnel Only</p>
                </div>

                <SignIn
                    appearance={{
                        layout: {
                            socialButtonsPlacement: 'bottom',
                            showOptionalSignInFields: false
                        },
                        elements: {
                            rootBox: "w-full",
                            card: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[32px] shadow-2xl p-8",
                            headerTitle: "text-2xl font-black text-slate-800 dark:text-white tracking-tight",
                            headerSubtitle: "text-slate-500 dark:text-slate-400 font-medium",
                            formButtonPrimary: "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl py-3 shadow-lg shadow-sky-500/20 transition-all",
                            socialButtonsBlockButton: "hidden", // Hides Social Buttons
                            footer: "hidden", // Hides Sign up footer
                            dividerRow: "hidden", // Hides the "or" divider
                            formFieldInput: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-sky-500/50",
                            formFieldLabel: "text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wide text-xs mb-1"
                        }
                    }}
                />

                <p className="mt-8 text-slate-500 text-xs font-medium text-center max-w-xs leading-relaxed">
                    By accessing this portal, you agree to the <span className="text-sky-500">Arctic Medical Protocols</span> and data privacy ledger.
                </p>
            </div>
        </div>
    );
};

export default DoctorLogin;
