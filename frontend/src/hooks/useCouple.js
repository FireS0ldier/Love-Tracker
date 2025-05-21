import { useState, useEffect } from 'react';
import { 
  getDoc, 
  doc, 
  setDoc, 
  collection, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '../firebase';
import { encryptData, decryptData } from '../utils/crypto';

/**
 * Custom hook for managing couple data and authentication
 */
export const useCouple = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [coupleData, setCoupleData] = useState(null);
  const [coupleId, setCoupleId] = useState(null);
  
  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Listen for couple data changes
  useEffect(() => {
    if (!coupleId || !user) return;
    
    const coupleRef = doc(db, 'couples', coupleId);
    
    const unsubscribe = onSnapshot(coupleRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          setCoupleData(snapshot.data());
        }
      },
      (err) => {
        console.error("Error listening to couple data:", err);
        setError("Could not load couple data.");
      }
    );
    
    return () => unsubscribe();
  }, [coupleId, user]);

  /**
   * Sign in anonymously
   */
  const signIn = async () => {
    try {
      setLoading(true);
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Error signing in:", error);
      setError("Authentication failed.");
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Create a new couple
   * @param {string} startDate - Relationship start date in ISO format
   * @returns {Promise<string>} - The generated couple code
   */
  const createCouple = async (startDate) => {
    try {
      if (!user) await signIn();
      
      setLoading(true);
      
      // Call Firebase function to create a new couple
      const createCoupleFn = httpsCallable(functions, 'createCouple');
      const result = await createCoupleFn({ startDate });
      
      // Set the couple ID from the result
      const { coupleId, coupleCode } = result.data;
      setCoupleId(coupleId);
      
      return coupleCode;
    } catch (error) {
      console.error("Error creating couple:", error);
      setError("Failed to create couple.");
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Join an existing couple using a code
   * @param {string} code - The couple code to join
   * @returns {Promise<boolean>} - Whether joining was successful
   */
  const joinCouple = async (code) => {
    try {
      if (!user) await signIn();
      
      setLoading(true);
      
      // Call Firebase function to join a couple
      const joinCoupleFn = httpsCallable(functions, 'joinCouple');
      const result = await joinCoupleFn({ code });
      
      // Set the couple ID from the result
      const { coupleId, success } = result.data;
      
      if (success) {
        setCoupleId(coupleId);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error joining couple:", error);
      setError("Failed to join couple.");
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Add or update encrypted data in the couple document
   * @param {string} field - The field name to update
   * @param {any} data - The data to encrypt and store
   */
  const updateEncryptedData = async (field, data) => {
    try {
      if (!coupleId || !coupleData) {
        throw new Error("No couple data available.");
      }
      
      // Generate a key from the couple ID (simplified for MVP)
      const encryptionKey = coupleId;
      
      // Encrypt the data
      const encryptedValue = await encryptData(
        JSON.stringify(data), 
        encryptionKey
      );
      
      // Update Firestore document
      const coupleRef = doc(db, 'couples', coupleId);
      await setDoc(coupleRef, { [field]: encryptedValue }, { merge: true });
      
      return true;
    } catch (error) {
      console.error(`Error updating encrypted field ${field}:`, error);
      setError(`Failed to update ${field}.`);
      return false;
    }
  };
  
  /**
   * Decrypt and return data from a field in the couple document
   * @param {string} field - The field to decrypt
   * @returns {any|null} - The decrypted data or null if unavailable
   */
  const getDecryptedData = async (field) => {
    try {
      if (!coupleId || !coupleData || !coupleData[field]) {
        return null;
      }
      
      // Generate a key from the couple ID (simplified for MVP)
      const encryptionKey = coupleId;
      
      // Decrypt the data
      const decryptedValue = await decryptData(
        coupleData[field],
        encryptionKey
      );
      
      return JSON.parse(decryptedValue);
    } catch (error) {
      console.error(`Error decrypting field ${field}:`, error);
      return null;
    }
  };

  return {
    loading,
    error,
    user,
    coupleData,
    coupleId,
    signIn,
    createCouple,
    joinCouple,
    updateEncryptedData,
    getDecryptedData
  };
};

export default useCouple;
