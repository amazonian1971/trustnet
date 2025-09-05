'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, onSnapshot, updateDoc, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Helper function to convert Firestore date objects to JavaScript Date objects
const convertFirestoreDate = (date: any) => {
  if (!date) return null;
  if (date instanceof Date) return date;
  if (date.toDate && typeof date.toDate === 'function') return date.toDate();
  if (typeof date === 'string') return new Date(date);
  if (typeof date === 'number') return new Date(date);
  return null;
};

// Trust-focused helper functions
const calculateTrustImpact = (interactionType: string) => {
  const impacts: Record<string, number> = {
    'promise-completion': 3,
    'support-reaction': 2,
    'promise-sharing': 2,
    'nudge-sent': 1,
    'clarification': 1,
    'confirmation': 2,
    'circle-creation': 2,
    'deletion': -1
  };
  return impacts[interactionType] || 1;
};

// Reminder system functions
const getReminderMessage = (promises: any[]) => {
  const activePromises = promises.filter(p => p.status === 'active' || p.status === 'drafting');
  
  if (activePromises.length === 0) return null;
  
  const urgentPromises = activePromises.filter(p => {
    const deadline = convertFirestoreDate(p.deadline);
    const today = new Date();
    const diffTime = Math.abs(deadline - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays <= 2;
  });
  
  if (urgentPromises.length > 0) {
    return `You have ${urgentPromises.length} promise${urgentPromises.length > 1 ? 's' : ''} due soon!`;
  }
  
  return `Don't forget about your active promises!`;
};

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [growthLevel, setGrowthLevel] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [emoji, setEmoji] = useState('🌱');
  const [promises, setPromises] = useState<any[]>([]);
  const [selectedPromise, setSelectedPromise] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('active');
  const [activeFeedTab, setActiveFeedTab] = useState('all');
  const [feedSort, setFeedSort] = useState('recent');
  const [darkMode, setDarkMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showLaunchSequence, setShowLaunchSequence] = useState(false);
  const [newPromise, setNewPromise] = useState<any>(null);
  const [taggedContacts, setTaggedContacts] = useState<any[]>([]);
  const [contactInput, setContactInput] = useState('');
  const [showContactModal, setShowContactModal] = useState<{ 
    visible: boolean; 
    type: string;
    forCircle: boolean;
  }>({ 
    visible: false, 
    type: 'phone',
    forCircle: false
  });
  const [trustScore, setTrustScore] = useState(0);
  const [showTrustRipple, setShowTrustRipple] = useState(false);
  const [showTrustCircleModal, setShowTrustCircleModal] = useState(false);
  const [circleName, setCircleName] = useState('');
  const [circleDescription, setCircleDescription] = useState('');
  const [circleMembers, setCircleMembers] = useState<any[]>([]);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  const router = useRouter();
  const promiseCardRef = useRef<any>(null);
  const trustBarRef = useRef<any>(null);
  const chatbotRef = useRef<any>(null);
  const onboardingRef = useRef<any>(null);
  const reminderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reminderIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Error boundary effect
  useEffect(() => {
    if (hasError) {
      console.error('TrustNet Dashboard encountered an error');
    }
  }, [hasError]);

  // Helper function to get filtered and sorted posts
  const getFilteredAndSortedPosts = () => {
    let filteredPosts: any[] = [];
    
    if (activeFeedTab === 'all') {
      filteredPosts = [...promises];
    } else if (activeFeedTab === 'friends') {
      filteredPosts = promises.filter(p => 
        p.taggedContacts && p.taggedContacts.some((c: any) => 
          c.value === user?.email || 
          (user?.phoneNumber && c.value.includes(user.phoneNumber))
        )
      );
    } else if (activeFeedTab === 'trust-circles') {
      filteredPosts = promises.filter(p => p.trustCircleId);
    }
    
    if (feedSort === 'recent') {
      return filteredPosts.sort((a, b) => 
        (b.createdAt || new Date()).getTime() - (a.createdAt || new Date()).getTime()
      );
    } else if (feedSort === 'trust') {
      return filteredPosts.sort((a, b) => 
        calculateTrustImpact(a.status) - calculateTrustImpact(b.status)
      );
    } else if (feedSort === 'completion') {
      return filteredPosts.sort((a, b) => 
        (b.progress || '').localeCompare(a.progress || '')
      );
    }
    
    return filteredPosts;
  };

  // Load theme
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'true' : prefersDark;
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/auth');
      } else {
        setUser(user);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Load user activity and trust score from Firestore
  useEffect(() => {
    if (!user) return;
    
    const loadUserActivity = async () => {
      try {
        // Load user activity from Firestore
        const activityDoc = await getDoc(doc(db, 'userActivity', user.uid));
        
        if (activityDoc.exists()) {
          const activity = activityDoc.data();
          setTrustScore(activity.trustScore || 0);
          setStreak(activity.streak || 0);
          setHasCompletedOnboarding(activity.hasCompletedOnboarding || false);
          
          // Only show onboarding if not completed
          if (!activity.hasCompletedOnboarding) {
            setShowOnboarding(true);
          }
        } else {
          // New user - create initial activity record
          await setDoc(doc(db, 'userActivity', user.uid), {
            firstVisit: new Date().toISOString(),
            promisesCreated: 0,
            trustScore: 0,
            streak: 0,
            hasCompletedOnboarding: false
          });
          
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error("Error loading user activity:", error);
        // Fallback to basic setup if Firestore fails
        setTrustScore(0);
        setStreak(0);
        setShowOnboarding(true);
      }
    };
    
    loadUserActivity();
  }, [user]);

  // Tree growth based on trust
  useEffect(() => {
    const level = Math.min(5, Math.floor(trustScore / 20));
    setGrowthLevel(level);
  }, [trustScore]);

  // Listen to user's promises only
  useEffect(() => {
    if (!user) return;
    
    setIsLoading(true);
    
    // Only get promises for the current user
    const q = query(
      collection(db, 'promises'),
      where('ownerId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const list = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Convert Firestore dates to JS dates
        const processedData = {
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          deadline: data.deadline?.toDate ? data.deadline.toDate() : data.deadline
        };
        
        list.push({ 
          id: doc.id, 
          ...processedData
        });
      });
      
      setPromises(list);
      setIsLoading(false);
      
      // Update user activity in Firestore
      if (user) {
        updateDoc(doc(db, 'userActivity', user.uid), {
          promisesCreated: list.length,
          trustScore: trustScore,
          streak: streak
        }).catch(console.error);
      }
    }, (error) => {
      console.error("Error fetching promises:", error);
      setIsLoading(false);
      setHasError(true);
    });
    
    return () => unsubscribe();
  }, [user, trustScore, streak]);

  // Reminder System - Beautiful, non-intrusive notifications
  useEffect(() => {
    // Check if browser supports notifications
    const canShowNotifications = 'Notification' in window && Notification.permission === 'granted';
    
    // Function to show a reminder
    const showReminder = () => {
      const message = getReminderMessage(promises);
      if (!message) return;
      
      setReminderMessage(message);
      setShowReminder(true);
      
      // Auto-hide after 5 seconds
      if (reminderTimeoutRef.current) {
        clearTimeout(reminderTimeoutRef.current);
      }
      
      reminderTimeoutRef.current = setTimeout(() => {
        setShowReminder(false);
        reminderTimeoutRef.current = null;
      }, 5000);
      
      // Show browser notification if permitted
      if (canShowNotifications) {
        new Notification('TrustNet Reminder', {
          body: message,
          icon: '/icon-192.png'
        });
      }
    };
    
    // Initial check
    showReminder();
    
    // Set up interval to check every 20 minutes
    reminderIntervalRef.current = setInterval(showReminder, 20 * 60 * 1000);
    
    // Cleanup on unmount
    return () => {
      if (reminderTimeoutRef.current) {
        clearTimeout(reminderTimeoutRef.current);
      }
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
      }
    };
  }, [promises]);

  // Request notification permission (only once)
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            console.log('Notification permission granted');
          }
        });
      }
    }
  }, []);

  // Add tagged contact
  const handleAddContact = () => {
    if (!contactInput.trim()) return;
    
    // Detect if it's an email or phone number
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInput.trim());
    
    setTaggedContacts(prev => [
      ...prev,
      { 
        value: contactInput.trim(), 
        type: isEmail ? 'email' : 'phone'
      }
    ]);
    
    setContactInput('');
    setShowContactModal({ visible: false, type: 'phone', forCircle: showContactModal.forCircle });
  };

  // Add circle member
  const handleAddCircleMember = () => {
    if (!contactInput.trim()) return;
    
    // Detect if it's an email or phone number
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInput.trim());
    
    // Check if member already exists
    if (circleMembers.some(m => m.value === contactInput.trim())) {
      alert('This contact is already in your Trust Circle');
      return;
    }
    
    // Check member limit (3-5 total including creator)
    if (circleMembers.length >= 4) {
      alert('Trust Circles can only have up to 5 members total (including you)');
      return;
    }
    
    setCircleMembers(prev => [
      ...prev,
      { 
        value: contactInput.trim(), 
        type: isEmail ? 'email' : 'phone'
      }
    ]);
    
    setContactInput('');
  };

  // Remove tagged contact
  const removeTaggedContact = (index: number) => {
    setTaggedContacts(prev => prev.filter((_, i) => i !== index));
  };

  // Remove circle member
  const removeCircleMember = (index: number) => {
    setCircleMembers(prev => prev.filter((_, i) => i !== index));
  };

  // WhatsApp deep link - FIXED
  const sendWhatsApp = (phone: string) => {
    // Clean phone number and ensure it has country code
    let cleanedPhone = phone.replace(/\D/g, '');
    
    // If phone number starts with 0 but doesn't have country code, remove the 0
    if (cleanedPhone.startsWith('0') && cleanedPhone.length > 10) {
      cleanedPhone = cleanedPhone.substring(1);
    }
    
    // If phone number doesn't have country code, add default US code
    if (cleanedPhone.length === 10) {
      cleanedPhone = '1' + cleanedPhone;
    }
    
    // If phone number is still too short, show error
    if (cleanedPhone.length < 11) {
      alert('Please enter a valid phone number with country code (e.g., +15551234567)');
      return;
    }
    
    // Ensure it starts with country code
    if (!cleanedPhone.startsWith('+')) {
      cleanedPhone = '+' + cleanedPhone;
    }
    
    const message = encodeURIComponent(`I've made a promise on TrustNet: "${title}". Would you like to be my accountability partner?`);
    window.open(`https://wa.me/${cleanedPhone.replace('+', '')}?text=${message}`, '_blank');
  };

  // SMS deep link - FIXED
  const sendSMS = (phone: string) => {
    // Clean phone number
    let cleanedPhone = phone.replace(/\D/g, '');
    
    // If phone number starts with 0 but doesn't have country code, remove the 0
    if (cleanedPhone.startsWith('0') && cleanedPhone.length > 10) {
      cleanedPhone = cleanedPhone.substring(1);
    }
    
    // If phone number doesn't have country code, add default US code
    if (cleanedPhone.length === 10) {
      cleanedPhone = '1' + cleanedPhone;
    }
    
    // If phone number is still too short, show error
    if (cleanedPhone.length < 11) {
      alert('Please enter a valid phone number with country code (e.g., +15551234567)');
      return;
    }
    
    // Ensure it starts with country code
    if (!cleanedPhone.startsWith('+')) {
      cleanedPhone = '+' + cleanedPhone;
    }
    
    const message = encodeURIComponent(`I've made a promise on TrustNet: "${title}". Would you like to be my accountability partner?`);
    window.open(`sms:${cleanedPhone}?&body=${message}`, '_blank');
  };

  // Email deep link - FIXED
  const sendEmail = (email: string) => {
    const subject = encodeURIComponent("Join me in my TrustNet promise");
    const body = encodeURIComponent(`Hi,\n\nI've made a promise on TrustNet: "${title}". Would you like to be my accountability partner?\n\nCheck it out: [TrustNet Link]`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  // Start cinematic launch sequence
  const startLaunchSequence = (promise: any) => {
    setNewPromise(promise);
    setShowLaunchSequence(true);
    
    // Animate trust score ripple with meaningful impact
    const impact = calculateTrustImpact('promise-completion');
    setTrustScore(prev => Math.min(100, prev + impact));
    setShowTrustRipple(true);
    
    // Update streak
    setStreak(prev => prev + 1);
    
    // Show confetti for trust-building moments
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    
    // Complete sequence after animation
    setTimeout(() => {
      setShowLaunchSequence(false);
      setNewPromise(null);
      setActiveTab('active');
    }, 2000);
  };

  // Save promise
  const handleSavePromise = async () => {
    if (!title || !deadline) {
      alert('Please enter title and deadline');
      return;
    }
    
    try {
      // Save the promise to Firestore
      const docRef = await addDoc(collection(db, 'promises'), {
        title,
        emoji,
        deadline: new Date(deadline),
        status: 'active',
        ownerId: user.uid,
        createdAt: new Date(),
        progress: 'Day 1',
        taggedContacts: taggedContacts,
        trustCircleId: null,
        emotionalTone: 'Motivational'
      });
      
      // Create a complete promise object for animation
      const newPromiseObj = {
        id: docRef.id,
        title,
        emoji,
        deadline: new Date(deadline),
        status: 'active',
        ownerId: user.uid,
        createdAt: new Date(),
        progress: 'Day 1',
        taggedContacts: taggedContacts,
        trustCircleId: null,
        emotionalTone: 'Motivational'
      };
      
      // Start cinematic launch sequence
      startLaunchSequence(newPromiseObj);
      
      // Process contacts
      for (const contact of taggedContacts) {
        if (contact.type === 'phone') {
          setTimeout(() => {
            if (window.confirm(`📱 Send WhatsApp message to ${contact.value}?`)) {
              sendWhatsApp(contact.value);
            }
          }, 500);
        } else {
          setTimeout(() => {
            if (window.confirm(`✉️ Send email to ${contact.value}?`)) {
              sendEmail(contact.value);
            }
          }, 500);
        }
      }
      
      alert('✅ Promise planted!');
      setShowModal(false);
      setTaggedContacts([]);
      setContactInput('');
      setTitle('');
      setDeadline('');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // Handle button actions for promises
  const handleClarify = async (promise: any) => {
    try {
      await updateDoc(doc(db, 'promises', promise.id), {
        status: 'drafting',
        progress: 'Clarifying details'
      });
      
      // Impact trust score for meaningful clarification
      const impact = calculateTrustImpact('clarification');
      setTrustScore(prev => Math.min(100, prev + impact));
      setShowTrustRipple(true);
      
      alert('Status updated to "Clarifying details"');
    } catch (error) {
      alert('Error updating promise: ' + error.message);
    }
  };

  const handleRemindLater = async (promise: any) => {
    try {
      await updateDoc(doc(db, 'promises', promise.id), {
        progress: `Day ${Math.floor(Math.random() * 5) + 3} (Reminder set)`
      });
      alert('Reminder set for later');
    } catch (error) {
      alert('Error updating promise: ' + error.message);
    }
  };

  const handleConfirm = async (promise: any) => {
    try {
      await updateDoc(doc(db, 'promises', promise.id), {
        status: 'aligned',
        progress: 'Confirmed'
      });
      
      // Update trust score with meaningful impact
      const impact = calculateTrustImpact('confirmation');
      setTrustScore(prev => Math.min(100, prev + impact));
      setShowTrustRipple(true);
      
      // Show confetti for trust-building moments
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      alert('✅ Agreement confirmed! You\'ve built clarity together.');
    } catch (error) {
      alert('Error confirming agreement: ' + error.message);
    }
  };

  const handleAddNotes = (promise: any) => {
    setSelectedPromise(promise);
  };

  // Delete promise functionality - FIXED
  const handleDeletePromise = async (promise: any) => {
    if (!window.confirm("Are you sure you want to delete this promise? This cannot be undone.")) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'promises', promise.id));
      
      // Impact trust score for deletion
      const impact = calculateTrustImpact('deletion');
      setTrustScore(prev => Math.max(0, prev + impact));
      setShowTrustRipple(true);
      
      alert('Promise deleted successfully!');
      
      // If it was the selected promise, clear the selection
      if (selectedPromise && selectedPromise.id === promise.id) {
        setSelectedPromise(null);
      }
    } catch (error) {
      alert('Error deleting promise: ' + error.message);
    }
  };

  const handleSendNudge = async (promise: any) => {
    try {
      // Enhanced validation
      if (!promise || !promise.id) {
        console.error('Invalid promise object:', promise);
        alert('Error: Invalid promise object. Please refresh the page and try again.');
        return;
      }
      
      // Update the progress in Firestore
      await updateDoc(doc(db, 'promises', promise.id), {
        progress: `Day ${Math.floor(Math.random() * 5) + 4} (Nudge sent)`
      });
      
      // Check if there are tagged contacts
      const hasValidContacts = promise.taggedContacts && Array.isArray(promise.taggedContacts) && promise.taggedContacts.length > 0;
      
      if (!hasValidContacts) {
        alert('No contacts to send nudge to. Please add contacts to your promise.');
        return;
      }
      
      // Send nudge to each tagged contact
      let nudgeCount = 0;
      for (const contact of promise.taggedContacts) {
        if (!contact || !contact.value || !contact.type) continue;
        
        if (contact.type === 'phone') {
          if (window.confirm(`📱 Send nudge to ${contact.value}?`)) {
            const message = encodeURIComponent(`Just checking in about our agreement: "${promise.title}"`);
            window.open(`https://wa.me/${contact.value.replace(/\D/g, '')}?text=${message}`, '_blank');
            nudgeCount++;
          }
        } else if (contact.type === 'email') {
          if (window.confirm(`✉️ Send nudge to ${contact.value}?`)) {
            const subject = encodeURIComponent("Following up on our agreement");
            const body = encodeURIComponent(`Hi,\n\nJust checking in about our agreement: "${promise.title}"\n\nLet me know if you need anything from my end.\n\nBest regards,\nTrustNet`);
            window.open(`mailto:${contact.value}?subject=${subject}&body=${body}`, '_blank');
            nudgeCount++;
          }
        }
      }
      
      if (nudgeCount > 0) {
        // Impact trust score for meaningful nudges
        const impact = calculateTrustImpact('nudge-sent');
        setTrustScore(prev => Math.min(100, prev + impact));
        setShowTrustRipple(true);
        
        alert(`✅ Nudge sent successfully to ${nudgeCount} contact${nudgeCount > 1 ? 's' : ''}!`);
      } else {
        alert('No nudges were sent. All contacts were skipped or invalid.');
      }
    } catch (error) {
      console.error('Error sending nudge:', error);
      
      // User-friendly error message
      let errorMessage = 'Error sending nudge';
      if (error.message.includes('permission-denied')) {
        errorMessage += ': You don\'t have permission to update this promise';
      } else if (error.message.includes('not-found')) {
        errorMessage += ': Promise not found in database';
      } else if (error.message.includes('invalid-argument')) {
        errorMessage += ': Invalid data format';
      }
      
      alert(errorMessage + '. Please try again or contact support.');
    }
  };

  const handleSkipNudge = async (promise: any) => {
    try {
      // Enhanced validation
      if (!promise || !promise.id) {
        console.error('Invalid promise object:', promise);
        alert('Error: Invalid promise object. Please refresh the page and try again.');
        return;
      }
      
      // Update the progress in Firestore
      await updateDoc(doc(db, 'promises', promise.id), {
        progress: `Day ${Math.floor(Math.random() * 5) + 4} (Skipped)`
      });
      
      alert('✅ Nudge skipped. Agreement remains active.');
    } catch (error) {
      console.error('Error skipping nudge:', error);
      
      // User-friendly error message
      let errorMessage = 'Error skipping nudge';
      if (error.message.includes('permission-denied')) {
        errorMessage += ': You don\'t have permission to update this promise';
      } else if (error.message.includes('not-found')) {
        errorMessage += ': Promise not found in database';
      } else if (error.message.includes('invalid-argument')) {
        errorMessage += ': Invalid data format';
      }
      
      alert(errorMessage + '. Please try again or contact support.');
    }
  };

  const handleReviewAgreement = (promise: any) => {
    setSelectedPromise(promise);
  };
  
  // Handle trust score updates from social components
  const handleTrustScoreUpdate = (interactionType: string) => {
    const points = calculateTrustImpact(interactionType);
    setTrustScore(prev => Math.min(100, prev + points));
    setShowTrustRipple(true);
    
    // Show confetti for significant trust score increases
    if (points >= 2) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  // Handle Trust Circle creation
  const handleCreateTrustCircle = async () => {
    if (!circleName.trim()) {
      alert('Please enter a name for your Trust Circle');
      return;
    }
    
    if (circleMembers.length < 2 || circleMembers.length > 4) {
      alert('Trust Circles must have between 3 and 5 members total (including you)');
      return;
    }
    
    try {
      // Save the Trust Circle to Firestore
      const docRef = await addDoc(collection(db, 'trustCircles'), {
        name: circleName,
        description: circleDescription,
        ownerId: user.uid,
        members: [
          { uid: user.uid, role: 'owner', name: user.displayName || 'You' },
          ...circleMembers.map(contact => ({
            value: contact.value,
            type: contact.type,
            role: 'member'
          }))
        ],
        createdAt: new Date(),
        trustScoreImpact: 2
      });
      
      // Update trust score for creating a meaningful circle
      const impact = calculateTrustImpact('circle-creation');
      setTrustScore(prev => Math.min(100, prev + impact));
      setShowTrustRipple(true);
      
      alert(`✅ Trust Circle "${circleName}" created!`);
      setShowTrustCircleModal(false);
      setCircleName('');
      setCircleDescription('');
      setCircleMembers([]);
      
      // Optionally send invites to members
      circleMembers.forEach(contact => {
        if (contact.type === 'phone') {
          if (window.confirm(`Send invitation to ${contact.value}?`)) {
            const message = encodeURIComponent(
              `You've been invited to join "${circleName}" Trust Circle on TrustNet! ` +
              `This is a small accountability group for building trust together. ` +
              `Join now: [TrustNet Link]`
            );
            window.open(`https://wa.me/${contact.value.replace(/\D/g, '')}?text=${message}`, '_blank');
          }
        } else {
          if (window.confirm(`Send invitation to ${contact.value}?`)) {
            const subject = encodeURIComponent(`Invitation to join "${circleName}" Trust Circle`);
            const body = encodeURIComponent(
              `Hi,\n\nYou've been invited to join "${circleName}" Trust Circle on TrustNet!\n\n` +
              `This is a small accountability group (3-5 people) designed for building trust together.\n\n` +
              `About this circle: ${circleDescription || 'No description provided'}\n\n` +
              `Join now: [TrustNet Link]\n\n` +
              `Best regards,\nTrustNet`
            );
            window.open(`mailto:${contact.value}?subject=${subject}&body=${body}`, '_blank');
          }
        }
      });
    } catch (error) {
      alert('Error creating Trust Circle: ' + error.message);
    }
  };

  // Complete onboarding
  const completeOnboarding = async () => {
    setShowOnboarding(false);
    setOnboardingStep(0);
    
    // Mark onboarding as completed in Firestore
    if (user) {
      try {
        await updateDoc(doc(db, 'userActivity', user.uid), {
          hasCompletedOnboarding: true
        });
        setHasCompletedOnboarding(true);
      } catch (error) {
        console.error("Error updating onboarding status:", error);
      }
    }
  };

  // Onboarding Steps
  const ONBOARDING_STEPS = [
    {
      title: "Your Trust Score",
      content: "This is your Trust Score (0-100%) - the core metric of your trustworthiness. It grows as you consistently follow through on promises.",
      target: trustBarRef,
      position: "bottom"
    },
    {
      title: "Daily Builder",
      content: "Start here each day to build trust through specific, guided actions. Each day focuses on a different aspect of trust-building.",
      target: null,
      position: "bottom"
    },
    {
      title: "Trust Feed",
      content: "This is where you see promises from your network. Use the tabs to filter between All, Friends, and your Trust Circles.",
      target: null,
      position: "bottom"
    },
    {
      title: "New Promise",
      content: "Click here to plant your first promise. Remember: quality over quantity - one meaningful promise kept builds more trust than many broken.",
      target: null,
      position: "top"
    }
  ];

  // Fixed onboarding click handler to prevent immediate closure
  const handleOnboardingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Only close onboarding if clicking outside the content area
    if (e.target === e.currentTarget) {
      completeOnboarding();
    }
  };

  if (hasError) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center max-w-2xl mx-auto mt-8">
        <h2 className="text-xl font-bold text-red-800 dark:text-red-200">Something went wrong</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">We're working to fix the issue. Please try refreshing the page.</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 bg-gradient-to-r from-red-500 to-red-400 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  if (!user) return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900">
      <div className="text-center p-6 rounded-lg bg-white dark:bg-gray-800 shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading TrustNet...</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Building trust, one promise at a time</p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900">
        <div className="text-center p-6 rounded-lg bg-white dark:bg-gray-800 shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading your promises...</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">This won't take long!</p>
        </div>
      </div>
    );
  }

  return (
    <main 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900 transition-colors duration-300"
      itemScope 
      itemType="https://schema.org/WebApplication"
    >
      {/* Beautiful Reminder Notification */}
      {showReminder && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 border border-cyan-200 dark:border-cyan-900/50 max-w-xs">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-white text-sm">
                🌿
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">Trust Reminder</p>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{reminderMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEO Structured Data */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "TrustNet - The First Social Platform Where Trust is the Currency",
            "description": "Build meaningful relationships through small accountability groups and promises. Track your trust score and grow authentic connections.",
            "applicationCategory": "Social Networking",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "operatingSystem": "All",
            "keywords": "trust, social network, accountability, promises, trust score, relationship building, small groups, trust circles, social platform",
            "url": "https://trustnet.example.com",
            "image": "https://trustnet.example.com/og-image.jpg",
            "creator": {
              "@type": "Organization",
              "name": "TrustNet Team",
              "url": "https://trustnet.example.com"
            }
          })
        }}
      />
      
      {/* Canonical URL */}
      <link rel="canonical" href="https://trustnet.example.com/dashboard" />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content="TrustNet Dashboard - Build Trust Through Promises" />
      <meta property="og:description" content="Track your trust score, make promises, and join small accountability groups to build authentic relationships." />
      <meta property="og:image" content="https://trustnet.example.com/og-dashboard.jpg" />
      <meta property="og:url" content="https://trustnet.example.com/dashboard" />
      <meta property="og:type" content="website" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="TrustNet Dashboard - Build Trust Through Promises" />
      <meta name="twitter:description" content="Track your trust score, make promises, and join small accountability groups to build authentic relationships." />
      <meta name="twitter:image" content="https://trustnet.example.com/og-dashboard.jpg" />
      
      {/* Performance Optimization: Preload critical resources */}
      <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header - Semantic Header Tag */}
        <header 
          className="flex flex-col sm:flex-row justify-between items-center mb-6 p-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          role="banner"
        >
          <div className="flex items-center gap-2 mb-3 sm:mb-0">
            <span className="text-2xl">🌿</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">
              TrustNet-信木 Xin Mu
            </h1>
            <span className="text-2xl">🌿</span>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center sm:justify-end">
            <button
              onClick={() => router.push('/profile')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors w-full sm:w-auto"
              aria-label="View profile"
            >
              <span>👤</span>
              <span className="hidden sm:inline">Profile</span>
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors w-full sm:w-auto"
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button
              onClick={() => {
                auth.signOut();
                router.push('/auth');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors w-full sm:w-auto"
              aria-label="Sign out"
            >
              <span>🔐</span>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {user.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Trust Score Section - Semantic Section Tag */}
        <section 
          ref={trustBarRef}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl"
          aria-labelledby="trust-score-heading"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-3 sm:mb-0">
              <span className="text-xl">🏆</span>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Trust Score</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">
                  {trustScore} <span className="text-green-500">🟢</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                <span>✨</span>
                <span>{streak}</span>
              </div>
            </div>
          </div>
          
          {/* Trust Score Ripple Effect */}
          {showTrustRipple && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0 h-0 rounded-full bg-cyan-300/30 opacity-70 animate-ripple pointer-events-none" />
          )}
          
          <style jsx>{`
            @keyframes ripple {
              0% {
                width: 0;
                height: 0;
                opacity: 0.7;
              }
              100% {
                width: 300px;
                height: 300px;
                opacity: 0;
              }
            }
            .animate-ripple {
              animation: ripple 600ms ease-out;
            }
          `}</style>
        </section>

        {/* Daily Builder Card - Semantic Section Tag */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div className="mb-3 sm:mb-0">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>🧩</span> Daily Builder
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 sm:hidden">Tap to start building trust</p>
            </div>
            <div className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-3 py-1.5 rounded-full text-sm">
              Day {((new Date().getDate() % 3) + 1)}
            </div>
          </div>
          
          <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-xl p-3 mb-3">
            <h3 className="text-base font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
              {((new Date().getDate() % 3) + 1) === 1 ? '🤝 Day 1: Promise Flow' : 
               ((new Date().getDate() % 3) + 1) === 2 ? '🌐 Day 2: Reputation Logic' : 
               '🧠 Day 3: UX Resonance'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
              {((new Date().getDate() % 3) + 1) === 1 ? 
                'Draft your micro-promise & add emotional resonance' :
               ((new Date().getDate() % 3) + 1) === 2 ? 
                'Send a trust signal to deepen your reputation' :
                'Simplify one UI element for better emotional clarity'}
            </p>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Start Today's Builder
          </button>
        </section>

        {/* Trust Feed Section - Semantic Section Tag */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span>📰</span> Trust Feed
          </h2>
          
          {/* Feed Header with Trust Circles Filter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
            <div className="flex gap-1 overflow-x-auto py-1 w-full sm:w-auto">
              {['all', 'friends', 'trust-circles'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFeedTab(tab)}
                  className={`px-3 py-1.5 rounded-full font-medium transition-all text-sm ${
                    activeFeedTab === tab
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm w-full sm:w-auto">
              <span className="whitespace-nowrap">Sort by:</span>
              <select 
                value={feedSort}
                onChange={(e) => setFeedSort(e.target.value)}
                className="w-full sm:w-auto bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm"
              >
                <option value="recent">Most Recent</option>
                <option value="trust">Highest Trust Impact</option>
                <option value="completion">Completion Rate</option>
              </select>
            </div>
          </div>
          
          {/* Trust Feed Posts */}
          <div className="space-y-4">
            {getFilteredAndSortedPosts().map((p) => (
              <article 
                key={p.id} 
                className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                {/* Post Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-white text-lg">
                    {user.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">
                      {user.displayName || 'You'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {p.createdAt ? convertFirestoreDate(p.createdAt).toLocaleString() : 'Just now'}
                    </p>
                  </div>
                </div>
                
                {/* Post Content */}
                <div className="mb-3">
                  <p className="text-gray-700 dark:text-gray-300 mb-2">Just made a new promise:</p>
                  <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border-l-4 border-cyan-500">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{p.emoji}</span>
                      <h4 className="font-medium text-gray-800 dark:text-gray-200">
                        {p.title}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Status: {p.status === 'aligned' ? 'Completed' : 'Active'} • {p.progress}
                    </p>
                  </div>
                </div>
                
                {/* Post Actions */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-3 border-t border-gray-200 dark:border-gray-700 gap-2">
                  <div className="flex gap-2 overflow-x-auto">
                    {['🙌 Believe', '🌟 Inspire', '🤝 Support'].map((action) => (
                      <button
                        key={action}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrustScoreUpdate('support-reaction');
                        }}
                        className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors text-sm whitespace-nowrap"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
                    <span>Trust Impact</span>
                    <span className="bg-cyan-50 dark:bg-cyan-900/20 px-2 py-0.5 rounded-full">
                      +2%
                    </span>
                  </div>
                </div>
              </article>
            ))}
            
            {/* Empty state if no posts match the filter */}
            {getFilteredAndSortedPosts().length === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <p>No posts in this category yet.</p>
                {activeFeedTab === 'trust-circles' && (
                  <button
                    onClick={() => setShowTrustCircleModal(true)}
                    className="mt-3 inline-flex bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Create Your First Circle
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Trust Circles Section - Semantic Section Tag */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-2 sm:mb-0">
              <span>👥</span> Trust Circles
            </h2>
            <button
              onClick={() => setShowTrustCircleModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity w-full sm:w-auto"
            >
              + New Circle
            </button>
          </div>
          
          {/* Trust Circles List */}
          <div className="space-y-3">
            {/* Trust Circles from Firestore */}
            {promises.filter(p => p.trustCircleId).length === 0 ? (
              <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="text-2xl mb-2">👥</span>
                <h3 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-1">No Trust Circles Yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3">
                  Create a small accountability group (3-5 people) for building trust together
                </p>
                <button
                  onClick={() => setShowTrustCircleModal(true)}
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity w-full sm:w-auto"
                >
                  Create Your First Circle
                </button>
              </div>
            ) : (
              promises.filter(p => p.trustCircleId).map((circle, index) => (
                <div key={index} className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border-l-4 border-cyan-500">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">Trust Circle {index + 1}</h3>
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full text-xs mt-1 sm:mt-0">
                      {circle.taggedContacts ? circle.taggedContacts.length + 1 : '3'}/5 members
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">Daily accountability group</p>
                  <div className="flex gap-2 flex-wrap mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 flex items-center justify-center text-white text-xs">
                      U
                    </div>
                    {circle.taggedContacts && circle.taggedContacts.map((contact: any, i: number) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-400 flex items-center justify-center text-white text-xs">
                        {contact.value.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <button
                      className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-2 py-1 rounded text-sm hover:opacity-90 transition-opacity"
                      onClick={() => alert('You can now share promises directly with this Trust Circle!')}
                    >
                      Share Promise
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Dashboard Tabs - Semantic Section Tag */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-3 mb-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row mb-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-xl overflow-hidden">
            {['Active', 'Completed', 'Archived'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`flex-1 py-2.5 font-medium transition-all text-sm ${
                  activeTab === tab.toLowerCase()
                    ? 'text-cyan-500 dark:text-cyan-400 relative'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                role="tab"
                aria-selected={activeTab === tab.toLowerCase()}
              >
                {tab}
                {activeTab === tab.toLowerCase() && (
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
          
          {/* Active Promises Tab */}
          {activeTab === 'active' && (
            <div className="space-y-3">
              {promises.filter(p => p.status === 'active' || p.status === 'drafting').length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 italic text-center py-3">
                  No active promises yet. Plant your first seed! 🌱
                </p>
              ) : (
                promises.filter(p => p.status === 'active' || p.status === 'drafting').map((p) => (
                  <div
                    key={p.id}
                    ref={p.id === newPromise?.id ? promiseCardRef : null}
                    className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer transition-all hover:shadow-md hover:-translate-y-1"
                  >
                    {/* Status Badge and Delete Button */}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === 'drafting' 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' 
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                      }`}>
                        {p.status === 'drafting' ? '⚠️ Due Soon' : '🟢 Active'}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePromise(p);
                        }}
                        className="text-gray-500 hover:text-red-500"
                        title="Delete promise"
                      >
                        ✕
                      </button>
                    </div>
                    
                    {/* Card Content */}
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.emoji}</span>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 dark:text-gray-200">
                          {p.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {p.progress} • Due: {p.deadline ? convertFirestoreDate(p.deadline).toLocaleDateString() : 'No deadline'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {/* Add Promise Button */}
              <button
                onClick={() => setShowModal(true)}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <span>+</span> New Promise
              </button>
            </div>
          )}
          
          {/* Completed Promises Tab */}
          {activeTab === 'completed' && (
            <div className="space-y-3">
              {promises.filter(p => p.status === 'aligned').length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 italic text-center py-3">
                  No completed promises yet. Keep building your trust! 🌱
                </p>
              ) : (
                promises.filter(p => p.status === 'aligned').map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer transition-all hover:shadow-md"
                  >
                    {/* Status Badge and Delete Button */}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <div className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                        ✅ Completed
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePromise(p);
                        }}
                        className="text-gray-500 hover:text-red-500"
                        title="Delete promise"
                      >
                        ✕
                      </button>
                    </div>
                    
                    {/* Card Content */}
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.emoji}</span>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 dark:text-gray-200">
                          {p.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Completed • +3 Trust
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
          {/* Archived Promises Tab */}
          {activeTab === 'archived' && (
            <div className="space-y-3">
              {promises.filter(p => p.status === 'archived').length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 italic text-center py-3">
                  No archived promises yet.
                </p>
              ) : (
                promises.filter(p => p.status === 'archived').map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer transition-all hover:shadow-md opacity-70"
                  >
                    {/* Status Badge and Delete Button */}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <div className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        📁 Archived
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePromise(p);
                        }}
                        className="text-gray-500 hover:text-red-500"
                        title="Delete promise"
                      >
                        ✕
                      </button>
                    </div>
                    
                    {/* Card Content */}
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.emoji}</span>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 dark:text-gray-200">
                          {p.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Archived • Reactivate?
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {/* Trust Snapshot Section - Semantic Section Tag */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span>🔍</span> Trust Snapshot
          </h2>
          
          {/* Trust Score */}
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                  strokeWidth="5"
                />
                <path
                  d="M 50 5 A 45 45 0 1 1 50 95 A 45 45 0 1 1 50 5"
                  fill="none"
                  stroke="url(#trustGradient)"
                  strokeWidth="5"
                  strokeDasharray="282"
                  strokeDashoffset={282 - (282 * trustScore / 100)}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="trustGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4ECDC4" />
                    <stop offset="100%" stopColor="#7B42F5" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-xl font-bold bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">
                  {trustScore}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Trust Score</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                {trustScore < 30 ? "Starting your trust journey" :
                 trustScore < 60 ? "Building solid foundations" :
                 trustScore < 85 ? "Strong trust relationships" : "Exceptional trustworthiness"}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                {"Your trust score has increased " + (trustScore - 0) + "% this month"}
              </div>
            </div>
          </div>
          
          {/* Trust Metrics */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { title: 'Endorsements', value: promises.filter(p => p.status === 'aligned').length, color: 'cyan' },
              { title: 'Recent Agreements', value: promises.length, color: 'purple' },
              { title: 'In Progress', value: promises.filter(p => p.status === 'active' || p.status === 'drafting').length, color: 'yellow' },
              { title: 'Completed', value: promises.filter(p => p.status === 'aligned').length, color: 'cyan' }
            ].map((metric, index) => (
              <div 
                key={index}
                className={`p-3 rounded-xl border ${
                  darkMode 
                    ? 'bg-gray-50/5 border-gray-700' 
                    : `bg-${metric.color}-50 border-${metric.color}-100`
                }`}
              >
                <div className={`text-xl font-bold ${
                  metric.color === 'cyan' ? 'text-cyan-500' : 
                  metric.color === 'purple' ? 'text-purple-500' : 'text-yellow-500'
                }`}>
                  {metric.value}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {metric.title}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Active Agreements Zone - Semantic Section Tag */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span>📄</span> Active Agreements
          </h2>
          
          {/* Agreement Timeline */}
          <div className="relative pl-8 ml-3">
            {/* Timeline line */}
            <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-gradient-to-b from-cyan-500 to-purple-600 z-0"></div>
            
            {/* Agreement items */}
            {promises.filter(p => p.status === 'active' || p.status === 'drafting').slice(0, 3).map((p, index) => (
              <div 
                key={p.id} 
                className="relative mb-4 last:mb-0 z-10 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-900/50 p-2 rounded-xl"
              >
                {/* Timeline dot */}
                <div className={`absolute -left-2 top-3 w-4 h-4 rounded-full border-2 ${
                  p.status === 'drafting' ? 'bg-red-500 border-red-200 dark:border-red-900' : 'bg-cyan-500 border-cyan-200 dark:border-cyan-900'
                }`}></div>
                
                {/* Item content */}
                <div className="flex items-center gap-2">
                  <span className="text-xl">{p.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                        {p.title}
                      </h3>
                      <span className={`px-1 py-0.5 rounded-full text-xs ${
                        p.status === 'drafting' 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' 
                          : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200'
                      }`}>
                        {p.emotionalTone || 'Cooperative'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
                        <span>🗓️ {p.createdAt ? convertFirestoreDate(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown'}</span>
                        <span>·</span>
                        <span>{p.deadline ? convertFirestoreDate(p.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown'}</span>
                      </div>
                      <span className={`px-1 py-0.5 rounded-full text-xs ${
                        p.status === 'drafting' 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' 
                          : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200'
                      }`}>
                        {p.status === 'drafting' ? 'Drafting' : 'Aligned'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Add Agreement Button */}
          <div className="text-center mt-3">
            <button 
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm w-full"
            >
              <span>+</span> Add Agreement
            </button>
          </div>
        </section>

        {/* Next Actions Zone - Semantic Section Tag */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span>🚀</span> Next Actions
          </h2>
          
          {/* Action Cards */}
          <div className="space-y-3">
            {/* Show actions for promises that need clarification */}
            {promises
              .filter(p => p.status === 'drafting')
              .map(p => (
                <div key={p.id} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border-l-4 border-red-500 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-red-400 flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                      Clarify "{p.title}"
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-xs mt-1 mb-2">
                      Your counterparty has questions about the timeframe
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClarify(p);
                        }}
                        className="bg-gradient-to-r from-red-500 to-red-400 text-white px-2 py-1 rounded-lg font-medium hover:opacity-90 transition-opacity text-xs w-full sm:w-auto"
                      >
                        Clarify
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemindLater(p);
                        }}
                        className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs w-full sm:w-auto"
                      >
                        Remind Later
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            
            {/* Show actions for promises in review */}
            {promises
              .filter(p => p.status === 'active')
              .map(p => (
                <div key={p.id} className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border-l-4 border-cyan-500 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                      Confirm "{p.title}"
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-xs mt-1 mb-2">
                      Your counterparty has accepted your terms
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirm(p);
                        }}
                        className="bg-gradient-to-r from-cyan-500 to-cyan-400 text-white px-2 py-1 rounded-lg font-medium hover:opacity-90 transition-opacity text-xs w-full sm:w-auto"
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddNotes(p);
                        }}
                        className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs w-full sm:w-auto"
                      >
                        Add Notes
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            
            {/* Show actions for promises needing nudges */}
            {promises
              .filter(p => p.status === 'active' && p.progress && p.progress.includes('Day'))
              .map(p => (
                <div key={p.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border-l-4 border-yellow-500 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-400 flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                      Nudge "{p.title}"
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-xs mt-1 mb-2">
                      Your counterparty hasn't responded in 3 days
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendNudge(p);
                        }}
                        className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-white px-2 py-1 rounded-lg font-medium hover:opacity-90 transition-opacity text-xs w-full sm:w-auto"
                      >
                        Send Nudge
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSkipNudge(p);
                        }}
                        className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs w-full sm:w-auto"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* Progress Tracker Zone - Semantic Section Tag */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span>📈</span> Progress Tracker
          </h2>
          
          {/* Overall Progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">Overall Agreement Momentum</span>
              <span className="font-medium bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent text-sm">
                {Math.min(100, Math.round((promises.filter(p => p.status === 'aligned').length / promises.length) * 100))}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, Math.round((promises.filter(p => p.status === 'aligned').length / promises.length) * 100))}%` }}
              ></div>
            </div>
          </div>
          
          {/* Milestones */}
          <div className="space-y-3">
            {[
              { 
                title: "Initial Agreement", 
                status: promises.some(p => p.status === 'active' || p.status === 'drafting') ? 'completed' : 'upcoming', 
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
                emoji: '🤝',
                description: 'You and your counterparty agreed on terms'
              },
              { 
                title: "Clarification Phase", 
                status: promises.some(p => p.status === 'drafting') ? 'in-progress' : promises.some(p => p.status === 'active') ? 'completed' : 'upcoming', 
                date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
                emoji: '💬',
                description: 'You clarified the timeframe for journaling'
              },
              { 
                title: "Confirmation", 
                status: promises.some(p => p.status === 'aligned') ? 'completed' : promises.some(p => p.status === 'active') ? 'in-progress' : 'upcoming', 
                date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
                emoji: '✅',
                description: 'Awaiting counterparty confirmation'
              },
              { 
                title: "First Check-in", 
                status: 'upcoming', 
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
                emoji: '📅',
                description: 'Schedule your first progress review'
              }
            ].map((milestone, index) => (
              <div key={index} className="flex items-center gap-3">
                {/* Milestone marker */}
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${
                  milestone.status === 'completed' 
                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-400' 
                    : milestone.status === 'in-progress'
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}>
                  {milestone.status === 'completed' ? '✓' : milestone.emoji}
                </div>
                
                {/* Milestone content */}
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                      {milestone.title}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {milestone.date}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-xs mt-1">
                    {milestone.description}
                  </p>
                </div>
                
                {/* Action button for in-progress milestone */}
                {milestone.status === 'in-progress' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      alert('✅ Milestone completed! Your agreement is now fully aligned.');
                      setTrustScore(prev => Math.min(100, prev + 1));
                      setShowTrustRipple(true);
                    }}
                    className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-white px-2 py-1 rounded-lg font-medium text-xs hover:opacity-90 transition-opacity"
                  >
                    Confirm
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Footer - Semantic Footer Tag */}
        <footer className="text-center mt-4 text-gray-500 dark:text-gray-400 text-xs" role="contentinfo">
          <p>&quot;A promise made is a seed planted.&quot;</p>
          <p>Powered by TrustNet • The first social platform where trust is the currency</p>
        </footer>
      </div>

      {/* Make a Promise Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-4 shadow-2xl">
            <h2 className="text-xl font-bold text-center mb-4 text-blue-600 dark:text-blue-400">
              🤝 Make a Promise
            </h2>
            
            {/* Promise Details */}
            <input
              type="text"
              placeholder="e.g. Journal every morning"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:text-white text-sm"
            />
            
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:text-white text-sm"
            />
            
            {/* Emoji Selector */}
            <div className="flex flex-wrap gap-1 mb-4">
              {['🌱', '📓', '🧘', '🏃', '📵', '📞', '🍽️', '📚'].map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`text-xl p-1 rounded-lg transition-all ${
                    emoji === e 
                      ? 'ring-2 ring-blue-500 scale-105' 
                      : 'hover:scale-105'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            
            {/* Contact Tagging Section */}
            <div className="mb-4 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2 text-sm">Share with others</h3>
              
              {/* Tagged Contacts */}
              <div className="flex flex-wrap gap-1 mb-2">
                {taggedContacts.map((contact, i) => (
                  <div key={i} className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-xs">
                    <span>{contact.type === 'phone' ? '📱' : '✉️'}</span>
                    <span>{contact.value}</span>
                    <button 
                      onClick={() => removeTaggedContact(i)}
                      className="ml-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Contact Type Buttons - FIXED */}
              <div className="flex gap-1 mb-2">
                {['Family', 'Friends', 'Colleagues'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setShowContactModal({ 
                        visible: true, 
                        type: type.toLowerCase(), 
                        forCircle: false 
                      });
                    }}
                    className={`flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded-lg transition-colors text-xs ${
                      showContactModal.visible && showContactModal.type === type.toLowerCase() 
                        ? 'ring-2 ring-cyan-500' 
                        : ''
                    }`}
                  >
                    {type === 'Family' && '👨‍👩‍👧‍👦'}
                    {type === 'Friends' && '👫'}
                    {type === 'Colleagues' && '👔'} {type}
                  </button>
                ))}
              </div>
              
              {/* Contact Input */}
              {showContactModal.visible && !showContactModal.forCircle && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder={`Enter ${showContactModal.type} contact`}
                    value={contactInput}
                    onChange={(e) => setContactInput(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:text-white text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddContact();
                      }
                    }}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleAddContact}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-2 rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowContactModal({ visible: false, type: 'phone', forCircle: false })}
                      className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setTaggedContacts([]);
                  setContactInput('');
                }}
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePromise}
                className="flex-1 bg-blue-600 text-white p-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
              >
                🌿 Plant It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trust Circle Creation Modal */}
      {showTrustCircleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-4 shadow-2xl">
            <h2 className="text-xl font-bold text-center mb-4 text-blue-600 dark:text-blue-400">
              👥 Create Trust Circle
            </h2>
            
            <p className="text-gray-500 dark:text-gray-400 text-center mb-4 text-sm">
              Create a small accountability group (3-5 people) for building trust together
            </p>
            
            {/* Circle Name */}
            <input
              type="text"
              placeholder="Circle name (e.g., Morning Journalers)"
              value={circleName}
              onChange={(e) => setCircleName(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:text-white text-sm"
            />
            
            {/* Circle Description */}
            <textarea
              placeholder="Brief description of your circle's purpose"
              value={circleDescription}
              onChange={(e) => setCircleDescription(e.target.value)}
              rows={2}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:text-white resize-none text-sm"
            />
            
            {/* Circle Members Section */}
            <div className="mb-4 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2 text-sm">Add Members (2-4 people)</h3>
              
              {/* Current Members */}
              <div className="flex flex-wrap gap-1 mb-2">
                <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-xs">
                  <span>👤</span>
                  <span>You</span>
                </div>
                {circleMembers.map((contact, i) => (
                  <div key={i} className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-xs">
                    <span>{contact.type === 'phone' ? '📱' : '✉️'}</span>
                    <span>{contact.value}</span>
                    <button 
                      onClick={() => removeCircleMember(i)}
                      className="ml-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Contact Type Buttons - FIXED */}
              <div className="flex gap-1 mb-2">
                {['Family', 'Friends', 'Colleagues'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setShowContactModal({ 
                        visible: true, 
                        type: type.toLowerCase(), 
                        forCircle: true 
                      });
                    }}
                    className={`flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded-lg transition-colors text-xs ${
                      showContactModal.visible && showContactModal.forCircle && showContactModal.type === type.toLowerCase() 
                        ? 'ring-2 ring-cyan-500' 
                        : ''
                    }`}
                  >
                    {type === 'Family' && '👨‍👩‍👧‍👦'}
                    {type === 'Friends' && '👫'}
                    {type === 'Colleagues' && '👔'} {type}
                  </button>
                ))}
              </div>
              
              {/* Contact Input */}
              {showContactModal.visible && showContactModal.forCircle && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder={`Enter ${showContactModal.type} contact`}
                    value={contactInput}
                    onChange={(e) => setContactInput(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:text-white text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCircleMember();
                      }
                    }}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleAddCircleMember}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-2 rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowContactModal({ visible: false, type: 'phone', forCircle: true })}
                      className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              {/* Member Count Info */}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {circleMembers.length === 0 
                  ? 'Add 2-4 members to complete your Trust Circle (3-5 people total)'
                  : circleMembers.length === 1
                    ? 'Add 1-3 more members to complete your Trust Circle (3-5 people total)'
                    : circleMembers.length === 2
                      ? 'Add 1-2 more members to complete your Trust Circle (3-5 people total)'
                      : circleMembers.length === 3
                        ? 'Add 1 more member to complete your Trust Circle (3-5 people total)'
                        : 'Trust Circle complete! (5 people total)'}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowTrustCircleModal(false);
                  setCircleName('');
                  setCircleDescription('');
                  setCircleMembers([]);
                }}
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTrustCircle}
                disabled={circleMembers.length < 2 || circleMembers.length > 4}
                className={`flex-1 ${
                  circleMembers.length >= 2 && circleMembers.length <= 4 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } p-2 rounded-lg font-medium text-sm`}
              >
                Create Circle
              </button>
            </div>
            
            {/* Trust Circle Guidelines */}
            <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-xs text-gray-600 dark:text-gray-300">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Why Trust Circles?</h4>
              <p>
                Trust Circles are small accountability groups (3-5 people) designed specifically for building trust through shared promises. Unlike large social networks, these intimate circles foster meaningful connections where trust can actually grow.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Promise Detail Modal */}
      {selectedPromise && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-4 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{selectedPromise.emoji}</span>
              <h2 className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {selectedPromise.title}
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
              <strong>Status:</strong> {selectedPromise.status === 'aligned' ? '✅ Done' : '🔄 Active'}<br/>
              <strong>Deadline:</strong> {selectedPromise.deadline ? convertFirestoreDate(selectedPromise.deadline).toLocaleDateString() : 'No deadline'}<br/>
              <strong>Progress:</strong> {selectedPromise.progress}
            </p>
            <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border border-cyan-200 dark:border-cyan-900">
              <h3 className="text-base font-medium text-cyan-700 dark:text-cyan-300 flex items-center gap-2 mb-2">
                <span>🤖</span> AI Coach Suggests:
              </h3>
              <p className="text-gray-700 dark:text-gray-200 text-sm">
                No AI coach suggestions available in production mode. This feature will be added in a future update.
              </p>
            </div>
            <button
              onClick={() => alert("🛠️ Support Ticket: Our team will help you within 24 hours.")}
              className="w-full mt-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              🛠️ Need Help?
            </button>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  handleDeletePromise(selectedPromise);
                  setSelectedPromise(null);
                }}
                className="flex-1 bg-red-500 text-white p-2 rounded-lg font-medium hover:bg-red-600 transition-colors text-sm"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedPromise(null)}
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Close
              </button>
              {selectedPromise.status !== 'aligned' && (
                <button
                  onClick={() => {
                    handleConfirm(selectedPromise);
                    setSelectedPromise(null);
                  }}
                  className="flex-1 bg-green-600 text-white p-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
                >
                  ✅ Mark Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cinematic Launch Sequence Overlay */}
      {showLaunchSequence && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50 transition-opacity duration-300">
          {/* Promise Card Animation */}
          <div
            ref={promiseCardRef}
            className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg cursor-pointer"
            style={{
              transform: 'translateX(100%)',
              animation: 'slideIn 1s ease forwards'
            }}
          >
            {/* Status Badge */}
            <div className="absolute top-2 right-2 px-1 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
              🟢 Active
            </div>
            
            {/* Card Content */}
            <div className="flex items-center gap-2">
              <span className="text-xl">{newPromise?.emoji}</span>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                  {newPromise?.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {newPromise?.progress} • Due: {newPromise?.deadline ? convertFirestoreDate(newPromise.deadline).toLocaleDateString() : 'No deadline'}
                </p>
              </div>
            </div>
          </div>
          
          <style jsx>{`
            @keyframes slideIn {
              0% {
                transform: translateX(100%);
                opacity: 0;
              }
              100% {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}

      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed top-0 left-0 w-full h-48 pointer-events-none z-50">
          <canvas ref={(canvas) => {
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const width = canvas.width = window.innerWidth;
            const height = canvas.height = 192;
            
            const confetti = Array(100).fill().map(() => ({
              x: Math.random() * width,
              y: Math.random() * height - height,
              size: Math.random() * 8 + 4,
              speed: Math.random() * 2.5 + 0.5,
              angle: Math.random() * Math.PI * 2,
              rotation: Math.random() * 360,
              rotationSpeed: Math.random() * 2 - 1,
              emoji: ['🌱', '✨', '🎉', '💫', '🏆'][Math.floor(Math.random() * 5)]
            }));
            
            let animationFrame;
            let startTime;
            
            const animate = (timestamp) => {
              if (!startTime) startTime = timestamp;
              const progress = timestamp - startTime;
              
              ctx.clearRect(0, 0, width, height);
              
              let allFell = true;
              
              confetti.forEach(piece => {
                piece.y += piece.speed;
                piece.x += Math.sin(piece.angle) * 0.3;
                piece.rotation += piece.rotationSpeed;
                
                ctx.font = `${piece.size}px Arial`;
                ctx.save();
                ctx.translate(piece.x, piece.y);
                ctx.rotate(piece.rotation * Math.PI / 180);
                ctx.fillText(piece.emoji, -piece.size/2, piece.size/3);
                ctx.restore();
                
                if (piece.y < height) allFell = false;
              });
              
              if (!allFell && progress < 2500) {
                animationFrame = requestAnimationFrame(animate);
              } else {
                setShowConfetti(false);
              }
            };
            
            animationFrame = requestAnimationFrame(animate);
            
            return () => {
              cancelAnimationFrame(animationFrame);
            };
          }} style={{ width: '100%', height: '100%' }} />
        </div>
      )}

      {/* Onboarding Tour - FIXED VERSION */}
      {showOnboarding && (
        <div 
          ref={onboardingRef}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={handleOnboardingClick}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 max-w-md w-full mx-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-2 right-2">
              <button
                onClick={completeOnboarding}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>
            
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-white text-xl mx-auto mb-3">
                🌱
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-1">
                Welcome to TrustNet
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Your 20-second guided tour to building authentic trust
              </p>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-center mb-3">
                {ONBOARDING_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full mx-0.5 ${
                      index === onboardingStep ? 'bg-cyan-500 w-3' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  ></div>
                ))}
              </div>
              
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-1">
                {ONBOARDING_STEPS[onboardingStep].title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {ONBOARDING_STEPS[onboardingStep].content}
              </p>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={completeOnboarding}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
              >
                Skip Tour
              </button>
              <button
                onClick={() => {
                  if (onboardingStep < ONBOARDING_STEPS.length - 1) {
                    setOnboardingStep(prev => prev + 1);
                  } else {
                    completeOnboarding();
                  }
                }}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
              >
                {onboardingStep < ONBOARDING_STEPS.length - 1 ? 'Next' : 'Get Started'}
              </button>
            </div>
            
            {/* Highlight Overlay */}
            {ONBOARDING_STEPS[onboardingStep].target && (
              <div 
                className="fixed bg-black/30 rounded-xl pointer-events-none"
                style={{
                  top: ONBOARDING_STEPS[onboardingStep].target.current?.getBoundingClientRect().top + window.scrollY - 10,
                  left: ONBOARDING_STEPS[onboardingStep].target.current?.getBoundingClientRect().left - 10,
                  width: ONBOARDING_STEPS[onboardingStep].target.current?.getBoundingClientRect().width + 20,
                  height: ONBOARDING_STEPS[onboardingStep].target.current?.getBoundingClientRect().height + 20
                }}
              ></div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}