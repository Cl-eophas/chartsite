import { useState, useCallback } from 'react';
import debounce from 'lodash/debounce';

const useLoginOptimization = () => {
  const [loginCache, setLoginCache] = useState(new Map());
  
  const optimizedLogin = useCallback(
    debounce(async (credentials, loginFn) => {
      const cacheKey = credentials.email;
      
      // Check cache first
      if (loginCache.has(cacheKey)) {
        return loginCache.get(cacheKey);
      }

      try {
        const result = await loginFn(credentials);
        setLoginCache(prev => new Map(prev).set(cacheKey, result));
        return result;
      } catch (error) {
        throw error;
      }
    }, 300),
    [loginCache] // Add loginCache as a dependency to fix the warning
  );

  const handleLogin = useCallback((credentials) => {
    // Your login logic here
  }, []); // If this function doesn't depend on any props or state, empty array is fine

  const clearLoginCache = useCallback(() => {
    setLoginCache(new Map());
  }, []);

  return { optimizedLogin, clearLoginCache };
};

export default useLoginOptimization;
