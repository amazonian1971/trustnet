import { useState, useEffect } from 'react';

export default function TrustRadarChart({ scores }) {
  const [animatedScores, setAnimatedScores] = useState({
    reliability: 0,
    honesty: 0,
    impact: 0,
    activity: 0,
    reciprocity: 0
  });
  
  const dimensions = [
    { key: 'reliability', label: 'Reliability', emoji: '✅' },
    { key: 'honesty', label: 'Honesty', emoji: '💬' },
    { key: 'impact', label: 'Impact', emoji: '🌟' },
    { key: 'activity', label: 'Activity', emoji: '🔄' },
    { key: 'reciprocity', label: 'Reciprocity', emoji: '🤝' }
  ];
  
  // Animate scores
  useEffect(() => {
    const animationDuration = 1500;
    const steps = 30;
    const interval = animationDuration / steps;
    
    const stepValues = {};
    Object.keys(scores).forEach(key => {
      stepValues[key] = scores[key] / steps;
    });
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep > steps) {
        clearInterval(timer);
        return;
      }
      
      setAnimatedScores(prev => {
        const newScores = {};
        Object.keys(scores).forEach(key => {
          newScores[key] = Math.min(scores[key], prev[key] + stepValues[key]);
        });
        return newScores;
      });
    }, interval);
    
    return () => clearInterval(timer);
  }, [scores]);

  // Calculate points for the radar chart
  const radius = 70;
  const centerX = 100;
  const centerY = 100;
  
  const getPoint = (angle, value) => {
    const r = radius * (value / 100);
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    return `${x},${y}`;
  };
  
  const points = dimensions.map((dim, i) => {
    const angle = (i * 2 * Math.PI / dimensions.length) - Math.PI/2;
    return getPoint(angle, animatedScores[dim.key]);
  }).join(' ');
  
  return (
    <div style={{ 
      width: '200px', 
      height: '200px', 
      position: 'relative' 
    }}>
      {/* Radar Chart SVG */}
      <svg 
        viewBox="0 0 200 200" 
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'absolute'
        }}
      >
        {/* Grid lines */}
        {[20, 40, 60, 80].map((level, i) => (
          <polygon
            key={i}
            points={dimensions.map((_, j) => {
              const angle = (j * 2 * Math.PI / dimensions.length) - Math.PI/2;
              return getPoint(angle, level);
            }).join(' ')}
            fill="none"
            stroke={i % 2 === 0 ? 'rgba(123, 66, 245, 0.2)' : 'rgba(123, 66, 245, 0.1)'}
            strokeWidth="0.5"
          />
        ))}
        
        {/* Dimension lines */}
        {dimensions.map((_, i) => {
          const angle = (i * 2 * Math.PI / dimensions.length) - Math.PI/2;
          return (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={centerX + radius * Math.cos(angle)}
              y2={centerY + radius * Math.sin(angle)}
              stroke="rgba(123, 66, 245, 0.15)"
              strokeWidth="0.5"
            />
          );
        })}
        
        {/* Data polygon */}
        <polygon
          points={points}
          fill="rgba(123, 66, 245, 0.2)"
          stroke="rgba(123, 66, 245, 0.7)"
          strokeWidth="1.5"
        />
        
        {/* Dimension labels */}
        {dimensions.map((dim, i) => {
          const angle = (i * 2 * Math.PI / dimensions.length) - Math.PI/2;
          const labelRadius = radius + 15;
          const x = centerX + labelRadius * Math.cos(angle);
          const y = centerY + labelRadius * Math.sin(angle);
          
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill="rgba(255, 255, 255, 0.7)"
              style={{ userSelect: 'none' }}
            >
              {dim.emoji} {dim.label}
            </text>
          );
        })}
      </svg>
      
      {/* Overall score */}
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
          {Math.round(
            Object.values(animatedScores).reduce((sum, val) => sum + val, 0) / 5
          )}%
        </div>
        <div style={{
          fontSize: '0.7rem',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          Trust Score
        </div>
      </div>
    </div>
  );
}