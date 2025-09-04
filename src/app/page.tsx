'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/auth');
      } else {
        setIsLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
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
        <div style={{
          fontSize: '48px',
          animation: 'spin 1s linear infinite'
        }}>🌿</div>
        <p style={{ 
          marginTop: '20px', 
          color: '#2e8b57',
          fontSize: '1.2rem'
        }}>
          Building trust, one promise at a time...
        </p>
      </div>
    );
  }

  return (
    <main style={{
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
        TrustNet - 信木-Xìn Mù 
      </h1>

      <p style={{
        fontStyle: 'italic',
        color: '#2e8b57',
        margin: '20px 0 30px',
        fontSize: '1.3rem'
      }}>
        "A promise made is a seed planted."
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
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          transition: 'background-color 0.3s ease'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#1557b0'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#1a73e8'}
      >
        🌱 Start Your Promise 🌱
      </button>

      <div style={{ fontSize: '48px', margin: '60px 0 20px' }}>🌿</div>

      <p style={{ fontSize: '0.9rem', color: '#666' }}>
        Powered by Qwen • A promise kept is a tree grown.
      </p>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}