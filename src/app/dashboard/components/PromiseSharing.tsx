'use client'

import { useState } from 'react';

// Visibility options for promise sharing
const VISIBILITY_OPTIONS = [
  { 
    id: 'circle', 
    label: 'Trust Circle Only', 
    description: 'Share only with your accountability group',
    icon: '👥'
  },
  { 
    id: 'friends', 
    label: 'Friends', 
    description: 'Share with all your TrustNet connections',
    icon: '🤝'
  },
  { 
    id: 'public', 
    label: 'Public', 
    description: 'Share to your public profile (use carefully)',
    icon: '🌍'
  }
];

export default function PromiseSharing({ promise, user, onShareComplete, onTrustScoreUpdate }) {
  const [visibility, setVisibility] = useState('circle');
  const [selectedCircle, setSelectedCircle] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const handleShare = async () => {
    // In production, this would share to Firestore
    console.log('Sharing promise:', {
      promiseId: promise.id,
      visibility,
      circleId: visibility === 'circle' ? selectedCircle : null
    });
    
    setShowConfirmation(true);
    
    // Simulate API call
    setTimeout(() => {
      // Update trust score when sharing completes
      if (onTrustScoreUpdate) {
        onTrustScoreUpdate(2);
      }
      
      // Callback to parent component
      if (onShareComplete) onShareComplete();
      
      setShowConfirmation(false);
    }, 1500);
  };
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
    }}>
      <h2 style={{
        fontSize: '1.2rem',
        fontWeight: '600',
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>📤</span> Share Your Promise
      </h2>
      
      {/* Promise Preview */}
      <div style={{
        backgroundColor: '#f8faff',
        borderRadius: '12px',
        padding: '15px',
        marginBottom: '15px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '10px'
        }}>
          <span style={{ fontSize: '1.5rem' }}>{promise.emoji}</span>
          <h3 style={{ margin: '0', fontSize: '1rem' }}>{promise.title}</h3>
        </div>
        <p style={{ 
          margin: '0', 
          fontSize: '0.9rem', 
          color: '#666',
          fontStyle: 'italic'
        }}>
          "I commit to {promise.title.toLowerCase()} every day for 7 days."
        </p>
      </div>
      
      {/* Visibility Controls */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ 
          fontSize: '1rem', 
          fontWeight: '500', 
          marginBottom: '10px',
          color: '#333'
        }}>
          Who can see this?
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {VISIBILITY_OPTIONS.map(option => (
            <label
              key={option.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px',
                borderRadius: '8px',
                border: visibility === option.id 
                  ? '1px solid #4ECDC4' 
                  : '1px solid #eee',
                background: visibility === option.id 
                  ? 'rgba(78, 205, 196, 0.05)' 
                  : 'white',
                cursor: 'pointer'
              }}
            >
              <input
                type="radio"
                name="visibility"
                value={option.id}
                checked={visibility === option.id}
                onChange={(e) => setVisibility(e.target.value)}
                style={{ marginRight: '5px' }}
              />
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  fontWeight: '500'
                }}>
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </div>
                <p style={{ 
                  margin: '3px 0 0', 
                  fontSize: '0.85rem', 
                  color: '#666' 
                }}>
                  {option.description}
                </p>
              </div>
            </label>
          ))}
        </div>
        
        {visibility === 'circle' && (
          <div style={{ marginTop: '10px' }}>
            <select
              value={selectedCircle || ''}
              onChange={(e) => setSelectedCircle(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}
            >
              <option value="">Select a Trust Circle</option>
              <option value="morning-ritual">Morning Ritual Masters</option>
              <option value="digital-detox">Digital Detox Crew</option>
              <option value="family-support">Family Support</option>
            </select>
          </div>
        )}
      </div>
      
      {/* Share Button */}
      <button
        onClick={handleShare}
        disabled={!selectedCircle && visibility === 'circle'}
        style={{
          background: 'linear-gradient(135deg, #4ECDC4, #7B42F5)',
          color: 'white',
          border: 'none',
          padding: '10px 15px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '500',
          width: '100%',
          opacity: !selectedCircle && visibility === 'circle' ? 0.7 : 1
        }}
      >
        {showConfirmation ? 'Sharing...' : 'Share Promise'}
      </button>
      
      {showConfirmation && (
        <div style={{
          marginTop: '10px',
          padding: '8px',
          backgroundColor: 'rgba(78, 205, 196, 0.1)',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#2e8b57'
        }}>
          ✅ Shared successfully! Your trust score increased by 2%.
        </div>
      )}
    </div>
  );
}