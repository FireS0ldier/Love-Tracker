import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FiCalendar, FiPlus } from 'react-icons/fi';
import { useCouple } from '../hooks/useCouple';
import { useEvents } from '../hooks/useEvents';
import Header from '../components/Header';
import RelationshipDuration from '../components/RelationshipDuration';

const Dashboard = () => {
  const [startDate, setStartDate] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const navigate = useNavigate();
  const { coupleData, loading: coupleLoading, error: coupleError } = useCouple();
  const { events, loading: eventsLoading } = useEvents();
  
  // Extract start date from couple data
  useEffect(() => {
    if (coupleData && coupleData.startDate) {
      setStartDate(coupleData.startDate.toDate());
    }
  }, [coupleData]);
  
  // Filter upcoming events
  useEffect(() => {
    if (events) {
      const now = new Date();
      const upcoming = events
        .filter(event => new Date(event.date) > now)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);
      
      setUpcomingEvents(upcoming);
    }
  }, [events]);
  
  // Navigate to calendar
  const handleGoToCalendar = () => {
    navigate('/calendar');
  };
  
  // Navigate to add new event
  const handleAddEvent = () => {
    navigate('/calendar/new');
  };
  
  // Display loading state
  if (coupleLoading || eventsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header title="Dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600 dark:text-gray-300">Loading...</div>
        </div>
      </div>
    );
  }
  
  // Display error state
  if (coupleError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header title="Dashboard" />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 dark:bg-red-900 p-4 rounded-md">
            <p className="text-red-700 dark:text-red-200">{coupleError}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title="Dashboard" />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Relationship Duration */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
            <RelationshipDuration startDate={startDate} />
          </div>
          
          {/* Upcoming Events */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center">
                <FiCalendar className="mr-2 text-blue-500 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Upcoming Events
                </h2>
              </div>
              <button
                onClick={handleAddEvent}
                aria-label="Add new event"
                className="p-2 rounded-full text-blue-600 dark:text-blue-400
                         hover:bg-blue-50 dark:hover:bg-gray-700
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <FiPlus size={20} />
              </button>
            </div>
            
            <div className="px-6 py-4">
              {upcomingEvents.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {upcomingEvents.map(event => (
                    <li key={event.id} className="py-3">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-base font-medium text-gray-900 dark:text-white">
                            {event.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {format(new Date(event.date), 'EEEE, MMMM d')} at {format(new Date(event.date), 'h:mm a')}
                          </p>
                          {event.location && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {event.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                  <p>No upcoming events</p>
                </div>
              )}
              
              <div className="mt-4">
                <button
                  onClick={handleGoToCalendar}
                  className="w-full py-2 px-4 rounded-md border border-gray-300
                           text-gray-700 bg-white hover:bg-gray-50
                           focus:outline-none focus:ring-2 focus:ring-blue-500
                           dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600
                           dark:hover:bg-gray-600"
                >
                  View Full Calendar
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
