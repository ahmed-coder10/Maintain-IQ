import { 
  isDemoMode, 
  firestoreDb, 
  storage 
} from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ----------------------------------------------------
// REAL-TIME PUB/SUB FOR LOCAL STORAGE EMULATION
// ----------------------------------------------------
const listeners = {
  assets: [],
  issues: [],
  history: []
};

const notifyListeners = (collectionName) => {
  const data = JSON.parse(localStorage.getItem(`maintainiq_${collectionName}`));
  listeners[collectionName].forEach(cb => cb(data));
};

const subscribeToLocalCollection = (collectionName, callback) => {
  listeners[collectionName].push(callback);
  // Send initial data
  const data = JSON.parse(localStorage.getItem(`maintainiq_${collectionName}`)) || [];
  callback(data);
  
  // Return unsubscribe function
  return () => {
    listeners[collectionName] = listeners[collectionName].filter(cb => cb !== callback);
  };
};

// Helper to generate a random ID
const generateId = () => Math.random().toString(36).substring(2, 11);

// ----------------------------------------------------
// UNIFIED DATABASE SERVICE
// ----------------------------------------------------

export const dbService = {
  // ----------------------------------------------------
  // ASSETS
  // ----------------------------------------------------
  subscribeAssets(callback) {
    if (!isDemoMode) {
      const q = query(collection(firestoreDb, 'assets'), orderBy('name'));
      return onSnapshot(q, (snapshot) => {
        const assets = [];
        snapshot.forEach((doc) => {
          assets.push({ id: doc.id, ...doc.data() });
        });
        callback(assets);
      });
    } else {
      return subscribeToLocalCollection('assets', callback);
    }
  },

  async getAssets() {
    if (!isDemoMode) {
      const snapshot = await getDocs(query(collection(firestoreDb, 'assets'), orderBy('name')));
      const assets = [];
      snapshot.forEach(doc => assets.push({ id: doc.id, ...doc.data() }));
      return assets;
    } else {
      return JSON.parse(localStorage.getItem('maintainiq_assets')) || [];
    }
  },

  async getAssetById(id) {
    if (!isDemoMode) {
      const docRef = doc(firestoreDb, 'assets', id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } else {
      const assets = await this.getAssets();
      return assets.find(a => a.id === id) || null;
    }
  },

  async getAssetByCode(code) {
    if (!isDemoMode) {
      const q = query(collection(firestoreDb, 'assets'), where('code', '==', code.toUpperCase()));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } else {
      const assets = await this.getAssets();
      return assets.find(a => a.code.toUpperCase() === code.toUpperCase()) || null;
    }
  },

  async createAsset(assetData) {
    // 1. Check for duplicate asset code
    const existing = await this.getAssetByCode(assetData.code);
    if (existing) {
      throw new Error('Duplicate asset code: An asset with this code already exists.');
    }

    const newAsset = {
      ...assetData,
      code: assetData.code.toUpperCase(),
      createdAt: new Date().toISOString()
    };

    let id;
    if (!isDemoMode) {
      const docRef = await addDoc(collection(firestoreDb, 'assets'), newAsset);
      id = docRef.id;
    } else {
      const assets = await this.getAssets();
      id = 'asset-' + generateId();
      assets.push({ id, ...newAsset });
      localStorage.setItem('maintainiq_assets', JSON.stringify(assets));
      notifyListeners('assets');
    }

    // Record in history
    await this.addHistoryEntry(id, 'Asset Created', assetData.createdBy || 'System', 'Asset added to catalog.');
    return id;
  },

  async updateAsset(id, assetData) {
    // Check if code was changed and if the new code conflicts with another asset
    if (assetData.code) {
      const existing = await this.getAssetByCode(assetData.code);
      if (existing && existing.id !== id) {
        throw new Error('Duplicate asset code: Another asset is already using this code.');
      }
    }

    const updatedFields = {
      ...assetData,
      updatedAt: new Date().toISOString()
    };

    if (updatedFields.code) {
      updatedFields.code = updatedFields.code.toUpperCase();
    }

    if (!isDemoMode) {
      const docRef = doc(firestoreDb, 'assets', id);
      await updateDoc(docRef, updatedFields);
    } else {
      const assets = await this.getAssets();
      const index = assets.findIndex(a => a.id === id);
      if (index !== -1) {
        assets[index] = { ...assets[index], ...updatedFields };
        localStorage.setItem('maintainiq_assets', JSON.stringify(assets));
        notifyListeners('assets');
      }
    }

    // Record history for status or condition changes
    if (assetData.status) {
      await this.addHistoryEntry(id, 'Status Updated', assetData.updatedBy || 'System', `Asset status changed to ${assetData.status}.`);
    }
  },

  async deleteAsset(id) {
    // Record in history
    await this.addHistoryEntry(id, 'Asset Permanently Removed', 'Admin', 'Asset marked as deleted/retired.');

    if (!isDemoMode) {
      const docRef = doc(firestoreDb, 'assets', id);
      await deleteDoc(docRef);
    } else {
      const assets = await this.getAssets();
      const filtered = assets.filter(a => a.id !== id);
      localStorage.setItem('maintainiq_assets', JSON.stringify(filtered));
      notifyListeners('assets');
    }
  },

  // ----------------------------------------------------
  // ISSUES
  // ----------------------------------------------------
  subscribeIssues(callback) {
    if (!isDemoMode) {
      const q = query(collection(firestoreDb, 'issues'), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const issues = [];
        snapshot.forEach((doc) => {
          issues.push({ id: doc.id, ...doc.data() });
        });
        callback(issues);
      });
    } else {
      return subscribeToLocalCollection('issues', callback);
    }
  },

  async getIssues() {
    if (!isDemoMode) {
      const snapshot = await getDocs(query(collection(firestoreDb, 'issues'), orderBy('createdAt', 'desc')));
      const issues = [];
      snapshot.forEach(doc => issues.push({ id: doc.id, ...doc.data() }));
      return issues;
    } else {
      return JSON.parse(localStorage.getItem('maintainiq_issues')) || [];
    }
  },

  async getIssueById(id) {
    if (!isDemoMode) {
      const docRef = doc(firestoreDb, 'issues', id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } else {
      const issues = await this.getIssues();
      return issues.find(i => i.id === id) || null;
    }
  },

  async createIssue(issueData) {
    const year = new Date().getFullYear();
    const count = (await this.getIssues()).length + 1;
    const issueNumber = `ISS-${year}-${String(count).padStart(3, '0')}`;

    const newIssue = {
      ...issueData,
      issueNumber,
      status: 'Reported',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let id;
    if (!isDemoMode) {
      const docRef = await addDoc(collection(firestoreDb, 'issues'), newIssue);
      id = docRef.id;
    } else {
      const issues = await this.getIssues();
      id = 'issue-' + generateId();
      issues.push({ id, ...newIssue });
      localStorage.setItem('maintainiq_issues', JSON.stringify(issues));
      notifyListeners('issues');
    }

    // Update asset status to "Issue Reported"
    await this.updateAsset(issueData.assetId, { 
      status: 'Issue Reported',
      updatedBy: issueData.reporterName || 'Public Reporter'
    });

    // Add to history
    await this.addHistoryEntry(
      issueData.assetId, 
      'Issue Reported', 
      issueData.reporterName || 'Public Reporter', 
      `Reported: "${issueData.title}" (${issueNumber})`
    );

    return { id, issueNumber };
  },

  async updateIssue(id, issueFields) {
    const updated = {
      ...issueFields,
      updatedAt: new Date().toISOString()
    };

    let originalIssue = await this.getIssueById(id);
    if (!originalIssue) return;

    if (!isDemoMode) {
      const docRef = doc(firestoreDb, 'issues', id);
      await updateDoc(docRef, updated);
    } else {
      const issues = await this.getIssues();
      const index = issues.findIndex(i => i.id === id);
      if (index !== -1) {
        issues[index] = { ...issues[index], ...updated };
        localStorage.setItem('maintainiq_issues', JSON.stringify(issues));
        notifyListeners('issues');
      }
    }

    // Status mapping rules:
    // If status updated, update asset status as well
    if (issueFields.status && issueFields.status !== originalIssue.status) {
      let assetStatus = 'Operational';
      
      if (issueFields.status === 'Inspection Started') {
        assetStatus = 'Under Inspection';
      } else if (issueFields.status === 'Maintenance In Progress') {
        assetStatus = 'Under Maintenance';
      } else if (issueFields.status === 'Waiting for Parts') {
        assetStatus = 'Under Maintenance';
      } else if (issueFields.status === 'Resolved' || issueFields.status === 'Closed') {
        assetStatus = 'Operational';
      } else if (issueFields.status === 'Reopened') {
        assetStatus = 'Issue Reported';
      } else if (issueFields.status === 'Assigned') {
        assetStatus = 'Issue Reported';
      }

      await this.updateAsset(originalIssue.assetId, { 
        status: assetStatus,
        updatedBy: issueFields.updatedBy || 'Technician'
      });

      // Add to history
      await this.addHistoryEntry(
        originalIssue.assetId, 
        issueFields.status, 
        issueFields.updatedBy || 'Technician', 
        `Issue ${originalIssue.issueNumber} status changed to: ${issueFields.status}`
      );
    }
  },

  // ----------------------------------------------------
  // HISTORY
  // ----------------------------------------------------
  subscribeHistory(assetId, callback) {
    if (!isDemoMode) {
      const q = query(
        collection(firestoreDb, 'history'), 
        where('assetId', '==', assetId), 
        orderBy('date', 'desc')
      );
      return onSnapshot(q, (snapshot) => {
        const history = [];
        snapshot.forEach((doc) => {
          history.push({ id: doc.id, ...doc.data() });
        });
        callback(history);
      });
    } else {
      return subscribeToLocalCollection('history', (historyList) => {
        const filtered = historyList
          .filter(h => h.assetId === assetId)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        callback(filtered);
      });
    }
  },

  async getHistory(assetId) {
    if (!isDemoMode) {
      const q = query(
        collection(firestoreDb, 'history'), 
        where('assetId', '==', assetId), 
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      const history = [];
      snapshot.forEach(doc => history.push({ id: doc.id, ...doc.data() }));
      return history;
    } else {
      const history = JSON.parse(localStorage.getItem('maintainiq_history')) || [];
      return history
        .filter(h => h.assetId === assetId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  },

  async addHistoryEntry(assetId, action, actor, details) {
    const entry = {
      assetId,
      action,
      actor,
      details,
      date: new Date().toISOString()
    };

    if (!isDemoMode) {
      await addDoc(collection(firestoreDb, 'history'), entry);
    } else {
      const history = JSON.parse(localStorage.getItem('maintainiq_history')) || [];
      history.push({ id: 'h-' + generateId(), ...entry });
      localStorage.setItem('maintainiq_history', JSON.stringify(history));
      notifyListeners('history');
    }
  },

  // ----------------------------------------------------
  // SETTINGS & STORAGE
  // ----------------------------------------------------
  async getSettings() {
    if (!isDemoMode) {
      const docRef = doc(firestoreDb, 'settings', 'global');
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : { orgName: 'SMIT Enterprise Facilities', adminName: 'Super Admin', geminiApiKey: '' };
    } else {
      return JSON.parse(localStorage.getItem('maintainiq_settings')) || { orgName: 'SMIT Enterprise Facilities', adminName: 'Super Admin', geminiApiKey: '' };
    }
  },

  async updateSettings(settingsData) {
    if (!isDemoMode) {
      const docRef = doc(firestoreDb, 'settings', 'global');
      await setDoc(docRef, settingsData, { merge: true });
    } else {
      localStorage.setItem('maintainiq_settings', JSON.stringify(settingsData));
    }
  },

  async uploadFile(file, path) {
    if (!isDemoMode && storage) {
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } else {
      // Mock File Upload: return a local object URL or mock Unsplash image
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result); // Base64 encoding for local persistence
        };
        reader.readAsDataURL(file);
      });
    }
  },

  // Seed Reset helper (crucial for evaluation checklist)
  async resetDemoData() {
    localStorage.setItem('maintainiq_assets', JSON.stringify(INITIAL_ASSETS));
    localStorage.setItem('maintainiq_issues', JSON.stringify(INITIAL_ISSUES));
    localStorage.setItem('maintainiq_history', JSON.stringify(INITIAL_HISTORY));
    localStorage.setItem('maintainiq_settings', JSON.stringify({
      orgName: 'SMIT Enterprise Facilities',
      adminName: 'Super Admin',
      geminiApiKey: ''
    }));
    // Clear current session storage user to force fresh logins
    sessionStorage.removeItem('maintainiq_currentUser');
    
    // Notify all listeners
    notifyListeners('assets');
    notifyListeners('issues');
    notifyListeners('history');
  }
};
