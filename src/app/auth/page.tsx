'use client';

import { auth } from '@/lib/firebase';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true); // true = login, false = signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/dashboard'); // Redirect if already logged in
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/dashboard');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email first');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message);
    }
  };

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
        fontSize: '2.2rem',
        fontWeight: 'bold',
        background: 'linear-gradient(90deg, #1a73e8, #2e8b57)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        margin: '10px 0'
      }}>
        TrustNet - 信木 (Xìn Mù)
      </h1>

      {/* Tagline */}
      <p style={{
        fontStyle: 'italic',
        color: '#2e8b57',
        margin: '10px 0 30px'
      }}>
        “A promise made is a seed planted.”
      </p>

      {/* Auth Form */}
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        width: '90%',
        maxWidth: '400px'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#1a73e8' }}>
          {isLogin ? 'Welcome Back' : 'Join TrustNet'}
        </h2>

        {error && (
          <p style={{ color: '#d32f2f', fontSize: '0.9rem', marginBottom: '15px' }}>
            {error}
          </p>
        )}

        <form onSubmit={handleEmailAuth}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              margin: '10px 0',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              margin: '10px 0',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#1a73e8',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div style={{ margin: '15px 0' }}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: 'none',
              border: 'none',
              color: '#1a73e8',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        <div style={{ margin: '20px 0', fontSize: '0.9rem', color: '#666' }}>
          or
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            backgroundColor: '#fff',
            color: '#333',
            border: '1px solid #ddd',
            padding: '12px',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '20px' }} />
          {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
        </button>

        {isLogin && (
          <div style={{ marginTop: '20px', fontSize: '0.9rem' }}>
            <button
              onClick={handleForgotPassword}
              style={{
                background: 'none',
                border: 'none',
                color: '#1a73e8',
                cursor: 'pointer'
              }}
            >
              Forgot password?
            </button>
          </div>
        )}
      </div>

      {/* Bottom Leaf */}
      <div style={{ fontSize: '48px', margin: '30px 0 10px' }}>🌿</div>

      <p style={{ fontSize: '0.9rem', color: '#666' }}>
        Powered by Qwen • A promise kept is a tree grown.
      </p>
    </div>
  );
}