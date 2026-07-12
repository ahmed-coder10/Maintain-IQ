import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if Firebase config is fully provided and valid
const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_API_KEY" && 
  firebaseConfig.projectId;

let app, auth, firestoreDb, storage;
let isDemoMode = true;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    firestoreDb = getFirestore(app);
    storage = getStorage(app);
    isDemoMode = false;
    console.log("MaintainIQ: Firebase successfully initialized.");
  } catch (error) {
    console.error("MaintainIQ: Firebase failed to initialize, falling back to Local Demo Mode.", error);
    isDemoMode = true;
  }
} else {
  console.log("MaintainIQ: Firebase credentials not detected. Operating in Local Demo Mode.");
}

// ----------------------------------------------------
// LOCALSTORAGE DEMO MODE IMPLEMENTATION
// ----------------------------------------------------

const DEMO_USERS = [
  { id: 'admin-1', email: 'admin@maintainiq.com', role: 'admin', name: 'Administrator', password: 'admin123' },
  { id: 'tech-1', email: 'tech@maintainiq.com', role: 'technician', name: 'Alex Rivier', password: 'tech123' },
  { id: 'tech-2', email: 'sarah@maintainiq.com', role: 'technician', name: 'Sarah Jenkins', password: 'tech123' }
];

const INITIAL_ASSETS = [
  {
    id: 'asset-1',
    name: 'Classroom Projector 01',
    code: 'PROJ-001',
    category: 'Electronics',
    department: 'Education',
    location: 'Classroom 3A',
    condition: 'Good',
    status: 'Operational',
    assignedTechnician: 'Alex Rivier',
    purchaseDate: '2025-01-15',
    lastService: '2026-05-10',
    nextService: '2026-11-10',
    description: '4K Ultra Short Throw Epson Projector mounted on ceiling.',
    imageUrl: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 'asset-2',
    name: 'Central HVAC Unit A',
    code: 'HVAC-002',
    category: 'HVAC',
    department: 'Facilities',
    location: 'Roof Section B',
    condition: 'Fair',
    status: 'Under Inspection',
    assignedTechnician: 'Sarah Jenkins',
    purchaseDate: '2023-06-20',
    lastService: '2026-04-02',
    nextService: '2026-07-20',
    description: 'Carrier Commercial air handler serving South Wing.',
    imageUrl: 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 'asset-3',
    name: 'Lab Spectrophotometer',
    code: 'SPEC-003',
    category: 'Laboratory',
    department: 'Science',
    location: 'Biology Lab 2',
    condition: 'Good',
    status: 'Operational',
    assignedTechnician: 'Alex Rivier',
    purchaseDate: '2025-09-10',
    lastService: '2026-03-12',
    nextService: '2026-09-12',
    description: 'Thermo Scientific Genesys 150 Spectrophotometer.',
    imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 'asset-4',
    name: 'Server Rack Switch',
    code: 'NET-004',
    category: 'Networking',
    department: 'IT',
    location: 'Server Room',
    condition: 'Excellent',
    status: 'Operational',
    assignedTechnician: 'Sarah Jenkins',
    purchaseDate: '2026-02-18',
    lastService: '2026-02-18',
    nextService: '2027-02-18',
    description: 'Cisco Catalyst 9300 48-port PoE+ switch stack.',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 'asset-5',
    name: 'Backup Generator',
    code: 'GEN-005',
    category: 'Electrical',
    department: 'Facilities',
    location: 'Basement Mechanical Room',
    condition: 'Poor',
    status: 'Out of Service',
    assignedTechnician: 'Alex Rivier',
    purchaseDate: '2020-04-12',
    lastService: '2025-12-05',
    nextService: '2026-06-05',
    description: 'Caterpillar 150kVA diesel standby generator.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=60'
  }
];

const INITIAL_ISSUES = [
  {
    id: 'issue-1',
    issueNumber: 'ISS-2026-001',
    assetId: 'asset-2',
    assetName: 'Central HVAC Unit A',
    assetCode: 'HVAC-002',
    title: 'AC is making rattling noise',
    description: 'Vibration sound coming from the compressor fan during high load.',
    priority: 'Medium',
    category: 'Noise',
    reporterName: 'John Doe',
    reporterEmail: 'john@example.com',
    status: 'Inspection Started', // Reported, Assigned, Inspection Started, Maintenance In Progress, Waiting for Parts, Resolved, Closed, Reopened
    evidenceUrl: '',
    assignedTo: 'Sarah Jenkins',
    createdAt: '2026-07-10T14:30:00Z',
    updatedAt: '2026-07-11T09:00:00Z',
    isAiTriaged: true,
    isAiEdited: false
  },
  {
    id: 'issue-2',
    issueNumber: 'ISS-2026-002',
    assetId: 'asset-5',
    assetName: 'Backup Generator',
    assetCode: 'GEN-005',
    title: 'Failure to start auto-transfer',
    description: 'During a brief outage, the generator failed to automatically supply power to main panels.',
    priority: 'Critical',
    category: 'Electrical Failure',
    reporterName: 'Security Desk',
    reporterEmail: 'security@example.com',
    status: 'Reported',
    evidenceUrl: '',
    assignedTo: 'Alex Rivier',
    createdAt: '2026-07-11T20:15:00Z',
    updatedAt: '2026-07-11T20:15:00Z',
    isAiTriaged: true,
    isAiEdited: true
  }
];

const INITIAL_HISTORY = [
  { id: 'h-1', assetId: 'asset-1', date: '2025-01-15T09:00:00Z', actor: 'System', action: 'Asset Created', details: 'Asset added to catalog.' },
  { id: 'h-2', assetId: 'asset-2', date: '2023-06-20T10:00:00Z', actor: 'System', action: 'Asset Created', details: 'Asset added to catalog.' },
  { id: 'h-3', assetId: 'asset-3', date: '2025-09-10T08:30:00Z', actor: 'System', action: 'Asset Created', details: 'Asset added to catalog.' },
  { id: 'h-4', assetId: 'asset-4', date: '2026-02-18T11:00:00Z', actor: 'System', action: 'Asset Created', details: 'Asset added to catalog.' },
  { id: 'h-5', assetId: 'asset-5', date: '2020-04-12T14:00:00Z', actor: 'System', action: 'Asset Created', details: 'Asset added to catalog.' },
  { id: 'h-6', assetId: 'asset-2', date: '2026-07-10T14:30:00Z', actor: 'John Doe (Public)', action: 'Issue Reported', details: 'Reported rattling noise (ISS-2026-001).' },
  { id: 'h-7', assetId: 'asset-2', date: '2026-07-11T09:00:00Z', actor: 'Sarah Jenkins', action: 'Inspection Started', details: 'Began inspecting the compressor rattling issue.' },
  { id: 'h-8', assetId: 'asset-5', date: '2026-07-11T20:15:00Z', actor: 'Security Desk (Public)', action: 'Issue Reported', details: 'Reported ATS start failure (ISS-2026-002).' }
];

// LocalStorage helpers to load/save state
const initLocalStorage = () => {
  if (!localStorage.getItem('maintainiq_assets')) {
    localStorage.setItem('maintainiq_assets', JSON.stringify(INITIAL_ASSETS));
  }
  if (!localStorage.getItem('maintainiq_issues')) {
    localStorage.setItem('maintainiq_issues', JSON.stringify(INITIAL_ISSUES));
  }
  if (!localStorage.getItem('maintainiq_history')) {
    localStorage.setItem('maintainiq_history', JSON.stringify(INITIAL_HISTORY));
  }
  if (!localStorage.getItem('maintainiq_settings')) {
    localStorage.setItem('maintainiq_settings', JSON.stringify({
      orgName: 'SMIT Enterprise Facilities',
      adminName: 'Super Admin',
      geminiApiKey: ''
    }));
  }
};

initLocalStorage();

// Mock Auth system
class MockAuth {
  constructor() {
    this.listeners = [];
    this.currentUser = JSON.parse(sessionStorage.getItem('maintainiq_currentUser')) || null;
  }

  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  async signInWithEmailAndPassword(email, password) {
    const user = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) {
      throw new Error('auth/invalid-credential');
    }
    const authUser = {
      uid: user.id,
      email: user.email,
      displayName: user.name,
      role: user.role
    };
    this.currentUser = authUser;
    sessionStorage.setItem('maintainiq_currentUser', JSON.stringify(authUser));
    this.listeners.forEach(l => l(authUser));
    return { user: authUser };
  }

  async signOut() {
    this.currentUser = null;
    sessionStorage.removeItem('maintainiq_currentUser');
    this.listeners.forEach(l => l(null));
  }

  async sendPasswordResetEmail(email) {
    const user = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('auth/user-not-found');
    }
    return true;
  }
}

const mockAuthInstance = new MockAuth();

export { 
  app, 
  auth, 
  firestoreDb, 
  storage, 
  isDemoMode,
  mockAuthInstance,
  DEMO_USERS
};
