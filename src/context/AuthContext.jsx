import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth as firebaseAuth, 
  isDemoMode, 
  mockAuthInstance,
  DEMO_USERS 
} from '../services/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;
    
    if (!isDemoMode && firebaseAuth) {
      unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          // In real Firebase, we would query the user's role from firestore,
          // but to keep it simple, we match by email domain or a custom field.
          // In a production app, custom claims or a user document is loaded.
          // Let's resolve the role based on email or demo user table match.
          const demoMatch = DEMO_USERS.find(du => du.email.toLowerCase() === user.email.toLowerCase());
          const role = demoMatch ? demoMatch.role : (user.email.includes('tech') ? 'technician' : 'admin');
          
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || (demoMatch ? demoMatch.name : 'User'),
            role: role
          });
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      });
    } else {
      // Demo Mode
      unsubscribe = mockAuthInstance.onAuthStateChanged((user) => {
        setCurrentUser(user);
        setLoading(false);
      });
    }

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      if (!isDemoMode && firebaseAuth) {
        const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
        return result.user;
      } else {
        const result = await mockAuthInstance.signInWithEmailAndPassword(email, password);
        return result.user;
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (!isDemoMode && firebaseAuth) {
        await signOut(firebaseAuth);
      } else {
        await mockAuthInstance.signOut();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    if (!isDemoMode && firebaseAuth) {
      // Real firebase password reset
      // import { sendPasswordResetEmail } from 'firebase/auth';
      // await sendPasswordResetEmail(firebaseAuth, email);
    } else {
      await mockAuthInstance.sendPasswordResetEmail(email);
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
