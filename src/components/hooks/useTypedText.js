import { useState, useEffect, useRef, useCallback } from 'react';

export const useTypedText = (fullText, typingSpeed = 20) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const indexRef = useRef(0);
  const intervalRef = useRef(null);

  const skipTyping = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDisplayedText(fullText);
    setIsTyping(false);
  }, [fullText]);

  useEffect(() => {
    // Reset state when text changes
    setDisplayedText('');
    indexRef.current = 0;
    setIsTyping(true);

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Start typing animation
    intervalRef.current = setInterval(() => {
      setDisplayedText(prev => {
        if (indexRef.current >= fullText.length) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsTyping(false);
          return prev;
        }
        
        const nextChar = fullText.charAt(indexRef.current);
        indexRef.current += 1;
        return prev + nextChar;
      });
    }, typingSpeed);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fullText, typingSpeed]);

  return { displayedText, isTyping, skipTyping };
};