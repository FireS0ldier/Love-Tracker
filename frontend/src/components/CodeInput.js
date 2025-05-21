import React, { useState, useRef, useEffect } from 'react';

/**
 * A component for entering pairing codes with individual input fields
 * @param {Object} props
 * @param {number} props.length - Number of digits in the code
 * @param {Function} props.onComplete - Function called when all digits are entered
 * @param {boolean} props.disabled - Whether the input is disabled
 */
const CodeInput = ({ length = 6, onComplete, disabled = false }) => {
  const [code, setCode] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);
  
  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);
  
  // When code is complete, call onComplete
  useEffect(() => {
    if (code.every(digit => digit !== '') && onComplete) {
      onComplete(code.join(''));
    }
  }, [code, onComplete]);
  
  // Handle input changes
  const handleChange = (index, e) => {
    const value = e.target.value;
    
    // Only allow single digits
    if (!/^\d?$/.test(value)) return;
    
    // Update the code array
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Auto-focus next input if value was entered
    if (value !== '' && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };
  
  // Handle key press events
  const handleKeyDown = (index, e) => {
    // On backspace, clear current field and focus previous
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputRefs.current[index - 1].focus();
    }
    
    // On arrow left, focus previous
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    
    // On arrow right, focus next
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };
  
  // Handle paste events
  const handlePaste = (e) => {
    e.preventDefault();
    
    // Extract digits from pasted content
    const pasteData = e.clipboardData.getData('text/plain');
    const digits = pasteData.match(/\d/g) || [];
    
    // Fill the code array with pasted digits
    const newCode = [...code];
    for (let i = 0; i < Math.min(digits.length, length); i++) {
      newCode[i] = digits[i];
    }
    setCode(newCode);
    
    // Focus the next empty input or the last one
    let focusIndex = digits.length;
    if (focusIndex >= length) focusIndex = length - 1;
    inputRefs.current[focusIndex].focus();
  };
  
  return (
    <div className="flex items-center justify-center space-x-2 sm:space-x-3">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={el => inputRefs.current[index] = el}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={code[index]}
          onChange={e => handleChange(index, e)}
          onKeyDown={e => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-16 text-center text-2xl font-bold rounded-md border-2 
                    bg-white dark:bg-gray-800 
                    border-gray-300 dark:border-gray-600
                    text-gray-900 dark:text-white
                    focus:border-blue-500 dark:focus:border-blue-400
                    focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800
                    focus:outline-none
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors duration-200"
        />
      ))}
    </div>
  );
};

export default CodeInput;
