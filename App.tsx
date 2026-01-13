import React, { useState, useEffect } from 'react';
import { UserRole, User } from './types';
import Layout from './components/Layout';
import Chatbot from './components/Chatbot';
import { MOCK_USERS } from './constants';

import { SignedIn, SignedOut, SignIn, useUser, useClerk } from "@clerk/clerk-react";
import RoleSelection from './components/RoleSelection';
import SecureLogin from './components/SecureLogin';

// Page imports
import LandingPage from './pages/LandingPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DoctorLogin from './pages/DoctorLogin';
import AdminLogin from './pages/AdminLogin';

const App: React.FC = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const [activePage, setActivePage] = useState('appointments');
  const [role, setRole] = useState<UserRole | null>(null);

  // Auth View State: 'landing' | 'doctor_login' | 'admin_login' | 'patient_login'
  const [authView, setAuthView] = useState<string>('landing');

  // Persistent global user list
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
    return true;
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

  // Sync Clerk user
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const userRole = user.unsafeMetadata.role as UserRole;
      const userEmail = user.primaryEmailAddress?.emailAddress || '';
      const existingProvisionedUser = allUsers.find(u => u.email === userEmail && u.role === UserRole.DOCTOR);

      if (existingProvisionedUser && !userRole) {
        user.update({ unsafeMetadata: { role: UserRole.DOCTOR } }).then(() => setRole(UserRole.DOCTOR));
      } else if (userRole) {
        setRole(userRole);
        setAllUsers(prev => {
          if (prev.find(u => u.id === user.id)) return prev;
          return [...prev, {
            id: user.id,
            name: user.fullName || 'User',
            email: userEmail,
            role: userRole,
            age: '30',
            bloodGroup: 'O+'
          }];
        });
      }
    } else if (!isSignedIn) {
      setRole(null);
    }
  }, [isLoaded, isSignedIn, user]); // Removed allUsers from dep to avoid loops, safe here

  const handleUpdateUser = (updates: Partial<User>) => {
    if (user && role) {
      setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...updates } : u));
    }
  };

  const handleLogout = async () => {
    await signOut();
    setRole(null);
    setAuthView('landing');
  };

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const handleRoleSelect = async (selectedRole: UserRole) => {
    if (!user) return;
    await user.update({ unsafeMetadata: { role: selectedRole } });
    setRole(selectedRole);
    setActivePage(selectedRole === UserRole.ADMIN ? 'dashboard' : 'appointments');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 bg-sky-500 rounded-xl animate-spin"></div>
      </div>
    );
  }

  // CONTENT RENDERING LOGIC

  // 1. Not Signed In? Show Landing or Specific Login Pages
  if (!isSignedIn) {
    if (authView === 'doctor_login') return <DoctorLogin onBack={() => setAuthView('landing')} />;
    if (authView === 'admin_login') return <AdminLogin onBack={() => setAuthView('landing')} />;

    // PATIENT: Standard Portal (with Socials & Signup)
    if (authView === 'patient_login') {
      return (
        <SecureLogin
          onBack={() => setAuthView('landing')}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />
      );
    }

    return (
      <LandingPage
        onStart={() => { }} // Legacy
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onVisitPatientLogin={() => setAuthView('patient_login')}
        onVisitDoctorLogin={() => setAuthView('doctor_login')}
        onVisitAdminLogin={() => setAuthView('admin_login')}
      />
    );
  }

  // 2. Signed In but No Role? Show Selection
  if (!role) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <RoleSelection onSelectRole={handleRoleSelect} user={user as any} />
      </div>
    );
  }

  // 3. Main App Layout
  const currentUser: User = {
    id: user.id,
    name: user.fullName || 'User',
    email: user.primaryEmailAddress?.emailAddress || '',
    role: role
  };
  const fullUser = allUsers.find(u => u.id === currentUser.id) || currentUser;

  return (
    <>
      <Layout user={currentUser} onLogout={handleLogout} activePage={activePage} onNavigate={setActivePage} darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
        {role === UserRole.PATIENT && <PatientDashboard activePage={activePage} user={fullUser} onUserUpdate={handleUpdateUser} allUsers={allUsers} />}
        {role === UserRole.DOCTOR && <DoctorDashboard activePage={activePage} user={fullUser} onUserUpdate={handleUpdateUser} />}
        {role === UserRole.ADMIN && <AdminDashboard activePage={activePage} user={fullUser} onUserUpdate={handleUpdateUser} allUsers={allUsers} setAllUsers={setAllUsers} />}
      </Layout>
      <Chatbot />
    </>
  );
};

export default App;
