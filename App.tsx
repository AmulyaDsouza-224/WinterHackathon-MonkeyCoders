import React, { useState, useEffect } from 'react';
import { UserRole, User } from './types';
import Layout from './components/Layout';
import Chatbot from './components/Chatbot';
import { MOCK_USERS } from './constants';

import { SignedIn, SignedOut, SignIn, useUser, useClerk } from "@clerk/clerk-react";
import RoleSelection from './components/RoleSelection';

// Page imports
import LandingPage from './pages/LandingPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage'; // Kept for type compatibility if needed, but not used

const App: React.FC = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const [activePage, setActivePage] = useState('appointments');
  const [role, setRole] = useState<UserRole | null>(null);
  const [authMode, setAuthMode] = useState<UserRole | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);

  // Persistent global user list for mock backend behavior
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('hms_all_users');
    if (saved) return JSON.parse(saved);
    return MOCK_USERS;
  });

  useEffect(() => {
    localStorage.setItem('hms_all_users', JSON.stringify(allUsers));
  }, [allUsers]);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved !== null) return saved === 'dark';
    return true; // Default to dark for Arctic theme
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Sync Clerk user with local state and check metadata
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // Check unsafeMetadata for role
      const userRole = user.unsafeMetadata.role as UserRole;
      if (userRole) {
        setRole(userRole);
        // Sync to mock backend for data persistence in this demo
        setAllUsers(prev => {
          const exists = prev.find(u => u.id === user.id);
          if (exists) return prev;

          const newUser: User = {
            id: user.id,
            name: user.fullName || user.firstName || 'User',
            email: user.primaryEmailAddress?.emailAddress || '',
            role: userRole,
            // Default mock data
            age: '30',
            bloodGroup: 'O+',
          };
          return [...prev, newUser];
        });
      }
    } else {
      setRole(null);
    }
  }, [isLoaded, isSignedIn, user]);

  const handleUpdateUser = (updates: Partial<User>) => {
    if (user && role) {
      setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...updates } : u));
    }
  };

  const handleLogout = async () => {
    await signOut();
    setRole(null);
    setShowSignIn(false);
    setAuthMode(null);
  };

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const handleRoleSelect = async (selectedRole: UserRole) => {
    if (!user) return;
    try {
      await user.update({
        unsafeMetadata: { role: selectedRole }
      });
      setRole(selectedRole);
      setActivePage(selectedRole === UserRole.ADMIN ? 'dashboard' : 'appointments');
    } catch (err) {
      console.error("Failed to update role", err);
    }
  };

  const handleStart = (selectedRole: UserRole) => {
    setAuthMode(selectedRole);
    setShowSignIn(true);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-sky-500 rounded-xl mb-4"></div>
          <p>Initializing Arctic Protocol...</p>
        </div>
      </div>
    );
  }

  // Construct current user object for legacy components
  // IMPORTANT: We map Clerk ID to our User ID
  const currentUser: User | null = user && role ? {
    id: user.id,
    name: user.fullName || 'User',
    email: user.primaryEmailAddress?.emailAddress || '',
    role: role,
    // We could map other fields from Clerk here
  } : null;

  const renderContent = () => {
    if (!currentUser) return null;

    // Use find to get the most up-to-date user data from mock backend
    // This allows updates (like medical history) to persist in the session
    const fullUser = allUsers.find(u => u.id === currentUser.id) || currentUser;

    switch (role) {
      case UserRole.PATIENT:
        return <PatientDashboard activePage={activePage} user={fullUser} onUserUpdate={handleUpdateUser} allUsers={allUsers} />;
      case UserRole.DOCTOR:
        return <DoctorDashboard activePage={activePage} user={fullUser} onUserUpdate={handleUpdateUser} />;
      case UserRole.ADMIN:
        return <AdminDashboard activePage={activePage} user={fullUser} onUserUpdate={handleUpdateUser} allUsers={allUsers} setAllUsers={setAllUsers} />;
      default:
        return <div>Role not recognized.</div>;
    }
  };

  return (
    <>
      <SignedOut>
        {showSignIn ? (
          <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects matching auth page */}
            <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-15%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10">
              <button onClick={() => setShowSignIn(false)} className="mb-6 text-slate-400 hover:text-white flex items-center space-x-2 transition-colors group">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-sky-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </div>
                <span className="font-bold tracking-wider text-xs uppercase">Back to Lobby</span>
              </button>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                  {authMode || 'Secure'} <span className="text-sky-500">Access</span>
                </h2>
                {authMode && authMode !== UserRole.PATIENT && (
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Authorized Personnel Only</p>
                )}
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] shadow-2xl">
                <SignIn />
              </div>
            </div>
          </div>
        ) : (
          <LandingPage onStart={handleStart} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        )}
      </SignedOut>

      <SignedIn>
        {!role ? (
          <RoleSelection onSelectRole={handleRoleSelect} />
        ) : (
          <>
            <Layout
              user={currentUser}
              onLogout={handleLogout}
              activePage={activePage}
              onNavigate={setActivePage}
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
            >
              {renderContent()}
            </Layout>
            <Chatbot />
          </>
        )}
      </SignedIn>
    </>
  );
};

export default App;