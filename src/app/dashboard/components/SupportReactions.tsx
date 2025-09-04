'use client'

import { useState, useEffect } from 'react';

// Custom reaction types that build trust
const REACTIONS = [
  {
    id: 'believe',
    label: 'I believe in you',
    emoji: '🙌',
    color: '#4ECDC4',
    impact: 2 // Trust score impact
  },
  {
    id: 'inspire',
    label: 'You inspire me',
    emoji: '🌟',
    color: '#7B42F5',
    impact: 3
  },
  {
    id: 'support',
    label: 'I support you',
    emoji: '🤝',
    color: '#FFD166',
    impact: 2
  },
  {
    id: 'celebrate',
    label: 'Let\'s celebrate',
    emoji: '🎉',
    color: '#FF6B6B',
    impact: 1
  }
];

export default function SupportReactions({ promise, user, onReaction, onTrustScoreUpdate }) {
  const [reactions, setReactions] = useState([]);
  const [showTooltip, setShowTooltip] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  useEffect(() => {
    // Load reactions for this promise (mock data)
    const mockReactions = [
      { id: 'react-1', userId: 'user-1', type: 'believe', timestamp: Date.now() - 86400000 },
      { id: 'react-2', userId: 'user-2', type: 'inspire', timestamp: Date.now() - 43200000 },
      { id: 'react-3', userId: 'user-3', type: 'support', timestamp: Date.now() - 21600000 }
    ];
    setReactions(mockReactions);
  }, [promise.id]);
  
  const handleReaction = (reactionType) => {
    const reaction = REACTIONS.find(r => r.id === reactionType);
    
    // Check if user already reacted
    const existingReaction = reactions.find(r => r.userId === user.uid);
    if (existingReaction) {
      alert('You\'ve already sent support for this promise!');
      return;
    }
    
    // Add the reaction
    const newReaction = {
      id: `react-${Date.now()}`,
      userId: user.uid,
      type: reactionType,
      timestamp: Date.now()
    };
    
    setReactions([...reactions, newReaction]);
    setShowConfirmation(true);
    
    // Update trust score based on reaction type
    if (onTrustScoreUpdate) {
      onTrustScoreUpdate(reaction.impact);
    }
    
    // Callback to parent component
    if (onReaction) {
      onReaction(reactionType, reaction.impact);
    }
    
    // Hide confirmation after delay
    setTimeout(() => setShowConfirmation(false), 2000);
  };
  
  const getReactionCount = (type) => {
    return reactions.filter(r => r.type === type).length;
  };
  
  const getUserReaction = () => {
    return reactions.find(r => r.userId === user.uid);
  };
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '15px',
      marginBottom: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
    }}>
      <h2 style={{
        fontSize: '1.1rem',
        fontWeight: '600',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>💬</span> Support Reactions
      </h2>
      
      {/* Reaction Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          {REACTIONS.map(reaction => {
            const count = getReactionCount(reaction.id);
            const isUserReaction = getUserReaction()?.type === reaction.id;
            
            return (
              <div
                key={reaction.id}
                style={{ position: 'relative' }}
                onMouseEnter={() => setShowTooltip(reaction.id)}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <button
                  onClick={() => handleReaction(reaction.id)}
                  disabled={isUserReaction}
                  style={{
                    background: isUserReaction 
                      ? `linear-gradient(135deg, ${reaction.color}, ${shadeColor(reaction.color, -20)})`
                      : 'white',
                    border: `1px solid ${reaction.color}`,
                    color: isUserReaction ? 'white' : reaction.color,
                    borderRadius: '20px',
                    padding: '4px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: isUserReaction ? 'default' : 'pointer',
                    fontWeight: isUserReaction ? '500' : '400',
                    transition: 'all 0.2s',
                    opacity: isUserReaction ? 0.7 : 1
                  }}
                >
                  <span>{reaction.emoji}</span>
                  {count > 0 && <span>{count}</span>}
                </button>
                
                {showTooltip === reaction.id && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#333',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                    marginBottom: '5px',
                    zIndex: 10
                  }}>
                    {reaction.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div style={{
          fontSize: '0.9rem',
          color: '#666',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <span>✨</span>
          <span>{reactions.length} support{reactions.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      
      {/* Recent Supporters */}
      {reactions.length > 0 && (
        <div>
          <h3 style={{
            fontSize: '0.9rem',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#666'
          }}>
            Recent Supporters
          </h3>
          
          <div style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            padding: '5px 0'
          }}>
            {[...reactions].reverse().slice(0, 5).map(reaction => {
              const reactionType = REACTIONS.find(r => r.id === reaction.type);
              return (
                <div key={reaction.id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: reactionType.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.1rem'
                  }}>
                    {reactionType.emoji}
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    marginTop: '4px',
                    color: '#666'
                  }}>
                    {formatTimeAgo(reaction.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Confirmation */}
      {showConfirmation && (
        <div style={{
          marginTop: '10px',
          padding: '8px',
          backgroundColor: 'rgba(78, 205, 196, 0.1)',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#2e8b57',
          fontSize: '0.9rem'
        }}>
          ✅ Your support has been sent! Your friend's trust score increased.
        </div>
      )}
    </div>
  );
}

// Helper functions
function shadeColor(color, percent) {
  const f = parseInt(color.slice(1), 16);
  const t = percent < 0 ? 0 : 255;
  const p = percent < 0 ? percent * -1 : percent;
  const R = f >> 16;
  const G = f >> 8 & 0x00FF;
  const B = f & 0x0000FF;
  return '#' + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
}

function formatTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}