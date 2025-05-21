import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { FiPlus, FiChevronLeft, FiChevronRight, FiCalendar, FiInfo } from 'react-icons/fi';
import Header from '../components/Header';
import EventList from '../components/EventList';
import { useEvents } from '../hooks/useEvents';

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'day'
  const { events, loading, error, deleteEvent } = useEvents();
  const navigate = useNavigate();
  
  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  };
  
  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  };
  
  // Get days for the current month
  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };
  
  // Handle day selection
  const handleDaySelect = (day) => {
    setSelectedDay(day);
    setViewMode('day');
  };
  
  // Filter events for the selected day
  const getEventsForSelectedDay = () => {
    return events.filter(event => 
      isSameDay(new Date(event.date), selectedDay)
    );
  };
  
  // Check if a day has events
  const dayHasEvents = (day) => {
    return events.some(event => 
      isSameDay(new Date(event.date), day)
    );
  };
  
  // Handle adding a new event
  const handleAddEvent = () => {
    navigate('/calendar/new');
  };
  
  // Handle editing an event
  const handleEditEvent = (event) => {
    navigate(`/calendar/edit/${event.id}`);
  };
  
  // Handle deleting an event
  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      await deleteEvent(eventId);
    }
  };
  
  // Switch to month view
  const handleSwitchToMonth = () => {
    setViewMode('month');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title="Calendar" showBack={true} />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-xl mx-auto">
          {/* Calendar Controls */}
          <div className="flex justify-between items-center mb-6">
            {viewMode === 'day' ? (
              <>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {format(selectedDay, 'MMMM d, yyyy')}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSwitchToMonth}
                    className="p-2 rounded-md text-gray-600 bg-white
                             border border-gray-300 hover:bg-gray-50
                             focus:outline-none focus:ring-2 focus:ring-blue-500
                             dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600
                             dark:hover:bg-gray-600"
                  >
                    <FiCalendar size={18} />
                  </button>
                  <button
                    onClick={handleAddEvent}
                    className="p-2 rounded-md text-white bg-blue-600
                             hover:bg-blue-700 focus:outline-none focus:ring-2
                             focus:ring-blue-500 focus:ring-offset-2
                             dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    <FiPlus size={18} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-md text-gray-600 bg-white
                           border border-gray-300 hover:bg-gray-50
                           focus:outline-none focus:ring-2 focus:ring-blue-500
                           dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600
                           dark:hover:bg-gray-600"
                >
                  <FiChevronLeft size={18} />
                </button>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={nextMonth}
                    className="p-2 rounded-md text-gray-600 bg-white
                             border border-gray-300 hover:bg-gray-50
                             focus:outline-none focus:ring-2 focus:ring-blue-500
                             dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600
                             dark:hover:bg-gray-600"
                  >
                    <FiChevronRight size={18} />
                  </button>
                  <button
                    onClick={handleAddEvent}
                    className="p-2 rounded-md text-white bg-blue-600
                             hover:bg-blue-700 focus:outline-none focus:ring-2
                             focus:ring-blue-500 focus:ring-offset-2
                             dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    <FiPlus size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
          
          {/* Calendar Display */}
          {viewMode === 'month' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
              {/* Day names header */}
              <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div 
                    key={day} 
                    className="py-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
                  >
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {/* Add empty cells for days before the first of the month */}
                {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, index) => (
                  <div 
                    key={`empty-start-${index}`}
                    className="h-24 border-b border-r border-gray-200 dark:border-gray-700 p-1"
                  />
                ))}
                
                {/* Calendar days */}
                {getDaysInMonth().map(day => {
                  const isToday = isSameDay(day, new Date());
                  const hasEvents = dayHasEvents(day);
                  
                  return (
                    <div 
                      key={day.toString()}
                      onClick={() => handleDaySelect(day)}
                      className={`h-24 border-b border-r border-gray-200 dark:border-gray-700 p-1
                                 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer`}
                    >
                      <div className="flex justify-between">
                        <div
                          className={`w-6 h-6 flex items-center justify-center rounded-full text-sm
                                     ${isToday 
                                       ? 'bg-blue-600 text-white dark:bg-blue-500' 
                                       : 'text-gray-700 dark:text-gray-300'}`}
                        >
                          {format(day, 'd')}
                        </div>
                        {hasEvents && (
                          <div className="w-2 h-2 rounded-full bg-pink-500 dark:bg-pink-400" />
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Add empty cells for days after the end of the month */}
                {Array.from({ length: 6 - endOfMonth(currentMonth).getDay() }).map((_, index) => (
                  <div 
                    key={`empty-end-${index}`}
                    className="h-24 border-b border-r border-gray-200 dark:border-gray-700 p-1"
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Day View / Events List */}
          {viewMode === 'day' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4">
                <EventList
                  events={getEventsForSelectedDay()}
                  onEdit={handleEditEvent}
                  onDelete={handleDeleteEvent}
                />
              </div>
            </div>
          )}
          
          {/* Error Display */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900 p-4 rounded-md mt-4">
              <div className="flex">
                <FiInfo className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
                <p className="text-red-700 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Calendar;
