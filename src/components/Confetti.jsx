'use client';

import { useEffect, useRef } from 'react';

export default function Confetti({ active, onComplete, emojis = ['🌱', '✨', '🎉'] }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!active || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = window.innerWidth;
    const height = canvas.height = 200;
    
    const confettiCount = 150;
    const confetti = [];
    
    // Create confetti pieces
    for (let i = 0; i < confettiCount; i++) {
      confetti.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        size: Math.random() * 10 + 5,
        speed: Math.random() * 3 + 1,
        angle: Math.random() * Math.PI * 2,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 2 - 1,
        emoji: emojis[Math.floor(Math.random() * emojis.length)]
      });
    }
    
    let animationFrame;
    let startTime;
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      
      ctx.clearRect(0, 0, width, height);
      
      let allConfettiFell = true;
      
      confetti.forEach(piece => {
        // Move confetti
        piece.y += piece.speed;
        piece.x += Math.sin(piece.angle) * 0.5;
        piece.rotation += piece.rotationSpeed;
        
        // Draw emoji
        ctx.font = `${piece.size}px Arial`;
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rotation * Math.PI / 180);
        ctx.fillText(piece.emoji, -piece.size/2, piece.size/3);
        ctx.restore();
        
        if (piece.y < height) {
          allConfettiFell = false;
        }
      });
      
      // Continue animation or complete
      if (!allConfettiFell && progress < 3000) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [active, emojis, onComplete]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '200px',
      pointerEvents: 'none',
      zIndex: 9999
    }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          height: '100%' 
        }} 
      />
    </div>
  );
}

