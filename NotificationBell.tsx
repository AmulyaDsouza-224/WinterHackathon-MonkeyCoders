
import React, { useState, useEffect } from 'react';
import { Notification } from '../types';

interface NotificationBellProps {
    userId: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Poll for notifications every 2 seconds (simulating real-time)
    useEffect(() => {
        const fetchNotifications = () => {
            try {
                const stored = localStorage.getItem('global_notifications');
                if (stored) {
                    const allNotifs: Notification[] = JSON.parse(stored);
                    const myNotifs = allNotifs.filter(n => n.userId === userId);
                    setNotifications(myNotifs);
                    setUnreadCount(myNotifs.filter(n => !n.read).length);
                }
            } catch (e) {
                console.error("Failed to parse notifications", e);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 2000);
        return () => clearInterval(interval);
    }, [userId]);

    const markAsRead = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const stored = localStorage.getItem('global_notifications');
            if (stored) {
                let allNotifs: Notification[] = JSON.parse(stored);
                allNotifs = allNotifs.map(n => n.id === id ? { ...n, read: true } : n);
                localStorage.setItem('global_notifications', JSON.stringify(allNotifs));

                // Update local state immediately
                const myNotifs = allNotifs.filter(n => n.userId === userId);
                setNotifications(myNotifs);
                setUnreadCount(myNotifs.filter(n => !n.read).length);
            }
        } catch (e) {
            console.error("Failed to update notification", e);
        }
    };

    const clearAll = () => {
        try {
            const stored = localStorage.getItem('global_notifications');
            if (stored) {
                let allNotifs: Notification[] = JSON.parse(stored);
                // Keep other users' notifications, remove mine
                const others = allNotifs.filter(n => n.userId !== userId);
                localStorage.setItem('global_notifications', JSON.stringify(others));
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-1 ring-white dark:ring-slate-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                            <h3 className="font-bold text-sm text-slate-800 dark:text-white">Notifications</h3>
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 uppercase tracking-wider"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium">No new notifications</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {notifications.map(n => (
                                        <div
                                            key={n.id}
                                            className={`p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!n.read ? 'bg-sky-50/30 dark:bg-sky-900/10' : ''}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.type === 'alert' ? 'bg-rose-500' :
                                                        n.type === 'success' ? 'bg-emerald-500' :
                                                            'bg-sky-500'
                                                    }`} />
                                                <div className="flex-1 space-y-1">
                                                    <p className={`text-sm ${!n.read ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                                        {n.message}
                                                    </p>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{n.date}</span>
                                                        {!n.read && (
                                                            <button
                                                                onClick={(e) => markAsRead(n.id, e)}
                                                                className="text-[10px] font-bold text-sky-500 hover:text-sky-600 uppercase tracking-widest"
                                                            >
                                                                Mark Read
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
