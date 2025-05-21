import { useState, useEffect } from 'react';
import { useCouple } from './useCouple';
import { encryptData, decryptData } from '../utils/crypto';

/**
 * Custom hook for managing calendar events
 */
export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { coupleId } = useCouple();
  
  // Backend API URL from environment variables
  const API_URL = process.env.REACT_APP_BACKEND_URL || '';
  
  // Load events when coupleId changes
  useEffect(() => {
    if (!coupleId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    
    const fetchEvents = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`${API_URL}/api/events?couple_id=${coupleId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Convert dates from string to Date objects
        const processedEvents = data.map(event => ({
          ...event,
          date: new Date(event.date),
          reminderTime: event.reminder_time ? new Date(event.reminder_time) : null
        }));
        
        setEvents(processedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
        setError("Could not load events.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [coupleId, API_URL]);
  
  /**
   * Add a new event
   * @param {Object} eventData - Event data to add
   * @returns {Promise<string|null>} - The event ID if successful, null otherwise
   */
  const addEvent = async (eventData) => {
    try {
      if (!coupleId) throw new Error("No couple ID available.");
      
      const response = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          couple_id: coupleId,
          title: eventData.title,
          description: eventData.description || null,
          date: new Date(eventData.date),
          location: eventData.location || null,
          reminder_time: eventData.reminderTime ? new Date(eventData.reminderTime) : null
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add event: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add the new event to the local state
      setEvents(prev => [
        ...prev,
        {
          ...data,
          date: new Date(data.date),
          reminderTime: data.reminder_time ? new Date(data.reminder_time) : null
        }
      ]);
      
      return data.id;
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
      
      // Prepare update data with snake_case keys
      const updateData = {};
      
      if (eventData.title !== undefined) {
        updateData.title = eventData.title;
      }
      
      if (eventData.description !== undefined) {
        updateData.description = eventData.description;
      }
      
      if (eventData.date) {
        updateData.date = new Date(eventData.date);
      }
      
      if (eventData.location !== undefined) {
        updateData.location = eventData.location;
      }
      
      if (eventData.reminderTime !== undefined) {
        updateData.reminder_time = eventData.reminderTime ? new Date(eventData.reminderTime) : null;
      }
      
      const response = await fetch(`${API_URL}/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update event: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update the event in the local state
      setEvents(prev => prev.map(event => 
        event.id === eventId
          ? {
              ...data,
              date: new Date(data.date),
              reminderTime: data.reminder_time ? new Date(data.reminder_time) : null
            }
          : event
      ));
      
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
      
      const response = await fetch(`${API_URL}/api/events/${eventId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete event: ${response.status}`);
      }
      
      // Remove the event from the local state
      setEvents(prev => prev.filter(event => event.id !== eventId));
      
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
