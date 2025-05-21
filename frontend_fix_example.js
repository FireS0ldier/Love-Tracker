// Example fix for useCouple.js to use direct API calls instead of Firebase

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';

const useCouple = () => {
  const [couple, setCouple] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Get the backend URL from environment variables
  const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://533580d1-6472-4f3c-808e-18799e6019c1.preview.emergentagent.com';
  
  // Helper function to convert snake_case to camelCase
  const toCamelCase = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => toCamelCase(item));
    }
    
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {});
  };
  
  // Helper function to convert camelCase to snake_case
  const toSnakeCase = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => toSnakeCase(item));
    }
    
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {});
  };
  
  // Load couple data from local storage
  useEffect(() => {
    const storedCouple = localStorage.getItem('couple');
    if (storedCouple) {
      try {
        setCouple(JSON.parse(storedCouple));
      } catch (err) {
        console.error('Error parsing stored couple data:', err);
        localStorage.removeItem('couple');
      }
    }
  }, []);
  
  // Create a new couple
  const createCouple = async (startDate) => {
    setLoading(true);
    setError(null);
    
    try {
      // Convert to snake_case for the API
      const data = toSnakeCase({
        startDate,
        createdBy: 'user_' + Date.now() // Generate a unique user ID
      });
      
      const response = await fetch(`${API_URL}/api/couples`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create couple: ${response.status}`);
      }
      
      const responseData = await response.json();
      
      // Convert from snake_case to camelCase
      const coupleData = toCamelCase(responseData);
      
      // Rename pairing_code to code for frontend compatibility
      coupleData.code = coupleData.pairingCode;
      
      // Store in local storage
      localStorage.setItem('couple', JSON.stringify(coupleData));
      setCouple(coupleData);
      
      return coupleData;
    } catch (err) {
      console.error('Error creating couple:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Join an existing couple
  const joinCouple = async (code) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/couples/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to join couple: ${response.status}`);
      }
      
      const responseData = await response.json();
      
      // Convert from snake_case to camelCase
      const coupleData = toCamelCase(responseData);
      
      // Rename pairing_code to code for frontend compatibility
      coupleData.code = coupleData.pairingCode;
      
      // Store in local storage
      localStorage.setItem('couple', JSON.stringify(coupleData));
      setCouple(coupleData);
      
      return coupleData;
    } catch (err) {
      console.error('Error joining couple:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Get couple data
  const getCouple = async (coupleId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/couples/${coupleId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get couple: ${response.status}`);
      }
      
      const responseData = await response.json();
      
      // Convert from snake_case to camelCase
      const coupleData = toCamelCase(responseData);
      
      // Rename pairing_code to code for frontend compatibility
      coupleData.code = coupleData.pairingCode;
      
      return coupleData;
    } catch (err) {
      console.error('Error getting couple:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Logout / clear couple data
  const logout = () => {
    localStorage.removeItem('couple');
    setCouple(null);
    navigate('/');
  };
  
  // Encrypt data for secure storage
  const encryptData = (data, key) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
  };
  
  // Decrypt data from secure storage
  const decryptData = (encryptedData, key) => {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  };
  
  return {
    couple,
    loading,
    error,
    createCouple,
    joinCouple,
    getCouple,
    logout,
    encryptData,
    decryptData
  };
};

export default useCouple;