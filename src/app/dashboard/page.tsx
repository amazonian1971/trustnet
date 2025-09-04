'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
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

// TrustNet Knowledge Base for AI Support
const TRUSTNET_FAQ = [
  // Account Setup & Profile
  {
    question: "How do I create a TrustNet account?",
    answer: "You can create a TrustNet account by clicking the 'Sign Up' button on the homepage and following the prompts. You'll need to provide your name, email address, and create a password. We also support social logins through Google and other providers.",
    category: "account"
  },
  {
    question: "How do I update my profile information?",
    answer: "To update your profile, click on your profile icon in the top right corner of the dashboard, then select 'Profile' from the dropdown menu. From there, you can edit your name, profile picture, bio, and other personal information.",
    category: "account"
  },
  {
    question: "How do I change my email address or password?",
    answer: "To change your email address or password, go to your Profile settings, then click on the 'Account Settings' tab. Here you can update your email address and reset your password.",
    category: "account"
  },
  
  // Creating Promises
  {
    question: "How do I create a new promise?",
    answer: "To create a new promise, click the 'New Promise' button on the dashboard. Enter your promise details including title, emoji, deadline, and select contacts to share it with. Then click 'Plant It' to create your promise.",
    category: "promises"
  },
  {
    question: "What is the difference between a promise and a trust circle?",
    answer: "A promise is a specific commitment you make to yourself or others with a defined timeframe. A Trust Circle is a small group (3-5 people) of accountability partners who support each other with their promises.",
    category: "promises"
  },
  {
    question: "How do I share a promise with others?",
    answer: "When creating a promise, you can add contacts by clicking the 'Share with others' section. You can add family, friends, or colleagues by entering their phone number or email address.",
    category: "promises"
  },
  
  // Trust Circles
  {
    question: "How do I create a Trust Circle?",
    answer: "Click the '+ New Circle' button in the Trust Circles section of your dashboard. Give your circle a name, description, and add 2-4 members (for a total of 3-5 people including yourself).",
    category: "circles"
  },
  {
    question: "How many people can be in a Trust Circle?",
    answer: "Trust Circles are intentionally small for meaningful connections - they must have between 3 and 5 members total (including yourself).",
    category: "circles"
  },
  {
    question: "Can I join multiple Trust Circles?",
    answer: "Yes, you can be a member of multiple Trust Circles. This allows you to have different circles for different aspects of your life (work, personal, fitness, etc.).",
    category: "circles"
  },
  
  // Trust Score System
  {
    question: "How is my Trust Score calculated?",
    answer: "Your Trust Score is calculated based on your promise completion rate, how consistently you follow through on commitments, and the feedback from your accountability partners. Completing promises on time and supporting others in their promises increases your score.",
    category: "score"
  },
  {
    question: "What's the maximum Trust Score?",
    answer: "The Trust Score ranges from 0-100%. As you consistently follow through on your promises and build trust with others, your score will increase.",
    category: "score"
  },
  {
    question: "How can I improve my Trust Score?",
    answer: "You can improve your Trust Score by: 1) Completing promises on time, 2) Supporting others in their promises (using Believe/Inspire/Support buttons), 3) Creating and participating in Trust Circles, and 4) Consistently following through on your commitments.",
    category: "score"
  },
  
  // Dashboard Navigation
  {
    question: "What do the different tabs mean?",
    answer: "The dashboard has three main tabs: Active (shows promises you're currently working on), Completed (shows promises you've successfully completed), and Archived (shows promises you've archived for reference).",
    category: "dashboard"
  },
  {
    question: "How do I read the Trust Snapshot?",
    answer: "The Trust Snapshot shows your current Trust Score (0-100%) and key metrics including Endorsements (completed promises), Recent Agreements, In Progress promises, and Completed promises.",
    category: "dashboard"
  },
  {
    question: "What is the Daily Builder?",
    answer: "The Daily Builder is a guided activity that helps you build trust through specific actions. Each day focuses on a different aspect of trust-building: Day 1 is Promise Flow, Day 2 is Reputation Logic, and Day 3 is UX Resonance.",
    category: "dashboard"
  },
  
  // Troubleshooting
  {
    question: "I can't see my promises. What should I do?",
    answer: "First check which tab you're on (Active, Completed, Archived). If you still don't see your promises, try refreshing the page. If the issue persists, contact support@trustnet.example.com.",
    category: "troubleshooting"
  },
  {
    question: "My Trust Score isn't updating. What's wrong?",
    answer: "Trust Score updates may take a few moments to process. If it hasn't updated after 24 hours, please contact our support team.",
    category: "troubleshooting"
  },
  {
    question: "I'm having trouble adding contacts to my promise. What should I do?",
    answer: "Make sure you're entering the contact information correctly (phone number with country code or valid email address). If you're still having issues, try logging out and back in, or contact support.",
    category: "troubleshooting"
  },
  
  // Special Focus: PROMISES
  {
    question: "What makes a good promise?",
    answer: "A good promise is SMART: Specific, Measurable, Achievable, Relevant, and Time-bound. It should be something you genuinely want to accomplish and can realistically commit to. Remember, trust is built through consistent action over time.",
    category: "promises"
  },
  {
    question: "How often should I make new promises?",
    answer: "Quality over quantity. It's better to make 1-2 meaningful promises you can follow through on than many promises you can't keep. Start with what you can realistically handle, then gradually increase as your trust muscle strengthens.",
    category: "promises"
  },
  {
    question: "What happens if I break a promise?",
    answer: "Breaking a promise will impact your Trust Score. The best approach is to communicate with your accountability partners and recommit to a revised timeline if needed. Remember, trust is built through consistent action over time - one misstep doesn't define your entire journey.",
    category: "promises"
  },
  {
    question: "How do I handle multiple promises at once?",
    answer: "Focus on prioritization. Use the 'Next Actions' section of your dashboard to see which promises need immediate attention. Consider staggering your promises so they don't all have deadlines at the same time. Quality completion of fewer promises builds more trust than partial completion of many.",
    category: "promises"
  },
  {
    question: "Why are promises limited to small groups?",
    answer: "Trust grows in small, intentional communities. Large networks dilute accountability, while small groups (3-5 people) create the psychological safety needed for authentic trust-building. This is why Trust Circles are limited to 3-5 members - it's scientifically proven to be the optimal size for meaningful connections.",
    category: "promises"
  },
  {
    question: "How do I make my promises more effective?",
    answer: "Three key elements make promises effective: 1) Emotional resonance (add why it matters to you), 2) Clear milestones (break it into smaller steps), and 3) Appropriate accountability (share with the right people). Your Daily Builder guides you through these elements systematically.",
    category: "promises"
  }
];

// AI Support Bot Responses for Out-of-Scope Questions
const OUT_OF_SCOPE_RESPONSES = [
  "I'm your TrustNet AI assistant, focused specifically on helping you build trust through promises and accountability. Let's stay focused on how I can help with TrustNet!",
  "As your TrustNet support specialist, I'm here to help with anything related to promises, trust circles, and building authentic connections. How can I assist with TrustNet today?",
  "I specialize in TrustNet functionality and the science of building trust through small accountability groups. I'd be happy to help you navigate any aspect of the platform!"
];

// AI Support Bot Responses for Promise-Specific Questions
const PROMISE_SPECIALIST_RESPONSES = [
  "Promises are the foundation of trust. Each promise you make and keep strengthens your trust muscle. Remember: quality over quantity - one meaningful promise kept is worth more than ten broken.",
  "In TrustNet, a promise isn't just a goal - it's a commitment to build trust through accountability. The magic happens in the small, consistent actions between you and your accountability partners.",
  "The science of promises: They work because they create psychological commitment. When you share a promise, you're not just setting a goal - you're building social accountability that increases your follow-through by 65%.",
  "Your promises are your trust currency. Each one represents an opportunity to build or erode trust. Focus on making promises you can keep, then keep them consistently - that's how trust compounds over time."
];

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [streak] = useState(7);
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
  const [chainReactions, setChainReactions] = useState(3);
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
  const [trustScore, setTrustScore] = useState(87);
  const [showTrustRipple, setShowTrustRipple] = useState(false);
  const [userType, setUserType] = useState('first-time');
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
  const router = useRouter();
  const promiseCardRef = useRef<any>(null);
  const trustBarRef = useRef<any>(null);
  const chatbotRef = useRef<any>(null);
  const onboardingRef = useRef<any>(null);
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

  // Glassmorphism effect helper
  const glassEffect = (dark: boolean) => ({
    background: dark 
      ? 'rgba(42, 0, 102, 0.3)' 
      : 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: dark 
      ? '1px solid rgba(123, 66, 245, 0.2)' 
      : '1px solid rgba(200, 200, 200, 0.2)',
  });
  
  // Trust-focused tag button style
  const trustTagButtonStyle = (dark: boolean) => ({
    padding: '6px 12px',
    borderRadius: '20px',
    background: dark ? '#333' : '#f0f0f0',
    color: dark ? '#ddd' : '#333',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    flex: 1,
    fontWeight: '500'
  });

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
        
        // Determine user type based on activity
        setTimeout(() => {
          const userActivity = localStorage.getItem(`userActivity_${user.uid}`);
          if (!userActivity) {
            setUserType('first-time');
            localStorage.setItem(`userActivity_${user.uid}`, JSON.stringify({
              firstVisit: new Date().toISOString(),
              promisesCreated: 0,
              trustScore: 85,
              hasCompletedOnboarding: false
            }));
            
            // Show onboarding for first-time users
            setTimeout(() => {
              setShowOnboarding(true);
              setHasCompletedOnboarding(false);
            }, 1000);
          } else {
            const activity = JSON.parse(userActivity);
            if (activity.promisesCreated < 2) {
              setUserType('first-time');
            } else if (activity.promisesCreated < 10) {
              setUserType('regular');
            } else if (activity.promisesCreated < 30) {
              setUserType('power');
            } else {
              setUserType('power');
            }
            
            // Show onboarding only if not completed before
            if (!activity.hasCompletedOnboarding) {
              setTimeout(() => {
                setShowOnboarding(true);
                setHasCompletedOnboarding(false);
              }, 1000);
            }
          }
        }, 1000);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Tree growth based on trust
  useEffect(() => {
    const level = Math.min(5, Math.floor(trustScore / 20));
    setGrowthLevel(level);
  }, [trustScore]);

  // Listen to promises
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    const q = query(collection(db, 'promises'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const list = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Convert all date fields to JavaScript Date objects
        const processedData = {
          ...data,
          createdAt: convertFirestoreDate(data.createdAt),
          deadline: convertFirestoreDate(data.deadline)
        };
        
        list.push({ 
          id: doc.id, 
          ...processedData
        });
      });
      setPromises(list);
      setIsLoading(false);
      
      // Update user activity with trust metrics
      if (user) {
        const userActivity = localStorage.getItem(`userActivity_${user.uid}`);
        if (userActivity) {
          const activity = JSON.parse(userActivity);
          activity.promisesCreated = list.length;
          activity.trustScore = trustScore;
          localStorage.setItem(`userActivity_${user.uid}`, JSON.stringify(activity));
        }
      }
    }, (error) => {
      console.error("Error fetching promises:", error);
      setIsLoading(false);
      setHasError(true);
    });
    return () => unsubscribe();
  }, [user, trustScore]);

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

  // WhatsApp deep link
  const sendWhatsApp = (phone: string) => {
    // Clean phone number and ensure it has country code
    let cleanedPhone = phone.replace(/\D/g, '');
    
    // If phone number starts with 0 but doesn't have country code, remove the 0
    if (cleanedPhone.startsWith('0') && cleanedPhone.length > 10) {
      cleanedPhone = cleanedPhone.substring(1);
    }
    
    // If phone number is still too short, show error
    if (cleanedPhone.length < 10) {
      alert('Please enter a valid phone number with country code (e.g., +15551234567)');
      return;
    }
    
    const message = encodeURIComponent(`I've made a promise on TrustNet: "${title}". Would you like to be my accountability partner?`);
    window.open(`https://wa.me/${cleanedPhone}?text=${message}`, '_blank');
  };

  // SMS deep link
  const sendSMS = (phone: string) => {
    // Clean phone number
    let cleanedPhone = phone.replace(/\D/g, '');
    
    // If phone number starts with 0 but doesn't have country code, remove the 0
    if (cleanedPhone.startsWith('0') && cleanedPhone.length > 10) {
      cleanedPhone = cleanedPhone.substring(1);
    }
    
    const message = encodeURIComponent(`I've made a promise on TrustNet: "${title}". Would you like to be my accountability partner?`);
    window.open(`sms:${cleanedPhone}?&body=${message}`, '_blank');
  };

  // Email deep link
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
            if (window.confirm(`Send WhatsApp message to ${contact.value}?`)) {
              sendWhatsApp(contact.value);
            }
          }, 500);
        } else {
          setTimeout(() => {
            if (window.confirm(`Send email to ${contact.value}?`)) {
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

  // NEW: Delete promise functionality
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

  // AI Chatbot Functions
  const handleChatbotToggle = () => {
    setShowChatbot(!showChatbot);
    
    if (!showChatbot) {
      // Add welcome message when opening chatbot
      setChatMessages([
        {
          text: "Hello! I'm your TrustNet AI assistant. How can I help you build trust today?",
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    }
  };

  const handleChatInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    
    // Add user message
    const userMessage = {
      text: chatInput,
      sender: 'user',
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    
    // Process the message and generate a response
    setTimeout(() => {
      const response = generateBotResponse(chatInput);
      setChatMessages(prev => [...prev, response]);
    }, 500);
  };

  const generateBotResponse = (userInput: string) => {
    // Check for promise-related questions
    const isPromiseQuestion = /promise|promises|commitment|agreement|trust circle|accountability/i.test(userInput);
    
    // Check for specific FAQ matches
    const faqMatch = TRUSTNET_FAQ.find(item => 
      userInput.toLowerCase().includes(item.question.toLowerCase().split(' ')[0]) ||
      userInput.toLowerCase().includes(item.question.toLowerCase().split(' ')[1])
    );
    
    // Generate appropriate response
    let responseText;
    
    if (faqMatch) {
      responseText = faqMatch.answer;
    } else if (isPromiseQuestion) {
      // Special handling for promise questions
      const specialistResponse = PROMISE_SPECIALIST_RESPONSES[
        Math.floor(Math.random() * PROMISE_SPECIALIST_RESPONSES.length)
      ];
      
      responseText = `${specialistResponse}\n\n${TRUSTNET_FAQ.find(f => f.category === 'promises')?.answer}`;
    } else {
      // Check if it's a greeting
      const isGreeting = /hi|hello|hey|greetings/i.test(userInput);
      
      if (isGreeting) {
        responseText = "Hello! I'm your TrustNet AI assistant. How can I help you build trust today?";
      } else {
        // Out of scope response
        responseText = OUT_OF_SCOPE_RESPONSES[
          Math.floor(Math.random() * OUT_OF_SCOPE_RESPONSES.length)
        ];
      }
    }
    
    return {
      text: responseText,
      sender: 'bot',
      timestamp: new Date()
    };
  };

  // Onboarding Tour Functions
  const handleOnboardingNext = () => {
    if (onboardingStep < ONBOARDING_STEPS.length - 1) {
      setOnboardingStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleOnboardingSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
    setOnboardingStep(0);
    
    // Mark onboarding as completed in localStorage
    if (user) {
      const userActivity = localStorage.getItem(`userActivity_${user.uid}`);
      if (userActivity) {
        const activity = JSON.parse(userActivity);
        activity.hasCompletedOnboarding = true;
        localStorage.setItem(`userActivity_${user.uid}`, JSON.stringify(activity));
      }
    }
    
    setHasCompletedOnboarding(true);
    
    // Add welcome message to chatbot
    setTimeout(() => {
      setShowChatbot(true);
      setChatMessages([
        {
          text: "Welcome to TrustNet! I'm here to help you build authentic trust through meaningful promises. Would you like to plant your first promise today?",
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    }, 500);
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

  useEffect(() => {
    let timer;
    if (showOnboarding && onboardingStep < ONBOARDING_STEPS.length) {
      timer = setTimeout(() => {
        if (onboardingStep < ONBOARDING_STEPS.length - 1) {
          setOnboardingStep(prev => prev + 1);
        } else {
          completeOnboarding();
        }
      }, 5000); // 5 seconds per step
      
      return () => clearTimeout(timer);
    }
  }, [showOnboarding, onboardingStep]);

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
          className="flex justify-between items-center mb-8 p-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          role="banner"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">
              TrustNet-信木 Xin Mu
            </h1>
            <span className="text-2xl">🌿</span>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/profile')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="View profile"
            >
              <span>👤</span>
              <span className="hidden sm:inline">Profile</span>
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button
              onClick={() => {
                auth.signOut();
                router.push('/auth');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
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
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl"
          aria-labelledby="trust-score-heading"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
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
                <span>{chainReactions}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                <span>🌱</span>
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
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span>🧩</span> Daily Builder
            </h2>
            <div className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-3 py-1.5 rounded-full text-sm">
              Day {((new Date().getDate() % 3) + 1)}
            </div>
          </div>
          
          <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-xl p-4 mb-4">
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
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>📰</span> Trust Feed
          </h2>
          
          {/* Feed Header with Trust Circles Filter */}
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <div className="flex gap-2 overflow-x-auto py-1">
              {['all', 'friends', 'trust-circles'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFeedTab(tab)}
                  className={`px-3 py-1.5 rounded-full font-medium transition-all ${
                    activeFeedTab === tab
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
              <span>Sort by:</span>
              <select 
                value={feedSort}
                onChange={(e) => setFeedSort(e.target.value)}
                className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm"
              >
                <option value="recent">Most Recent</option>
                <option value="trust">Highest Trust Impact</option>
                <option value="completion">Completion Rate</option>
              </select>
            </div>
          </div>
          
          {/* Trust Feed Posts */}
          <div className="space-y-5">
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
                <div className="mb-4">
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
                <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-4">
                    {['🙌 Believe', '🌟 Inspire', '🤝 Support'].map((action) => (
                      <button
                        key={action}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrustScoreUpdate('support-reaction');
                        }}
                        className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors text-sm"
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
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <p>No posts in this category yet.</p>
                {activeFeedTab === 'trust-circles' && (
                  <button
                    onClick={() => setShowTrustCircleModal(true)}
                    className="mt-3 inline-flex bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Create Your First Trust Circle
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Trust Circles Section - Semantic Section Tag */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span>👥</span> Trust Circles
            </h2>
            <button
              onClick={() => setShowTrustCircleModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              + New Circle
            </button>
          </div>
          
          {/* Trust Circles List */}
          <div className="space-y-4">
            {/* Sample Trust Circle */}
            <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border-l-4 border-cyan-500">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-800 dark:text-gray-200">Morning Journalers</h3>
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full text-xs">
                  3/5 members
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Daily journaling accountability group</p>
              <div className="flex gap-2 flex-wrap mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 flex items-center justify-center text-white text-xs">
                  U
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-400 flex items-center justify-center text-white text-xs">
                  A
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-red-400 flex items-center justify-center text-white text-xs">
                  B
                </div>
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
            
            {/* Empty state for Trust Circles */}
            <div className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <span className="text-3xl mb-2">👥</span>
              <h3 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-1">No Trust Circles Yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                Create a small accountability group (3-5 people) for building trust together
              </p>
              <button
                onClick={() => setShowTrustCircleModal(true)}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Create Your First Circle
              </button>
            </div>
          </div>
        </section>

        {/* Dashboard Tabs - Semantic Section Tag */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-3 mb-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl">
          <div className="flex mb-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-xl overflow-hidden">
            {['Active', 'Completed', 'Archived'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`flex-1 py-3 font-medium transition-all ${
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
            <div className="space-y-4">
              {promises.filter(p => p.status === 'active' || p.status === 'drafting').length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 italic text-center py-4">
                  No active promises yet. Plant your first seed! 🌱
                </p>
              ) : (
                promises.filter(p => p.status === 'active' || p.status === 'drafting').map((p) => (
                  <div
                    key={p.id}
                    ref={p.id === newPromise?.id ? promiseCardRef : null}
                    className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer transition-all hover:shadow-md hover:-translate-y-1"
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
                    
                    {/* Emotional Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs">
                        🤝 {p.emotionalTone || 'Cooperative'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 text-xs">
                        💪 Motivational
                      </span>
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
            <div className="space-y-4">
              {promises.filter(p => p.status === 'aligned').length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 italic text-center py-4">
                  No completed promises yet. Keep building your trust! 🌱
                </p>
              ) : (
                promises.filter(p => p.status === 'aligned').map((p) => (
                  <div
                    key={p.id}
                    className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer transition-all hover:shadow-md"
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
                    
                    {/* Emotional Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs">
                        🤝 Cooperative
                      </span>
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
            <div className="space-y-4">
              {promises.filter(p => p.status === 'archived').length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 italic text-center py-4">
                  No archived promises yet.
                </p>
              ) : (
                promises.filter(p => p.status === 'archived').map((p) => (
                  <div
                    key={p.id}
                    className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer transition-all hover:shadow-md opacity-70"
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
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>🔍</span> Trust Snapshot
          </h2>
          
          {/* Trust Score */}
          <div className="flex items-center gap-4 mb-5">
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
                <div className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">
                  {trustScore}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Trust Score</div>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                You're building a solid foundation
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                {"Your trust score has increased " + (trustScore - 84) + "% this month"}
              </div>
            </div>
          </div>
          
          {/* Trust Metrics */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { title: 'Endorsements', value: promises.filter(p => p.status === 'aligned').length, color: 'cyan' },
              { title: 'Recent Agreements', value: promises.length, color: 'purple' },
              { title: 'In Progress', value: promises.filter(p => p.status === 'active' || p.status === 'drafting').length, color: 'yellow' },
              { title: 'Completed', value: promises.filter(p => p.status === 'aligned').length, color: 'cyan' }
            ].map((metric, index) => (
              <div 
                key={index}
                className={`p-4 rounded-xl border ${
                  darkMode 
                    ? 'bg-gray-50/5 border-gray-700' 
                    : `bg-${metric.color}-50 border-${metric.color}-100`
                }`}
              >
                <div className={`text-2xl font-bold ${
                  metric.color === 'cyan' ? 'text-cyan-500' : 
                  metric.color === 'purple' ? 'text-purple-500' : 'text-yellow-500'
                }`}>
                  {metric.value}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {metric.title}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Active Agreements Zone - Semantic Section Tag */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
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
                className="relative mb-6 last:mb-0 z-10 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-900/50 p-3 rounded-xl"
              >
                {/* Timeline dot */}
                <div className={`absolute -left-2 top-3.5 w-4 h-4 rounded-full border-2 ${
                  p.status === 'drafting' ? 'bg-red-500 border-red-200 dark:border-red-900' : 'bg-cyan-500 border-cyan-200 dark:border-cyan-900'
                }`}></div>
                
                {/* Item content */}
                <div className="flex items-center gap-3">
                  <span className="text-xl">{p.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-800 dark:text-gray-200">
                        {p.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        p.status === 'drafting' 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' 
                          : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200'
                      }`}>
                        {p.emotionalTone || 'Cooperative'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
                        <span>🗓️ {p.createdAt ? convertFirestoreDate(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown'}</span>
                        <span>·</span>
                        <span>{p.deadline ? convertFirestoreDate(p.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown'}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
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
          <div className="text-center mt-4">
            <button 
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span>+</span> Add Agreement
            </button>
          </div>
        </section>

        {/* Next Actions Zone - Semantic Section Tag */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>🚀</span> Next Actions
          </h2>
          
          {/* Action Cards */}
          <div className="space-y-4">
            {/* Show actions for promises that need clarification */}
            {promises
              .filter(p => p.status === 'drafting')
              .map(p => (
                <div key={p.id} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border-l-4 border-red-500 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-red-400 flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">
                      Clarify "{p.title}"
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 mb-3">
                      Your counterparty has questions about the timeframe
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClarify(p);
                        }}
                        className="bg-gradient-to-r from-red-500 to-red-400 text-white px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
                      >
                        Clarify
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemindLater(p);
                        }}
                        className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
                <div key={p.id} className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border-l-4 border-cyan-500 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">
                      Confirm "{p.title}"
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 mb-3">
                      Your counterparty has accepted your terms
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirm(p);
                        }}
                        className="bg-gradient-to-r from-cyan-500 to-cyan-400 text-white px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddNotes(p);
                        }}
                        className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
                <div key={p.id} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border-l-4 border-yellow-500 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-400 flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">
                      Nudge "{p.title}"
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 mb-3">
                      Your counterparty hasn't responded in 3 days
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendNudge(p);
                        }}
                        className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-white px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
                      >
                        Send Nudge
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSkipNudge(p);
                        }}
                        className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* Emotional Signals Zone - Semantic Section Tag */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>🧠</span> Emotional Signals
          </h2>
          
          {/* Sentiment Timeline */}
          <div className="relative h-40 mb-6">
            <svg viewBox="0 0 600 160" className="w-full h-full">
              {/* Timeline line */}
              <line
                x1="50"
                y1="100"
                x2="550"
                y2="100"
                stroke={darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
                strokeWidth="2"
              />
              
              {/* Timeline markers */}
              {promises.filter(p => p.status === 'aligned' || p.status === 'active' || p.status === 'drafting').slice(0, 5).map((p, index) => {
                const position = 100 + (index * 100);
                const date = p.createdAt ? convertFirestoreDate(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown';
                
                return (
                  <g key={p.id}>
                    {/* Vertical line */}
                    <line
                      x1={position}
                      y1="100"
                      x2={position}
                      y2="70"
                      stroke={p.status === 'drafting' ? '#FF6B6B' : p.status === 'active' ? '#FFD166' : '#4ECDC4'}
                      strokeWidth="2"
                    />
                    
                    {/* Marker dot */}
                    <circle
                      cx={position}
                      cy="70"
                      r="8"
                      fill={p.status === 'drafting' ? '#FF6B6B' : p.status === 'active' ? '#FFD166' : '#4ECDC4'}
                      stroke={darkMode ? '#2a2a2a' : 'white'}
                      strokeWidth="2"
                    />
                    
                    {/* Emoji */}
                    <text
                      x={position}
                      y="50"
                      fontSize="1.2rem"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {p.status === 'drafting' ? '😟' : p.status === 'active' ? '😐' : '😊'}
                    </text>
                    
                    {/* Date label */}
                    <text
                      x={position}
                      y="120"
                      fontSize="0.8rem"
                      fill={darkMode ? '#aaa' : '#666'}
                      textAnchor="middle"
                    >
                      {date}
                    </text>
                  </g>
                );
              })}
              
              {/* Sentiment trend line */}
              <polyline
                points={promises.filter(p => p.status === 'aligned' || p.status === 'active' || p.status === 'drafting').slice(0, 5).map((p, index) => {
                  const y = p.status === 'drafting' ? 90 : p.status === 'active' ? 85 : 70;
                  return `${100 + (index * 100)},${y}`;
                }).join(' ')}
                fill="none"
                stroke="url(#sentimentGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Gradient definition */}
              <defs>
                <linearGradient id="sentimentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF6B6B" />
                  <stop offset="50%" stopColor="#FFD166" />
                  <stop offset="100%" stopColor="#4ECDC4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          {/* Current Sentiment */}
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-400 flex items-center justify-center text-white text-2xl">
              🤝
            </div>
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                Current Sentiment: {promises.some(p => p.status === 'drafting') ? 'Concerned' : promises.some(p => p.status === 'active') ? 'Neutral' : 'Optimistic'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Your agreements are {promises.some(p => p.status === 'drafting') ? 'showing some concerns that need addressing' : promises.some(p => p.status === 'active') ? 'progressing steadily' : 'showing strong alignment and mutual understanding'}
              </p>
            </div>
          </div>
          
          {/* Sentiment Alert */}
          {promises.some(p => p.status === 'drafting') && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border-l-4 border-red-500">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl text-red-500">⚠️</span>
                <strong className="text-red-700 dark:text-red-200">Sentiment Alert</strong>
              </div>
              <p className="text-gray-800 dark:text-gray-200 mb-3">
                {promises.filter(p => p.status === 'drafting')[0]?.title} agreement shows a dip in sentiment. Want to revisit this term together?
              </p>
              <div className="flex justify-end">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReviewAgreement(promises.filter(p => p.status === 'drafting')[0]);
                  }}
                  className="bg-gradient-to-r from-red-500 to-red-400 text-white px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Review Agreement
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Progress Tracker Zone - Semantic Section Tag */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>📈</span> Progress Tracker
          </h2>
          
          {/* Overall Progress */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Overall Agreement Momentum</span>
              <span className="font-medium bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">
                {Math.min(100, Math.round((promises.filter(p => p.status === 'aligned').length / promises.length) * 100))}%
              </span>
            </div>
            <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, Math.round((promises.filter(p => p.status === 'aligned').length / promises.length) * 100))}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
          
          {/* Milestones */}
          <div className="space-y-4">
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
              <div key={index} className="flex items-center gap-4">
                {/* Milestone marker */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${
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
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">
                      {milestone.title}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {milestone.date}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
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
                    className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-white px-3 py-1.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                  >
                    Confirm
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Footer - Semantic Footer Tag */}
        <footer className="text-center mt-12 text-gray-500 dark:text-gray-400 text-sm" role="contentinfo">
          <p>&quot;A promise made is a seed planted.&quot;</p>
          <p>Powered by TrustNet • The first social platform where trust is the currency</p>
        </footer>
      </div>

      {/* Make a Promise Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-center mb-5 text-blue-600 dark:text-blue-400">
              🤝 Make a Promise
            </h2>
            
            {/* Promise Details */}
            <input
              type="text"
              placeholder="e.g. Journal every morning"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:text-white"
            />
            
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:text-white"
            />
            
            {/* Emoji Selector */}
            <div className="flex flex-wrap gap-2 mb-5">
              {['🌱', '📓', '🧘', '🏃', '📵', '📞', '🍽️', '📚'].map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`text-2xl p-2 rounded-lg transition-all ${
                    emoji === e 
                      ? 'ring-2 ring-blue-500 scale-110' 
                      : 'hover:scale-105'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            
            {/* Contact Tagging Section */}
            <div className="mb-5 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Share with others</h3>
              
              {/* Tagged Contacts */}
              <div className="flex flex-wrap gap-2 mb-3">
                {taggedContacts.map((contact, i) => (
                  <div key={i} className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">
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
              
              {/* Contact Type Buttons */}
              <div className="flex gap-2 mb-3">
                {['Family', 'Friends', 'Colleagues'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setShowContactModal({ type: 'phone', visible: true, forCircle: false })}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    {type === 'Family' && '👨‍👩‍👧‍👦'}
                    {type === 'Friends' && '👫'}
                    {type === 'Colleagues' && '👔'} {type}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setTaggedContacts([]);
                  setContactInput('');
                }}
                className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePromise}
                className="flex-1 bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-center mb-5 text-blue-600 dark:text-blue-400">
              👥 Create Trust Circle
            </h2>
            
            <p className="text-gray-500 dark:text-gray-400 text-center mb-5 text-sm">
              Create a small accountability group (3-5 people) for building trust together
            </p>
            
            {/* Circle Name */}
            <input
              type="text"
              placeholder="Circle name (e.g., Morning Journalers)"
              value={circleName}
              onChange={(e) => setCircleName(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:text-white"
            />
            
            {/* Circle Description */}
            <textarea
              placeholder="Brief description of your circle's purpose"
              value={circleDescription}
              onChange={(e) => setCircleDescription(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:text-white resize-none"
            />
            
            {/* Circle Members Section */}
            <div className="mb-5 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Add Members (2-4 people)</h3>
              
              {/* Current Members */}
              <div className="flex flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">
                  <span>👤</span>
                  <span>You</span>
                </div>
                {circleMembers.map((contact, i) => (
                  <div key={i} className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">
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
              
              {/* Add Members Buttons */}
              <div className="flex gap-2 mb-3">
                {['Family', 'Friends', 'Colleagues'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setShowContactModal({ type: 'phone', visible: true, forCircle: true })}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    {type === 'Family' && '👨‍👩‍👧‍👦'}
                    {type === 'Friends' && '👫'}
                    {type === 'Colleagues' && '👔'} {type}
                  </button>
                ))}
              </div>
              
              {/* Member Count Info */}
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
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
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTrustCircleModal(false);
                  setCircleName('');
                  setCircleDescription('');
                  setCircleMembers([]);
                }}
                className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                } p-3 rounded-lg font-medium`}
              >
                Create Circle
              </button>
            </div>
            
            {/* Trust Circle Guidelines */}
            <div className="mt-5 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-sm text-gray-600 dark:text-gray-300">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Why Trust Circles?</h4>
              <p>
                Trust Circles are small accountability groups (3-5 people) designed specifically for building trust through shared promises. Unlike large social networks, these intimate circles foster meaningful connections where trust can actually grow.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Promise Detail Modal (AI Coach) */}
      {selectedPromise && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{selectedPromise.emoji}</span>
              <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {selectedPromise.title}
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-5">
              <strong>Status:</strong> {selectedPromise.status === 'aligned' ? '✅ Done' : '🔄 Active'}<br/>
              <strong>Deadline:</strong> {selectedPromise.deadline ? convertFirestoreDate(selectedPromise.deadline).toLocaleDateString() : 'No deadline'}<br/>
              <strong>Progress:</strong> {selectedPromise.progress}
            </p>
            <div className="p-5 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border border-cyan-200 dark:border-cyan-900">
              <h3 className="text-lg font-medium text-cyan-700 dark:text-cyan-300 flex items-center gap-2 mb-3">
                <span>🤖</span> AI Coach Suggests:
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-200">
                {(() => {
                  const title = selectedPromise.title.toLowerCase();
                  const wisdomBanks = {
                    journal: [
                      "Write one sentence today. Momentum > perfection.",
                      "Morning pages clear the mind. Try 7 minutes with coffee.",
                      "Don't write what happened. Write how you felt.",
                      "Skip a day? Forgive yourself. The next page is always open.",
                      "Your journal is a mirror. What does it reflect?"
                    ],
                    mom: [
                      "Call her not because you should, but because she's your first home.",
                      "Ask her: &apos;What made you smile today?&apos; Listen. That's love.",
                      "She doesn't need long calls. 90 seconds of &apos;I&apos;m thinking of you&apos; is enough.",
                      "If you miss a week, say: &apos;I&apos;m back.&apos; No apology needed.",
                      "One day, her voice will be a memory. Record it now."
                    ],
                    social: [
                      "Scrolling is escape. What are you running from?",
                      "Turn off notifications after 9 PM. Your mind deserves silence.",
                      "Replace 10 mins of scrolling with 10 mins of stretching.",
                      "Track your mood: Do you feel better after or before?",
                      "You're not addicted. You're lonely. Reach out instead."
                    ],
                    default: [
                      "Break your promise into tiny actions. Small steps win.",
                      "Set a reminder at the same time every day. Consistency builds trust.",
                      "Reflect weekly: What helped? What didn't?",
                      "Share your journey — inspire others!",
                      "Streak broken? Start again. Integrity is a practice, not perfection."
                    ]
                  };

                  const bank = 
                    title.includes('journal') ? wisdomBanks.journal :
                    title.includes('call') || title.includes('mom') ? wisdomBanks.mom :
                    title.includes('social') || title.includes('phone') ? wisdomBanks.social :
                    wisdomBanks.default;

                  const shuffled = [...bank].sort(() => 0.5 - Math.random());
                  return shuffled.slice(0, 3).map((tip, i) => <li key={i}>{tip}</li>);
                })()}
              </ul>
            </div>
            <button
              onClick={() => alert("🛠️ Support Ticket: Our team will help you within 24 hours.")}
              className="w-full mt-5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              🛠️ Need Help?
            </button>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setSelectedPromise(null)}
                className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              {selectedPromise.status !== 'aligned' && (
                <button
                  onClick={() => {
                    handleConfirm(selectedPromise);
                    setSelectedPromise(null);
                  }}
                  className="flex-1 bg-green-600 text-white p-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
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
            className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg cursor-pointer"
            style={{
              transform: 'translateX(100%)',
              animation: 'slideIn 1s ease forwards'
            }}
          >
            {/* Status Badge */}
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
              🟢 Active
            </div>
            
            {/* Card Content */}
            <div className="flex items-center gap-3">
              <span className="text-2xl">{newPromise?.emoji}</span>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800 dark:text-gray-200">
                  {newPromise?.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
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

      {/* AI Support Chatbot */}
      <div ref={chatbotRef} className="fixed bottom-6 right-6 z-40">
        {/* Chatbot Button */}
        <button
          onClick={handleChatbotToggle}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
          aria-label="Open TrustNet AI Assistant"
        >
          <span className="text-2xl">🤖</span>
        </button>
        
        {/* Chatbot Interface */}
        {showChatbot && (
          <div className="absolute bottom-16 right-0 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-white">
                  🤖
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">TrustNet AI Assistant</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Always here to help</p>
                </div>
              </div>
              <button
                onClick={() => setShowChatbot(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label="Close chat"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-br-none'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={handleChatInput}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                  placeholder="Ask about TrustNet, promises, or how to build trust..."
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={handleChatSend}
                  className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                  aria-label="Send message"
                >
                  <span className="text-xl">➤</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Tip: Ask about &quot;promises&quot;, &quot;Trust Circles&quot;, or &quot;how to improve my Trust Score&quot;
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Onboarding Tour */}
      {showOnboarding && (
        <div 
          ref={onboardingRef}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={handleOnboardingSkip}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4">
              <button
                onClick={handleOnboardingSkip}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-white text-2xl mx-auto mb-4">
                🌱
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                Welcome to TrustNet
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Your 20-second guided tour to building authentic trust
              </p>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                {ONBOARDING_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full mx-1 ${
                      index === onboardingStep ? 'bg-cyan-500 w-4' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  ></div>
                ))}
              </div>
              
              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">
                {ONBOARDING_STEPS[onboardingStep].title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {ONBOARDING_STEPS[onboardingStep].content}
              </p>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={handleOnboardingSkip}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Skip Tour
              </button>
              <button
                onClick={handleOnboardingNext}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                {onboardingStep < ONBOARDING_STEPS.length - 1 ? 'Next' : 'Get Started'}
              </button>
            </div>
            
            {/* Highlight Overlay */}
            {ONBOARDING_STEPS[onboardingStep].target && (
              <div 
                className="fixed bg-black/30 rounded-xl pointer-events-none"
                style={{
                  top: ONBOARDING_STEPS[onboardingStep].target.current?.getBoundingClientRect().top + window.scrollY - 20,
                  left: ONBOARDING_STEPS[onboardingStep].target.current?.getBoundingClientRect().left - 20,
                  width: ONBOARDING_STEPS[onboardingStep].target.current?.getBoundingClientRect().width + 40,
                  height: ONBOARDING_STEPS[onboardingStep].target.current?.getBoundingClientRect().height + 40
                }}
              ></div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
