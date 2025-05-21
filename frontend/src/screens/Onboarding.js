import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FiHeart, FiCalendar, FiArrowRight } from 'react-icons/fi';
import CodeInput from '../components/CodeInput';
import { useCouple } from '../hooks/useCouple';
import Header from '../components/Header';

const Onboarding = () => {
  const [step, setStep] = useState('initial');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { createCouple, joinCouple } = useCouple();
  
  // Handle creation of a new couple
  const handleCreateCouple = async () => {
    setLoading(true);
    setError('');
    
    try {
      const coupleCode = await createCouple(startDate);
      
      if (coupleCode) {
        // Show the generated code
        setCode(coupleCode);
        setStep('code-display');
      } else {
        setError('Failed to create pairing. Please try again.');
      }
    } catch (err) {
      console.error('Error creating couple:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle joining an existing couple
  const handleJoinCouple = async (codeInput) => {
    setLoading(true);
    setError('');
    
    try {
      const success = await joinCouple(codeInput);
      
      if (success) {
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        setError('Invalid code or pairing not found. Please check and try again.');
      }
    } catch (err) {
      console.error('Error joining couple:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Continue to dashboard after creating a couple
  const handleContinueToDashboard = () => {
    navigate('/dashboard');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title="LoveTrack+" />
      
      <main className="container mx-auto px-4 py-8">
        {step === 'initial' && (
          <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-8">
              <div className="text-center mb-8">
                <div className="mx-auto w-20 h-20 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center">
                  <FiHeart className="w-10 h-10 text-pink-500 dark:text-pink-300" />
                </div>
                <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                  Welcome to LoveTrack+
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Keep track of your relationship in one private space
                </p>
              </div>
              
              <div className="space-y-6">
                <button
                  onClick={() => setStep('create')}
                  className="w-full flex items-center justify-center py-3 px-4 
                            rounded-md bg-blue-600 text-white font-medium
                            hover:bg-blue-700 focus:outline-none focus:ring-2
                            focus:ring-blue-500 focus:ring-offset-2
                            dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  <span>Create a new couple</span>
                  <FiArrowRight className="ml-2" />
                </button>
                
                <button
                  onClick={() => setStep('join')}
                  className="w-full flex items-center justify-center py-3 px-4 
                            rounded-md bg-white text-blue-600 font-medium
                            border border-gray-300
                            hover:bg-gray-50 focus:outline-none focus:ring-2
                            focus:ring-blue-500 focus:ring-offset-2
                            dark:bg-gray-700 dark:text-blue-400 dark:border-gray-600
                            dark:hover:bg-gray-600"
                >
                  <span>Join with a code</span>
                  <FiArrowRight className="ml-2" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {step === 'create' && (
          <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                When did your relationship start?
              </h2>
              
              <div className="mb-6">
                <label htmlFor="startDate" className="sr-only">Start Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCalendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 
                              rounded-md shadow-sm focus:outline-none focus:ring-blue-500 
                              focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600
                              dark:text-white"
                  />
                </div>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md dark:bg-red-900 dark:text-red-200">
                  {error}
                </div>
              )}
              
              <div className="flex justify-between">
                <button
                  onClick={() => setStep('initial')}
                  className="py-2 px-4 rounded-md text-gray-700 bg-white
                            border border-gray-300 hover:bg-gray-50
                            focus:outline-none focus:ring-2 focus:ring-blue-500
                            dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600
                            dark:hover:bg-gray-600"
                >
                  Back
                </button>
                
                <button
                  onClick={handleCreateCouple}
                  disabled={loading}
                  className="py-2 px-4 rounded-md bg-blue-600 text-white
                            hover:bg-blue-700 focus:outline-none focus:ring-2
                            focus:ring-blue-500 focus:ring-offset-2
                            dark:bg-blue-500 dark:hover:bg-blue-600
                            disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Couple'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {step === 'join' && (
          <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Enter your couple code
              </h2>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Ask your partner for the 6-digit code they received when creating your couple.
              </p>
              
              <div className="mb-6">
                <CodeInput 
                  length={6} 
                  onComplete={handleJoinCouple}
                  disabled={loading}
                />
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md dark:bg-red-900 dark:text-red-200">
                  {error}
                </div>
              )}
              
              <div className="flex justify-between">
                <button
                  onClick={() => setStep('initial')}
                  className="py-2 px-4 rounded-md text-gray-700 bg-white
                            border border-gray-300 hover:bg-gray-50
                            focus:outline-none focus:ring-2 focus:ring-blue-500
                            dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600
                            dark:hover:bg-gray-600"
                >
                  Back
                </button>
                
                <button
                  disabled={loading}
                  className="py-2 px-4 rounded-md bg-gray-300 text-gray-700
                            focus:outline-none cursor-not-allowed opacity-50
                            dark:bg-gray-600 dark:text-gray-300"
                >
                  {loading ? 'Joining...' : 'Enter Code Above'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {step === 'code-display' && (
          <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Your couple code
              </h2>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Share this code with your partner so they can join your couple.
              </p>
              
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <div className="text-center font-mono text-2xl font-bold tracking-wider text-gray-800 dark:text-gray-200">
                  {code}
                </div>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                This code will only work once. If your partner doesn't join, you'll need to create a new code.
              </p>
              
              <button
                onClick={handleContinueToDashboard}
                className="w-full py-3 px-4 rounded-md bg-blue-600 text-white
                          hover:bg-blue-700 focus:outline-none focus:ring-2
                          focus:ring-blue-500 focus:ring-offset-2
                          dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Onboarding;
