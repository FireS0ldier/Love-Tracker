import { useState, useEffect } from 'react';
import { encryptData, decryptData } from '../utils/crypto';

/**
 * Custom hook for managing couple data and authentication
 */
export const useCouple = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [coupleData, setCoupleData] = useState(null);
  const [coupleId, setCoupleId] = useState(null);
  
  // Backend API URL from environment variables
  const API_URL = process.env.REACT_APP_BACKEND_URL || '';
  
  // Generate a simple anonymous user ID if needed
  useEffect(() => {
    if (!user) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        // Generate a simple anonymous user
        const newUser = {
          id: 'user_' + Date.now(),
          isAnonymous: true
        };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
      }
    }
  }, [user]);
  
  // Load saved couple data from localStorage
  useEffect(() => {
    const storedCoupleId = localStorage.getItem('coupleId');
    if (storedCoupleId) {
      setCoupleId(storedCoupleId);
      
      const storedCoupleData = localStorage.getItem('coupleData');
      if (storedCoupleData) {
        try {
          setCoupleData(JSON.parse(storedCoupleData));
        } catch (err) {
          console.error("Error parsing stored couple data:", err);
        }
      }
    }
  }, []);
  
  // Fetch couple data when coupleId changes
  useEffect(() => {
    if (!coupleId) return;
    
    const fetchCoupleData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/couples/${coupleId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch couple data: ${response.status}`);
        }
        
        const data = await response.json();
        setCoupleData(data);
        localStorage.setItem('coupleData', JSON.stringify(data));
      } catch (err) {
        console.error("Error fetching couple data:", err);
        setError("Could not load couple data.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCoupleData();
  }, [coupleId, API_URL]);

  /**
   * Sign in anonymously
   */
  const signIn = async () => {
    try {
      setLoading(true);
      
      // Generate a simple anonymous user
      const newUser = {
        id: 'user_' + Date.now(),
        isAnonymous: true
      };
      
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      return newUser;
    } catch (error) {
      console.error("Error signing in:", error);
      setError("Authentication failed.");
      return null;
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
      if (!user) {
        await signIn();
      }
      
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/couples`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          created_by: user.id,
          start_date: new Date(startDate)
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create couple: ${response.status}`);
      }
      
      const data = await response.json();
      
      setCoupleId(data.id);
      setCoupleData(data);
      
      localStorage.setItem('coupleId', data.id);
      localStorage.setItem('coupleData', JSON.stringify(data));
      
      return data.pairing_code;
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
      if (!user) {
        await signIn();
      }
      
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/couples/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          auth_id: user.id,
          code
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to join couple: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCoupleId(data.couple_id);
        
        // Fetch the couple data
        const coupleResponse = await fetch(`${API_URL}/api/couples/${data.couple_id}`);
        
        if (coupleResponse.ok) {
          const coupleData = await coupleResponse.json();
          setCoupleData(coupleData);
          localStorage.setItem('coupleData', JSON.stringify(coupleData));
        }
        
        localStorage.setItem('coupleId', data.couple_id);
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
      
      // Update local storage
      const updatedCoupleData = {
        ...coupleData,
        [field]: encryptedValue
      };
      
      setCoupleData(updatedCoupleData);
      localStorage.setItem('coupleData', JSON.stringify(updatedCoupleData));
      
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
