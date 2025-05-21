import React, { useState, useEffect } from 'react';
import { formatDistance, intervalToDuration, format } from 'date-fns';

/**
 * Component to display the duration of a relationship
 * @param {Object} props
 * @param {string|Date} props.startDate - The start date of the relationship
 */
const RelationshipDuration = ({ startDate }) => {
  const [duration, setDuration] = useState('');
  const [daysCount, setDaysCount] = useState(0);
  const [formattedDate, setFormattedDate] = useState('');
  
  useEffect(() => {
    if (!startDate) return;
    
    const start = new Date(startDate);
    
    // Format the start date
    setFormattedDate(format(start, 'MMMM d, yyyy'));
    
    // Calculate days
    const calculateDays = () => {
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - start.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      setDaysCount(diffDays);
    };
    
    // Calculate duration
    const calculateDuration = () => {
      const now = new Date();
      const interval = intervalToDuration({ start, end: now });
      
      let durationText = '';
      
      if (interval.years > 0) {
        durationText += `${interval.years} year${interval.years > 1 ? 's' : ''}, `;
      }
      
      if (interval.months > 0) {
        durationText += `${interval.months} month${interval.months > 1 ? 's' : ''}, `;
      }
      
      durationText += `${interval.days} day${interval.days !== 1 ? 's' : ''}`;
      
      setDuration(durationText);
    };
    
    // Initial calculations
    calculateDays();
    calculateDuration();
    
    // Set up interval to update every day
    const timer = setInterval(() => {
      calculateDays();
      calculateDuration();
    }, 1000 * 60 * 60 * 24);
    
    return () => clearInterval(timer);
  }, [startDate]);
  
  if (!startDate) {
    return null;
  }
  
  return (
    <div className="text-center py-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
        Your Relationship
      </h2>
      
      <div className="mb-5">
        <div className="text-7xl font-bold text-blue-600 dark:text-blue-400">
          {daysCount}
        </div>
        <div className="text-xl text-gray-600 dark:text-gray-300 mt-1">
          days together
        </div>
      </div>
      
      <div className="text-lg text-gray-700 dark:text-gray-300">
        {duration}
      </div>
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Since {formattedDate}
      </div>
    </div>
  );
};

export default RelationshipDuration;
