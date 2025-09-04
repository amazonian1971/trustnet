'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, updatePassword, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  // Listen for auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/auth');
      } else {
        setUser(user);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    setDarkMode(saved === 'true');
    if (saved === 'true') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setMessage('Please fill in both fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    try {
      await updatePassword(user, newPassword);
      setMessage('✅ Password updated!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/auth');
    } catch (error) {
      console.error('Sign out error', error);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      backgroundColor: darkMode ? '#1a1a1a' : '#f8faff',
      minHeight: '100vh',
      color: darkMode ? '#e0e0e0' : '#1a3d30',
      transition: 'background-color 0.3s, color 0.3s'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: 'bold',
          background: darkMode 
            ? 'linear-gradient(90deg, #4ade80, #3b82f6)' 
            : 'linear-gradient(90deg, #1a73e8, #2e8b57)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🌿 TrustNet-信木 🌿
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={toggleTheme}
            style={{
              background: darkMode ? '#333' : '#ddd',
              color: darkMode ? '#fff' : '#333',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button
            onClick={handleSignOut}
            style={{
              background: '#d32f2f',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            🔐 Sign Out
          </button>
        </div>
      </header>

      {/* Profile Card */}
      <div style={{
        backgroundColor: darkMode ? '#2a2a2a' : 'white',
        borderRadius: '16px',
        padding: '30px',
        maxWidth: '600px',
        margin: '0 auto',
        boxShadow: darkMode 
          ? '0 4px 12px rgba(0,0,0,0.3)' 
          : '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#1a73e8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '2rem'
          }}>
            {user.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 style={{ margin: '0', fontSize: '1.5rem', color: darkMode ? '#fff' : '#1a73e8' }}>
              {user.displayName || 'User'}
            </h2>
            <p style={{ margin: '4px 0 0', color: darkMode ? '#aaa' : '#666' }}>
              {user.email}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '15px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: darkMode ? '#333' : '#e6f7ff',
            padding: '15px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0', fontSize: '0.9rem', color: darkMode ? '#aaa' : '#666' }}>Streak</p>
            <p style={{ margin: '5px 0 0', fontSize: '1.3rem', fontWeight: 'bold' }}>7 days</p>
          </div>
          <div style={{
            backgroundColor: darkMode ? '#333' : '#e6f7ff',
            padding: '15px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0', fontSize: '0.9rem', color: darkMode ? '#aaa' : '#666' }}>Promises</p>
            <p style={{ margin: '5px 0 0', fontSize: '1.3rem', fontWeight: 'bold' }}>12</p>
          </div>
          <div style={{
            backgroundColor: darkMode ? '#333' : '#f9f0ff',
            padding: '15px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0', fontSize: '0.9rem', color: darkMode ? '#aaa' : '#666' }}>Inspired</p>
            <p style={{ margin: '5px 0 0', fontSize: '1.3rem', fontWeight: 'bold', color: '#722ed1' }}>5 people</p>
          </div>
        </div>

        {/* Change Password */}
        <div style={{
          backgroundColor: darkMode ? '#333' : '#f9f9f9',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px', color: darkMode ? '#fff' : '#1a73e8' }}>🔐 Change Password</h3>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              marginBottom: '10px',
              backgroundColor: darkMode ? '#444' : 'white',
              color: darkMode ? '#fff' : '#333'
            }}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              marginBottom: '10px',
              backgroundColor: darkMode ? '#444' : 'white',
              color: darkMode ? '#fff' : '#333'
            }}
          />
          <button
            onClick={handleChangePassword}
            style={{
              background: '#1a73e8',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Update Password
          </button>
          {message && (
            <p style={{
              marginTop: '10px',
              fontSize: '0.9rem',
              color: message.includes('Error') ? '#d32f2f' : '#389e0d'
            }}>
              {message}
            </p>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleSignOut}
          style={{
            width: '100%',
            background: '#d32f2f',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🔐 Sign Out
        </button>
      </div>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        marginTop: '60px',
        fontSize: '0.8rem',
        color: darkMode ? '#888' : '#999'
      }}>
        <p>“A promise made is a seed planted.”</p>
        <p>Powered by Qwen • TrustNet</p>
      </footer>
    </div>
  );
}