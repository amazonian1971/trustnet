'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /auth if not logged in
    // (We'll handle auth state properly in the next step)
    const checkAuth = () => {
      const user = localStorage.getItem('user');
      if (!user) {
        router.push('/auth');
      }
    };
    
    checkAuth();
    
    // Set up auth state listener
    const unsubscribe = () => {
      // This would be where you'd set up Firebase auth state listener
      // For now, we'll just check localStorage periodically
      const interval = setInterval(checkAuth, 1000);
      return () => clearInterval(interval);
    };
    
    return unsubscribe();
  }, [router]);

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      textAlign: 'center',
      backgroundColor: '#f0f7f4',
      minHeight: '100vh',
      color: '#1a3d30',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Leaf */}
      <div style={{ fontSize: '48px', margin: '10px 0' }}>🌿</div>

      {/* App Name */}
      <h1 style={{
        fontSize: '2.8rem',
        fontWeight: 'bold',
        background: 'linear-gradient(90deg, #1a73e8, #2e8b57)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        color: 'transparent'
      }}>
       🌿 TrustNet - A promise made is a seed planted. 🌿
      </h1>

      <p style={{
        fontStyle: 'italic',
        color: '#2e8b57',
        margin: '20px 0 30px',
        fontSize: '1.3rem'
      }}>
        &quot;A promise made is a seed planted.&quot;
      </p>

      <button
        onClick={() => router.push('/auth')}
        style={{
          backgroundColor: '#1a73e8',
          color: 'white',
          border: 'none',
          padding: '15px 30px',
          borderRadius: '25px',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
      >
        🌱 Start Your Promise 🌱
      </button>

      <div style={{ fontSize: '48px', margin: '60px 0 20px' }}>🌿</div>

      <p style={{ fontSize: '0.9rem', color: '#666' }}>
        Powered by Qwen • A promise made is a seed planted..
      </p>
    </div>
  );
}