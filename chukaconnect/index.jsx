import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const POLLING_INTERVAL = 30000; // 30 seconds
const MAX_RETRIES = 3;

const MessageNotification = ({ userId }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [error, setError] = useState(null);
    const timerRef = useRef(null);
    const abortControllerRef = useRef(null);
    const retryCountRef = useRef(0);
    const navigate = useNavigate();

    // Memoized fetch function to prevent recreating on each render
    const fetchUnreadCount = useCallback(async () => {
        // Cancel previous request if exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/messages/unread/count/${userId}`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    },
                    signal: abortControllerRef.current.signal
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setUnreadCount(data.count || 0);
            setError(null);
            retryCountRef.current = 0; // Reset retry count on success
            
        } catch (error) {
            if (error.name === 'AbortError') {
                return; // Ignore abort errors
            }

            console.error('Error fetching unread count:', error);
            setError(error.message);

            // Implement retry logic
            if (retryCountRef.current < MAX_RETRIES) {
                retryCountRef.current++;
                setTimeout(fetchUnreadCount, 1000 * retryCountRef.current);
            }
        }
    }, [userId]);

    // Setup polling with cleanup
    useEffect(() => {
        // Initial fetch
        fetchUnreadCount();

        // Setup interval with performance optimization
        timerRef.current = setInterval(() => {
            // Use requestIdleCallback for better performance
            if (window.requestIdleCallback) {
                window.requestIdleCallback(() => fetchUnreadCount(), { timeout: 2000 });
            } else {
                fetchUnreadCount();
            }
        }, POLLING_INTERVAL);

        // Cleanup function
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [fetchUnreadCount]);

    // Handle click to navigate to messages
    const handleClick = useCallback(() => {
        navigate('/messages');
    }, [navigate]);

    // Only render if there are unread messages or errors
    if (!unreadCount && !error) {
        return null;
    }

    return (
        <div className="message-notification" onClick={handleClick}>
            {error ? (
                <div className="error-message">
                    Unable to fetch messages
                </div>
            ) : (
                <div className="unread-count">
                    {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
                </div>
            )}
        </div>
    );
};

export default MessageNotification; 