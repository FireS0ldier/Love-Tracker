import React from 'react';
import { format } from 'date-fns';
import { FiCalendar, FiClock, FiMapPin, FiEdit2, FiTrash2 } from 'react-icons/fi';

/**
 * Component to display a list of events
 * @param {Object} props
 * @param {Array} props.events - Array of event objects
 * @param {Function} props.onEdit - Function called when edit button is clicked
 * @param {Function} props.onDelete - Function called when delete button is clicked
 */
const EventList = ({ events = [], onEdit, onDelete }) => {
  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        <FiCalendar size={48} className="mx-auto mb-4 opacity-40" />
        <p>No events yet. Create your first event together!</p>
      </div>
    );
  }
  
  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {events.map(event => (
        <li key={event.id} className="py-4">
          <div className="flex justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {event.title}
              </h3>
              
              <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <FiCalendar className="mr-1.5 h-4 w-4 flex-shrink-0" />
                <span>{format(new Date(event.date), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              
              <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <FiClock className="mr-1.5 h-4 w-4 flex-shrink-0" />
                <span>{format(new Date(event.date), 'h:mm a')}</span>
              </div>
              
              {event.location && (
                <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <FiMapPin className="mr-1.5 h-4 w-4 flex-shrink-0" />
                  <span>{event.location}</span>
                </div>
              )}
              
              {event.description && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {event.description}
                </p>
              )}
            </div>
            
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => onEdit(event)}
                aria-label="Edit event"
                className="p-2 rounded-full text-gray-500 dark:text-gray-400
                         hover:bg-gray-100 dark:hover:bg-gray-800
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <FiEdit2 size={16} />
              </button>
              
              <button
                onClick={() => onDelete(event.id)}
                aria-label="Delete event"
                className="p-2 rounded-full text-gray-500 dark:text-gray-400
                         hover:bg-gray-100 dark:hover:bg-gray-800
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default EventList;
