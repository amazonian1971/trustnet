'use client';

import { useState, useEffect } from 'react';

export default function Promis Engine() {
  const [darkMode, setDarkMode] = useState(false);
  const [promiseTitle, setPromiseTitle] = useState("Let's define your Promise");
  const [intentSummary, setIntentSummary] = useState("");
  const [emotionalTone, setEmotionalTone] = useState("🤝 Cooperative");
  const [taggedPeople, setTaggedPeople] = useState([]);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  
  // Load theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'true' : prefersDark;
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);
  
  // Glassmorphism effect helper
  const glassEffect = (dark) => ({
    background: dark 
      ? 'rgba(42, 0, 102, 0.3)' 
      : 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: dark 
      ? '1px solid rgba(123, 66, 245, 0.2)' 
      : '1px solid rgba(200, 200, 200, 0.2)',
  });
  
  // Tag button style
  const tagButtonStyle = (dark) => ({
    padding: '6px 12px',
    borderRadius: '20px',
    background: dark ? '#333' : '#f0f0f0',
    color: dark ? '#ddd' : '#333',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    flex: 1
  });
  
  // Add tagged person
  const addTaggedPerson = (type) => {
    const emojis = {
      'family': '👨‍👩‍👧‍👦',
      'friends': '👫',
      'colleagues': '👔'
    };
    
    const names = {
      'family': 'Family',
      'friends': 'Friends',
      'colleagues': 'Colleagues'
    };
    
    setTaggedPeople(prev => [
      ...prev.filter(p => p.type !== type),
      { type, name: names[type], emoji: emojis[type] }
    ]);
  };
  
  // Remove tagged person
  const removeTaggedPerson = (index) => {
    setTaggedPeople(prev => prev.filter((_, i) => i !== index));
  };
  
  // WhatsApp deep link
  const sendWhatsApp = () => {
    const message = encodeURIComponent(`I've made a promise on TrustNet: "${promiseTitle}". Would you like to be my accountability partner?`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };
  
  // SMS deep link
  const sendSMS = () => {
    const message = encodeURIComponent(`I've made a promise on TrustNet: "${promiseTitle}". Would you like to be my accountability partner?`);
    window.open(`sms:?&body=${message}`, '_blank');
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      backgroundColor: darkMode ? '#1a1a1a' : '#f8faff',
      color: darkMode ? '#e0e0e0' : '#1a3d30',
      borderRadius: '16px',
      ...glassEffect(darkMode)
    }}>
      <h1 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        textAlign: 'center',
        margin: '0 0 20px',
        background: darkMode 
          ? 'linear-gradient(90deg, #4ECDC4, #7B42F5)' 
          : 'linear-gradient(90deg, #4ECDC4, #2A0066)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        TRUSTNET AGREEMENT ENGINE
      </h1>
      
      {/* PROMISE Composer */}
      <div style={{
        backgroundColor: darkMode ? '#2a2a2a' : 'white',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: darkMode 
          ? '0 4px 20px rgba(0,0,0,0.25)' 
          : '0 4px 20px rgba(0,0,0,0.08)',
        ...glassEffect(darkMode)
      }}>
        <h2 style={{
          fontSize: '1.2rem',
          fontWeight: '600',
          marginBottom: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>🔐</span> PROMISE Composer
        </h2>
        
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            value={promiseTitle}
            onChange={(e) => setPromiseTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: darkMode ? '1px solid #444' : '1px solid #ddd',
              backgroundColor: darkMode ? '#333' : '#f8f8f8',
              color: darkMode ? '#fff' : '#333',
              fontSize: '1.1rem',
              fontWeight: '500'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'block',
            marginBottom: '6px',
            fontWeight: '500'
          }}>Tag Friends/Family/Colleagues</label>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '10px'
          }}>
            {taggedPeople.map((person, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: darkMode ? '#444' : '#e9e9e9',
                padding: '4px 8px',
                borderRadius: '20px'
              }}>
                <span>{person.emoji}</span>
                <span>{person.name}</span>
                <button 
                  onClick={() => removeTaggedPerson(i)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    marginLeft: '4px',
                    color: darkMode ? '#aaa' : '#666'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={() => addTaggedPerson('family')}
              style={tagButtonStyle(darkMode)}
            >
              👨‍👩‍👧‍👦 Family
            </button>
            <button
              onClick={() => addTaggedPerson('friends')}
              style={tagButtonStyle(darkMode)}
            >
              👫 Friends
            </button>
            <button
              onClick={() => addTaggedPerson('colleagues')}
              style={tagButtonStyle(darkMode)}
            >
              👔 Colleagues
            </button>
          </div>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'block',
            marginBottom: '6px',
            fontWeight: '500'
          }}>Intent Summary</label>
          <textarea
            placeholder="Describe your promise in your own words..."
            value={intentSummary}
            onChange={(e) => setIntentSummary(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: darkMode ? '1px solid #444' : '1px solid #ddd',
              backgroundColor: darkMode ? '#333' : '#f8f8f8',
              color: darkMode ? '#fff' : '#333',
              resize: 'vertical'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'block',
            marginBottom: '6px',
            fontWeight: '500'
          }}>Emotional Tone</label>
          <div style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            {['🤝 Cooperative', '💪 Motivational', '📚 Academic', '❤️ Supportive'].map((tone) => (
              <button
                key={tone}
                onClick={() => setEmotionalTone(tone)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: emotionalTone === tone 
                    ? 'linear-gradient(135deg, #4ECDC4, #7B42F5)' 
                    : darkMode ? '#333' : '#f0f0f0',
                  color: emotionalTone === tone ? 'white' : darkMode ? '#ddd' : '#333',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <button
            onClick={() => setShowWhatsApp(!showWhatsApp)}
            style={{
              background: 'none',
              border: '1px solid',
              borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            📱 WhatsApp/SMS
          </button>
          <button
            style={{
              background: 'linear-gradient(135deg, #4ECDC4, #7B42F5)',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Create Promise
          </button>
        </div>
        
        {/* WhatsApp/SMS Deep Linking */}
        {showWhatsApp && (
          <div style={{
            marginTop: '15px',
            padding: '15px',
            backgroundColor: darkMode ? 'rgba(78, 205, 196, 0.1)' : 'rgba(78, 205, 196, 0.05)',
            borderRadius: '12px'
          }}>
            <p style={{ margin: '0 0 10px', fontWeight: '500' }}>
              Share your promise via:
            </p>
            <div style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={sendWhatsApp}
                style={{
                  background: '#25D366',
                  color: 'white',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>💬</span> WhatsApp
              </button>
              <button
                onClick={sendSMS}
                style={{
                  background: darkMode ? '#333' : '#f0f0f0',
                  color: darkMode ? '#ddd' : '#333',
                  border: '1px solid',
                  borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                  padding: '8px 15px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>📱</span> SMS
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Reputation Dashboard */}
      <div style={{
        backgroundColor: darkMode ? '#2a2a2a' : 'white',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: darkMode 
          ? '0 4px 20px rgba(0,0,0,0.25)' 
          : '0 4px 20px rgba(0,0,0,0.08)',
        ...glassEffect(darkMode)
      }}>
        <h2 style={{
          fontSize: '1.2rem',
          fontWeight: '600',
          marginBottom: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>🧭</span> Reputation Dashboard
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '15px',
          marginBottom: '20px'
        }}>
          {/* Trust Score */}
          <div style={{
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #4ECDC4, #7B42F5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '5px'
            }}>
              87
              <span style={{ 
                fontSize: '1.2rem', 
                marginLeft: '5px',
                color: darkMode ? '#4ECDC4' : '#4ECDC4'
              }}>🟢</span>
            </div>
            <div style={{ 
              fontSize: '0.9rem', 
              color: darkMode ? '#aaa' : '#666' 
            }}>
              Trust Score
            </div>
          </div>
          
          {/* Endorsements */}
          <div style={{
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: darkMode ? '#4ECDC4' : '#2A0066',
              marginBottom: '5px'
            }}>
              12
            </div>
            <div style={{ 
              fontSize: '0.9rem', 
              color: darkMode ? '#aaa' : '#666' 
            }}>
              Endorsements
            </div>
          </div>
          
          {/* Recent Agreements */}
          <div style={{
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: darkMode ? '#FFD166' : '#2e8b57',
              marginBottom: '5px'
            }}>
              5
            </div>
            <div style={{ 
              fontSize: '0.9rem', 
              color: darkMode ? '#aaa' : '#666' 
            }}>
              Recent Agreements
            </div>
          </div>
        </div>
        
        {/* Trust Progress Chart */}
        <div style={{ 
          position: 'relative', 
          height: '120px',
          marginBottom: '15px'
        }}>
          <svg viewBox="0 0 360 120" style={{ width: '100%', height: '100%' }}>
            {/* Base circle */}
            <circle
              cx="180"
              cy="60"
              r="50"
              fill="none"
              stroke={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="8"
            />
            
            {/* Progress arc */}
            <path
              d="M 180 10 A 50 50 0 0 1 229.2 109.2"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="8"
              strokeDasharray="314"
              strokeDashoffset="43.96"
              strokeLinecap="round"
            />
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4ECDC4" />
                <stop offset="100%" stopColor="#7B42F5" />
              </linearGradient>
            </defs>
          </svg>
          
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #4ECDC4, #7B42F5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              87%
            </div>
            <div style={{ 
              fontSize: '0.8rem', 
              color: darkMode ? '#aaa' : '#666' 
            }}>
              Trust Level
            </div>
          </div>
        </div>
        
        {/* Trust Breakdown */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.9rem'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            color: darkMode ? '#aaa' : '#666'
          }}>
            <span style={{ 
              display: 'inline-block', 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              background: '#4ECDC4',
              marginRight: '5px'
            }}></span>
            Reliability
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            color: darkMode ? '#aaa' : '#666'
          }}>
            <span style={{ 
              display: 'inline-block', 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              background: '#7B42F5',
              marginRight: '5px'
            }}></span>
            Integrity
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            color: darkMode ? '#aaa' : '#666'
          }}>
            <span style={{ 
              display: 'inline-block', 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              background: '#FFD166',
              marginRight: '5px'
            }}></span>
            Impact
          </div>
        </div>
      </div>
      
      {/* Intent Clarifier */}
      <div style={{
        backgroundColor: darkMode ? '#2a2a2a' : 'white',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: darkMode 
          ? '0 4px 20px rgba(0,0,0,0.25)' 
          : '0 4px 20px rgba(0,0,0,0.08)',
        ...glassEffect(darkMode),
        borderLeft: '4px solid #FF6B6B'
      }}>
        <h2 style={{
          fontSize: '1.2rem',
          fontWeight: '600',
          marginBottom: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>💬</span> Intent Clarifier
        </h2>
        
        <div style={{
          backgroundColor: darkMode ? 'rgba(255, 107, 107, 0.1)' : 'rgba(255, 107, 107, 0.05)',
          borderRadius: '12px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <p style={{ 
            margin: '0',
            color: darkMode ? '#FF6B6B' : '#D32F2F',
            fontStyle: 'italic'
          }}>
            "We noticed some ambiguity in your promise. Consider clarifying:"
          </p>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            backgroundColor: darkMode ? '#333' : '#f8f8f8',
            borderRadius: '12px',
            padding: '15px',
            marginBottom: '10px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '8px' 
            }}>
              <span style={{ 
                fontSize: '1.2rem',
                color: darkMode ? '#FFD166' : '#FF9800'
              }}>⚠️</span>
              <strong>Suggestion</strong>
            </div>
            <p style={{ margin: '0', color: darkMode ? '#ddd' : '#333' }}>
              "Instead of 'I'll try to call Mom weekly,' consider: 'I will call Mom every Sunday at 5 PM for 20+ minutes'"
            </p>
          </div>
          
          <div style={{
            backgroundColor: darkMode ? '#333' : '#f8f8f8',
            borderRadius: '12px',
            padding: '15px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '8px' 
            }}>
              <span style={{ 
                fontSize: '1.2rem',
                color: darkMode ? '#4ECDC4' : '#2e8b57'
              }}>💡</span>
              <strong>Alternative</strong>
            </div>
            <p style={{ margin: '0', color: darkMode ? '#ddd' : '#333' }}>
              "Commit to a specific duration: 'I will journal for 10 minutes every morning before checking my phone'"
            </p>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button style={{
            background: 'linear-gradient(135deg, #4ECDC4, #7B42F5)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>✨</span> Clarify Promise
          </button>
        </div>
      </div>
      
      {/* Momentum Tracker */}
      <div style={{
        backgroundColor: darkMode ? '#2a2a2a' : 'white',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: darkMode 
          ? '0 4px 20px rgba(0,0,0,0.25)' 
          : '0 4px 20px rgba(0,0,0,0.08)',
        ...glassEffect(darkMode)
      }}>
        <h2 style={{
          fontSize: '1.2rem',
          fontWeight: '600',
          marginBottom: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>🚀</span> Momentum Tracker
        </h2>
        
        <div style={{ marginBottom: '15px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '6px'
          }}>
            <span style={{ 
              fontWeight: '500',
              color: darkMode ? '#ddd' : '#333'
            }}>Promise Status</span>
            <span style={{ 
              background: darkMode ? 'rgba(78, 205, 196, 0.15)' : 'rgba(78, 205, 196, 0.1)',
              color: darkMode ? '#4ECDC4' : '#2e8b57',
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '0.85rem'
            }}>Drafting</span>
          </div>
          <div style={{
            height: '8px',
            borderRadius: '4px',
            backgroundColor: darkMode ? '#333' : '#e0e0e0',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: '35%',
              background: 'linear-gradient(90deg, #4ECDC4, #7B42F5)',
              borderRadius: '4px'
            }}></div>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '4px',
            fontSize: '0.8rem',
            color: darkMode ? '#aaa' : '#666'
          }}>
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '6px'
          }}>
            <span style={{ 
              fontSize: '1.2rem'
            }}>🔄</span>
            <span style={{ 
              fontWeight: '500',
              color: darkMode ? '#ddd' : '#333'
            }}>Next Step</span>
          </div>
          <div style={{
            backgroundColor: darkMode ? 'rgba(78, 205, 196, 0.1)' : 'rgba(78, 205, 196, 0.05)',
            borderRadius: '12px',
            padding: '12px',
            color: darkMode ? '#4ECDC4' : '#2e8b57'
          }}>
            Invite friends/family member/colleagues
          </div>
        </div>
        
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '6px'
          }}>
            <span style={{ 
              fontSize: '1.2rem'
            }}>⏰</span>
            <span style={{ 
              fontWeight: '500',
              color: darkMode ? '#ddd' : '#333'
            }}>Timeframe</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: darkMode ? '#333' : '#f0f0f0',
              padding: '6px 12px',
              borderRadius: '8px'
            }}>
              <span>🗓️</span>
              <span>Aug 28 - Sep 4</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: darkMode ? '#333' : '#f0f0f0',
              padding: '6px 12px',
              borderRadius: '8px'
            }}>
              <span>⏳</span>
              <span>6 days left</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Emotional Audit Trail */}
      <div style={{
        backgroundColor: darkMode ? '#2a2a2a' : 'white',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: darkMode 
          ? '0 4px 20px rgba(0,0,0,0.25)' 
          : '0 4px 20px rgba(0,0,0,0.08)',
        ...glassEffect(darkMode)
      }}>
        <h2 style={{
          fontSize: '1.2rem',
          fontWeight: '600',
          marginBottom: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>🧠</span> Emotional Audit Trail
        </h2>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {/* Timeline */}
          <div style={{
            position: 'relative',
            paddingLeft: '30px',
            marginLeft: '10px'
          }}>
            {/* Timeline line */}
            <div style={{
              position: 'absolute',
              left: '0',
              top: '15px',
              bottom: '15px',
              width: '2px',
              background: 'linear-gradient(to bottom, #4ECDC4, #7B42F5)',
              zIndex: '1'
            }}></div>
            
            {/* Timeline items */}
            {[
              { date: 'Aug 28', sentiment: 'Optimistic', emoji: '😊', color: '#4ECDC4' },
              { date: 'Aug 30', sentiment: 'Concerned', emoji: '😟', color: '#FF6B6B' },
              { date: 'Aug 31', sentiment: 'Aligned', emoji: '🤝', color: '#7B42F5' }
            ].map((item, index) => (
              <div 
                key={index} 
                style={{
                  position: 'relative',
                  marginBottom: index < 2 ? '30px' : '0',
                  zIndex: '2'
                }}
              >
                {/* Timeline dot */}
                <div style={{
                  position: 'absolute',
                  left: '-23px',
                  top: '12px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: item.color,
                  border: `2px solid ${darkMode ? '#2a2a2a' : 'white'}`
                }}></div>
                
                {/* Item content */}
                <div style={{
                  backgroundColor: darkMode 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.02)',
                  padding: '12px',
                  borderRadius: '12px',
                  border: darkMode 
                    ? `1px solid rgba(${hexToRgb(item.color)}, 0.2)` 
                    : `1px solid ${item.color}`
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px'
                  }}>
                    <span style={{ 
                      fontWeight: '500',
                      color: darkMode ? '#ddd' : '#333'
                    }}>{item.date}</span>
                    <span style={{ 
                      fontSize: '1.2rem'
                    }}>{item.emoji}</span>
                  </div>
                  <div style={{ 
                    color: item.color,
                    fontWeight: '500'
                  }}>
                    {item.sentiment}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Add New Entry */}
          <div style={{
            display: 'flex',
            gap: '10px'
          }}>
            <input
              type="text"
              placeholder="Add a new sentiment note..."
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '8px',
                border: darkMode ? '1px solid #444' : '1px solid #ddd',
                backgroundColor: darkMode ? '#333' : '#f8f8f8',
                color: darkMode ? '#fff' : '#333'
              }}
            />
            <button style={{
              background: 'linear-gradient(135deg, #4ECDC4, #7B42F5)',
              color: 'white',
              border: 'none',
              padding: '0 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}>
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to convert hex color to RGB
function hexToRgb(hex) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
}