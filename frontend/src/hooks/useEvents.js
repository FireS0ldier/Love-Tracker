import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useCouple } from './useCouple';
import { encryptData, decryptData } from '../utils/crypto';

/**
 * Custom hook for managing calendar events
 */
export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { coupleId, coupleData } = useCouple();
  
  // Listen for events changes
  useEffect(() => {
    if (!coupleId) return;
    
    setLoading(true);
    
    const eventsRef = collection(db, 'events');
    const eventsQuery = query(
      eventsRef,
      where('coupleId', '==', coupleId),
      orderBy('date', 'asc')
    );
    
    const unsubscribe = onSnapshot(
      eventsQuery,
      async (snapshot) => {
        try {
          const encryptionKey = coupleId; // Simplified for MVP
          const eventsData = [];
          
          // Process each event document
          for (const docSnapshot of snapshot.docs) {
            const data = docSnapshot.data();
            
            // Decrypt sensitive fields
            const description = data.encryptedDescription 
              ? await decryptData(data.encryptedDescription, encryptionKey)
              : '';
              
            const title = data.encryptedTitle
              ? await decryptData(data.encryptedTitle, encryptionKey)
              : 'Untitled Event';
            
            // Add the processed event to the array
            eventsData.push({
              id: docSnapshot.id,
              title,
              description,
              date: data.date.toDate(),
              reminderTime: data.reminderTime?.toDate() || null,
              location: data.location || null,
              // Keep any other non-sensitive fields
              ...data
            });
          }
          
          setEvents(eventsData);
        } catch (error) {
          console.error("Error processing events:", error);
          setError("Could not process events data.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error fetching events:", err);
        setError("Could not load events.");
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [coupleId]);
  
  /**
   * Add a new event
   * @param {Object} eventData - Event data to add
   * @returns {Promise<string|null>} - The event ID if successful, null otherwise
   */
  const addEvent = async (eventData) => {
    try {
      if (!coupleId) throw new Error("No couple ID available.");
      
      const encryptionKey = coupleId; // Simplified for MVP
      
      // Encrypt sensitive fields
      const encryptedTitle = await encryptData(eventData.title, encryptionKey);
      const encryptedDescription = eventData.description 
        ? await encryptData(eventData.description, encryptionKey)
        : null;
      
      // Prepare the event document data
      const eventDoc = {
        coupleId,
        date: new Date(eventData.date),
        reminderTime: eventData.reminderTime ? new Date(eventData.reminderTime) : null,
        location: eventData.location || null,
        encryptedTitle,
        encryptedDescription,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add the document to Firestore
      const docRef = await addDoc(collection(db, 'events'), eventDoc);
      return docRef.id;
    } catch (error) {
      console.error("Error adding event:", error);
      setError("Failed to add event.");
      return null;
    }
  };
  
  /**
   * Update an existing event
   * @param {string} eventId - ID of the event to update
   * @param {Object} eventData - New event data
   * @returns {Promise<boolean>} - Whether the update was successful
   */
  const updateEvent = async (eventId, eventData) => {
    try {
      if (!coupleId) throw new Error("No couple ID available.");
      
      const encryptionKey = coupleId; // Simplified for MVP
      const eventRef = doc(db, 'events', eventId);
      
      // Only encrypt fields that are provided in the update
      const updates = {
        updatedAt: new Date()
      };
      
      if (eventData.date) {
        updates.date = new Date(eventData.date);
      }
      
      if (eventData.reminderTime) {
        updates.reminderTime = new Date(eventData.reminderTime);
      }
      
      if (eventData.location !== undefined) {
        updates.location = eventData.location;
      }
      
      if (eventData.title !== undefined) {
        updates.encryptedTitle = await encryptData(eventData.title, encryptionKey);
      }
      
      if (eventData.description !== undefined) {
        updates.encryptedDescription = eventData.description 
          ? await encryptData(eventData.description, encryptionKey)
          : null;
      }
      
      // Update the Firestore document
      await updateDoc(eventRef, updates);
      return true;
    } catch (error) {
      console.error("Error updating event:", error);
      setError("Failed to update event.");
      return false;
    }
  };
  
  /**
   * Delete an event
   * @param {string} eventId - ID of the event to delete
   * @returns {Promise<boolean>} - Whether the deletion was successful
   */
  const deleteEvent = async (eventId) => {
    try {
      if (!coupleId) throw new Error("No couple ID available.");
      
      // Delete the Firestore document
      await deleteDoc(doc(db, 'events', eventId));
      return true;
    } catch (error) {
      console.error("Error deleting event:", error);
      setError("Failed to delete event.");
      return false;
    }
  };
  
  return {
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent
  };
};

export default useEvents;
