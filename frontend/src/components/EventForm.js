import React, { useState } from 'react';
import { format } from 'date-fns';

/**
 * Form component for creating or editing events
 * @param {Object} props
 * @param {Object} props.initialData - Initial event data (for editing)
 * @param {Function} props.onSubmit - Function called when form is submitted
 * @param {Function} props.onCancel - Function called when form is cancelled
 */
const EventForm = ({ initialData = {}, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    date: initialData.date 
      ? format(new Date(initialData.date), 'yyyy-MM-dd\'T\'HH:mm')
      : format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    location: initialData.location || '',
    reminderTime: initialData.reminderTime
      ? format(new Date(initialData.reminderTime), 'yyyy-MM-dd\'T\'HH:mm')
      : ''
  });
  
  const [errors, setErrors] = useState({});
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Validate the form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label 
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border-gray-300 
                     shadow-sm focus:border-blue-500 focus:ring-blue-500 
                     dark:bg-gray-800 dark:border-gray-700 dark:text-white
                     ${errors.title ? 'border-red-500' : ''}`}
          placeholder="Event title"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title}</p>
        )}
      </div>
      
      <div>
        <label 
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 
                     shadow-sm focus:border-blue-500 focus:ring-blue-500 
                     dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          placeholder="Event description"
        />
      </div>
      
      <div>
        <label 
          htmlFor="date"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Date & Time
        </label>
        <input
          type="datetime-local"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border-gray-300 
                     shadow-sm focus:border-blue-500 focus:ring-blue-500 
                     dark:bg-gray-800 dark:border-gray-700 dark:text-white
                     ${errors.date ? 'border-red-500' : ''}`}
        />
        {errors.date && (
          <p className="mt-1 text-sm text-red-500">{errors.date}</p>
        )}
      </div>
      
      <div>
        <label 
          htmlFor="location"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Location
        </label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 
                   shadow-sm focus:border-blue-500 focus:ring-blue-500 
                   dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          placeholder="Event location"
        />
      </div>
      
      <div>
        <label 
          htmlFor="reminderTime"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Reminder (optional)
        </label>
        <input
          type="datetime-local"
          id="reminderTime"
          name="reminderTime"
          value={formData.reminderTime}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 
                   shadow-sm focus:border-blue-500 focus:ring-blue-500 
                   dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md text-sm font-medium
                   text-gray-700 bg-white border border-gray-300
                   hover:bg-gray-50 focus:outline-none focus:ring-2
                   focus:ring-blue-500 focus:ring-offset-2
                   dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600
                   dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-md text-sm font-medium
                   text-white bg-blue-600 border border-transparent
                   hover:bg-blue-700 focus:outline-none focus:ring-2
                   focus:ring-blue-500 focus:ring-offset-2
                   dark:bg-blue-500 dark:hover:bg-blue-600
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {initialData.id ? 'Update Event' : 'Create Event'}
        </button>
      </div>
    </form>
  );
};

export default EventForm;
