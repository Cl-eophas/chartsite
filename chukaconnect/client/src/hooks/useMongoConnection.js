import { useState, useCallback } from 'react';

const useMongoConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [retryAttempt, setRetryAttempt] = useState(0);
  const MAX_RETRIES = 5;

  const handleConnectionError = useCallback(async (error) => {
    if (error.code === 'ECONNRESET') {
      setConnectionStatus('reconnecting');
      if (retryAttempt < MAX_RETRIES) {
        const backoffDelay = Math.min(1000 * Math.pow(2, retryAttempt), 10000);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        setRetryAttempt(prev => prev + 1);
        return true; // Retry the operation
      } else {
        setConnectionStatus('failed');
        return false; // Stop retrying
      }
    }
    return false;
  }, [retryAttempt]);

  return { connectionStatus, handleConnectionError, retryAttempt };
};

export default useMongoConnection;
