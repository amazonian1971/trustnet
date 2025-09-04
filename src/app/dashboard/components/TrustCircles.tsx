'use client'

import { useState, useEffect } from 'react';

export default function TrustCircles({ user, promises, onTrustScoreUpdate }) {
  const [circles, setCircles] = useState([]);
  const [selectedCircle, setSelectedCircle] = useState(null);
  
  useEffect(() => {
    // Load user's trust circles from Firestore
    const loadCircles = async () => {
      // In production, this would fetch from your Firestore database
      const mockCircles = [
        {
          id: 'circle-1',
          name: 'Morning Ritual Masters',
          members: [
            { id: 'user-1', name: 'Sarah', avatar: '👩', trustScore: 92 },
            { id: 'user-2', name: 'Michael', avatar: '👨', trustScore: 88 },
            { 
              id: user.uid, 
              name: user.displayName || 'You', 
              avatar: '👤', 
              trustScore: 87, 
              isCurrentUser: true 
            }
          ],
          promises: promises.filter(p => 
            p.title.toLowerCase().includes('morning') || 
            p.title.toLowerCase().includes('journal')
          )
        },
        {
          id: 'circle-2',
          name: 'Digital Detox Crew',
          members: [
            { id: 'user-4', name: 'Alex', avatar: '🧑', trustScore: 95 },
            { 
              id: user.uid, 
              name: user.displayName || 'You', 
              avatar: '👤', 
              trustScore: 87, 
              isCurrentUser: true 
            }
          ],
          promises: promises.filter(p => 
            p.title.toLowerCase().includes('social') || 
            p.title.toLowerCase().includes('phone')
          )
        }
      ];
      setCircles(mockCircles);
      if (mockCircles.length > 0) setSelectedCircle(mockCircles[0]);
    };
    
    loadCircles();
  }, [user, promises]);
  
  const handleCircleSelect = (circle) => {
    setSelectedCircle(circle);
  };
  
  const handleSharePromise = async (promise) => {
    // In production, this would share to Firestore
    console.log('Sharing promise:', {
      promiseId: promise.id,
      visibility: 'circle',
      circleId: selectedCircle.id
    });
    
    // Update trust score for social engagement
    if (onTrustScoreUpdate) {
      onTrustScoreUpdate(1);
    }
    
    // Show success feedback
    alert(`Shared "${promise.title}" to ${selectedCircle.name}! Your trust score increased by 1%.`);
  };
  
  if (circles.length === 0) return null;
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h2 style={{
          fontSize: '1.2rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>👥</span> Trust Circles
        </h2>
      </div>
      
      {/* Circle Selector */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '15px',
        overflowX: 'auto',
        padding: '5px 0'
      }}>
        {circles.map(circle => (
          <button
            key={circle.id}
            onClick={() => handleCircleSelect(circle)}
            style={{
              padding: '8px 15px',
              borderRadius: '20px',
              background: selectedCircle?.id === circle.id 
                ? 'linear-gradient(135deg, #4ECDC4, #7B42F5)'
                : '#f0f0f0',
              color: selectedCircle?.id === circle.id ? 'white' : '#333',
              border: 'none',
              cursor: 'pointer',
              fontWeight: selectedCircle?.id === circle.id ? '500' : '400',
              whiteSpace: 'nowrap'
            }}
          >
            {circle.name} ({circle.members.length})
          </button>
        ))}
      </div>
      
      {/* Circle Content */}
      {selectedCircle && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            marginBottom: '15px',
            flexWrap: 'wrap'
          }}>
            {selectedCircle.members.map(member => (
              <div key={member.id} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: member.isCurrentUser 
                    ? 'linear-gradient(135deg, #4ECDC4, #7B42F5)' 
                    : '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  color: member.isCurrentUser ? 'white' : '#666'
                }}>
                  {member.avatar}
                </div>
                <span style={{
                  fontSize: '0.85rem',
                  marginTop: '5px',
                  fontWeight: member.isCurrentUser ? '500' : '400'
                }}>
                  {member.name}
                </span>
                {member.trustScore && (
                  <span style={{
                    fontSize: '0.75rem',
                    background: 'rgba(78, 205, 196, 0.1)',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    marginTop: '3px'
                  }}>
                    {member.trustScore}%
                  </span>
                )}
              </div>
            ))}
          </div>
          
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '500',
            marginBottom: '10px',
            color: '#333'
          }}>
            Active Promises in {selectedCircle.name}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {selectedCircle.promises.map(promise => (
              <div key={promise.id} style={{
                padding: '12px',
                backgroundColor: '#f8faff',
                borderRadius: '12px',
                borderLeft: '4px solid #4ECDC4'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>{promise.emoji}</span>
                  <span style={{ fontWeight: '500' }}>{promise.title}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                  color: '#666'
                }}>
                  <span>{promise.progress}</span>
                  <button
                    onClick={() => handleSharePromise(promise)}
                    style={{
                      background: 'none',
                      border: '1px solid #ddd',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}