'use client';

import { useState, useEffect } from 'react';

export default function PWAInstaller() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if we're on a mobile device
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) return;
    
    // Check if browser supports PWA installation
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return; // Already installed
    
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the default prompt
      e.preventDefault();
      // Save the event for later
      setDeferredPrompt(e);
      // Show our custom install button
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Check if already installed
    window.addEventListener('appinstalled', () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <button
        onClick={handleInstallClick}
        className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-4 py-2 rounded-xl shadow-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
      >
        <span>+</span> Install TrustNet
      </button>
    </div>
  );
}