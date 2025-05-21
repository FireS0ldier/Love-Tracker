import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiInfo } from 'react-icons/fi';
import Header from '../components/Header';
import EventForm from '../components/EventForm';
import { useEvents } from '../hooks/useEvents';

const EventDetails = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { events, addEvent, updateEvent } = useEvents();
  const navigate = useNavigate();
  const isNewEvent = eventId === 'new';
  
  // Load event data if editing an existing event
  useEffect(() => {
    if (!isNewEvent) {
      const eventData = events.find(e => e.id === eventId);
      
      if (eventData) {
        setEvent(eventData);
      } else {
        setError('Event not found.');
      }
    }
    
    setLoading(false);
  }, [eventId, events, isNewEvent]);
  
  // Handle form submission
  const handleSubmit = async (formData) => {
    try {
      if (isNewEvent) {
        // Add new event
        const newEventId = await addEvent(formData);
        
        if (newEventId) {
          navigate('/calendar');
        } else {
          setError('Failed to create event.');
        }
      } else {
        // Update existing event
        const success = await updateEvent(eventId, formData);
        
        if (success) {
          navigate('/calendar');
        } else {
          setError('Failed to update event.');
        }
      }
    } catch (err) {
      console.error('Error saving event:', err);
      setError('An unexpected error occurred.');
    }
  };
  
  // Handle form cancellation
  const handleCancel = () => {
    navigate(-1);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        title={isNewEvent ? 'New Event' : 'Edit Event'} 
        showBack={true} 
      />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-6">
            {loading ? (
              <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                Loading...
              </div>
            ) : error ? (
              <div className="bg-red-100 dark:bg-red-900 p-4 rounded-md">
                <div className="flex">
                  <FiInfo className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
                  <p className="text-red-700 dark:text-red-200">{error}</p>
                </div>
              </div>
            ) : (
              <EventForm
                initialData={event || {}}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventDetails;
