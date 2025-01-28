import React, { useState, useEffect, useCallback } from "react";
import { Box, Alert, Snackbar, CircularProgress } from "@mui/material";
import { useSelector } from "react-redux";
import useMongoConnection from '../../hooks/useMongoConnection';
import useLoginOptimization from '../../hooks/useLoginOptimization';

const MessagingPage = () => {
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [retryCount] = useState(0);
  
  const MAX_RETRIES = 3;

  const { connectionStatus, handleConnectionError, retryAttempt } = useMongoConnection();
  const { optimizedLogin, clearLoginCache } = useLoginOptimization();

  const handleApiError = useCallback(async (error) => {
    if (error.code === 'ECONNRESET') {
      const shouldRetry = await handleConnectionError(error);
      if (shouldRetry) {
        return;
      }
    }
    setApiError(error.message || "An unexpected error occurred");
  }, [handleConnectionError]);

  const handleLogin = async (credentials) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        throw new Error('Login failed');
      }
      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const attemptLogin = async () => {
    try {
      const result = await handleLogin();
      // Handle successful login
    } catch (error) {
      // Handle login error
    }
  };

  useEffect(() => {
    const handleReconnect = () => {
      console.log("Attempting to reconnect to MongoDB...");
    };

    window.addEventListener('offline', handleReconnect);
    return () => {
      window.removeEventListener('offline', handleReconnect);
    };
  }, []);

  useEffect(() => {
    return () => {
      clearLoginCache();
    };
  }, [clearLoginCache]);

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        sx={{
          display: "flex",
          height: "calc(100vh - 64px)",
          bgcolor: "#111B21"
        }}
      >
        <Box
          sx={{
            width: 300,
            borderRight: "1px solid #2F3B43",
            display: "flex",
            flexDirection: "column"
          }}
        >
        </Box>

        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        </Box>
      </Box>

      <Snackbar 
        open={!!apiError} 
        autoHideDuration={6000} 
        onClose={() => setApiError(null)}
      >
        <Alert severity="error" onClose={() => setApiError(null)}>
          {apiError}
          {retryCount > 0 && ` (Retry attempt ${retryCount}/${MAX_RETRIES})`}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={connectionStatus !== 'connected'} 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity={connectionStatus === 'reconnecting' ? 'warning' : 'error'}
          sx={{ width: '100%' }}
        >
          {connectionStatus === 'reconnecting' 
            ? `Connection lost. Retrying... (Attempt ${retryAttempt}/${MAX_RETRIES})`
            : 'Connection failed. Please check your internet connection.'}
        </Alert>
      </Snackbar>

      {loading && (
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default MessagingPage;
