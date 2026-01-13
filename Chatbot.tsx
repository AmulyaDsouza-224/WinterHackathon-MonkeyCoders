import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { GeminiService } from '../services/geminiService';

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: 'Hello! I am your Arctic Medical Assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(true); // Global toggle acts as a master switch

    const toggleSpeech = (text: string, index: number) => {
        if (!soundEnabled) return;

        if (speakingIndex === index) {
            // Stop if clicking the current one
            window.speechSynthesis.cancel();
            setSpeakingIndex(null);
        } else {
            // Play new one
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.onend = () => setSpeakingIndex(null);
            setSpeakingIndex(index);
            window.speechSynthesis.speak(utterance);
        }
    };

    // Stop speech when closing or toggling master sound
    useEffect(() => {
        if (!soundEnabled || !isOpen) {
            window.speechSynthesis.cancel();
            setSpeakingIndex(null);
        }
    }, [soundEnabled, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user' as const, content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        try {
            const response = await GeminiService.getInstance().getChatResponse(input);
            const aiMsg = { role: 'assistant' as const, content: response };
            setMessages(prev => [...prev, aiMsg]);
            // Auto-play removed as per request
        } catch (error) {
            const errorMsg = "Connection to neural network unstable. Please retry.";
            setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 p-4 rounded-[28px] shadow-2xl z-50 transition-all duration-300 hover:scale-110 group
          ${isOpen ? 'bg-rose-500 hover:bg-rose-600 rotate-90' : 'bg-[#0ea5e9] hover:bg-sky-600'} 
          text-white border-4 border-white dark:border-slate-800`}
            >
                {isOpen ? <Icons.Plus className="rotate-45" /> : <Icons.Bot className="w-8 h-8 group-hover:animate-bounce" />}
            </button>

            {isOpen && (
                <div className="fixed bottom-28 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] bg-white dark:bg-[#0f172a] rounded-[48px] shadow-[0_50px_100px_-20px_rgba(14,165,233,0.3)] overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col z-40 animate-in slide-in-from-bottom-10 fade-in duration-300 font-sans">
                    {/* Header */}
                    <div className="p-6 bg-slate-50 dark:bg-[#1e293b] border-b border-slate-200 dark:border-white/5 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-blue-500/10 pointer-events-none"></div>
                        <div className="flex items-center space-x-3 relative z-10">
                            <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
                                <Icons.Bot />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Arctic AI</h3>
                                <p className="text-[9px] font-bold text-sky-500 uppercase tracking-widest">Online • Audio Active</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`p-2 rounded-xl transition-all ${soundEnabled ? 'bg-sky-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}
                            title={soundEnabled ? "Mute All" : "Enable Sound"}
                        >
                            <Icons.Volume />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-[#0f172a] scroll-smooth">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-5 rounded-[24px] text-sm font-medium leading-relaxed shadow-sm relative group ${msg.role === 'user'
                                        ? 'bg-[#0ea5e9] text-white rounded-tr-none'
                                        : 'bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-white/5 rounded-tl-none'
                                    }`}>
                                    {msg.content}
                                    {msg.role === 'assistant' && (
                                        <button
                                            onClick={() => toggleSpeech(msg.content, idx)}
                                            className={`absolute -right-8 top-2 transition-all ${speakingIndex === idx ? 'text-sky-500 scale-110' : 'text-slate-300 hover:text-sky-500 opacity-0 group-hover:opacity-100'}`}
                                        >
                                            <Icons.Volume className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {speakingIndex !== null && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-[#1e293b] p-3 rounded-[24px] rounded-tl-none border border-slate-100 dark:border-white/5 flex space-x-1 items-center">
                                    <div className="w-1.5 h-3 bg-sky-500 rounded-full animate-[music_1s_ease-in-out_infinite]"></div>
                                    <div className="w-1.5 h-5 bg-sky-500 rounded-full animate-[music_1.2s_ease-in-out_infinite]"></div>
                                    <div className="w-1.5 h-2 bg-sky-500 rounded-full animate-[music_0.8s_ease-in-out_infinite]"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-white/5">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Query neural network..."
                                className="w-full bg-slate-100 dark:bg-[#1e293b] border-2 border-transparent focus:border-sky-500 rounded-[24px] pl-6 pr-14 py-4 text-sm font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="absolute right-2 top-2 p-2 bg-[#0ea5e9] hover:bg-sky-600 text-white rounded-[18px] transition-all disabled:opacity-50 disabled:hover:bg-[#0ea5e9] shadow-lg shadow-sky-500/20 active:scale-95"
                            >
                                <Icons.ArrowRight /> {/* Assuming ArrowRight exists or similar, or I can use basic SVG */}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes music {
                    0%, 100% { height: 8px; opacity: 0.5; }
                    50% { height: 20px; opacity: 1; }
                }
            `}</style>
        </>
    );
};

export default Chatbot;
