import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from "react-redux";
import './UserSearch.css';
import { API_URL, buildApiUrl } from "../config/api";

const UserSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const timeoutRef = useRef();
  const searchIdRef = useRef(0);
  const [error, setError] = useState(null);
  const token = useSelector((state) => state.token);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm || !token) {
        setResults([]);
        setError(null);
        return;
      }

      // Increment search ID to ensure unique keys across searches
      searchIdRef.current += 1;
      const currentSearchId = searchIdRef.current;

      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(buildApiUrl(`/api/users/search?query=${encodeURIComponent(searchTerm)}`), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Please log in to search users');
          }
          if (response.status === 404) {
            setResults([]);
            return;
          }
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (!Array.isArray(data)) {
          console.error('Invalid response format:', data);
          setResults([]);
          return;
        }
        
        // Create a Set to track seen user IDs
        const seenIds = new Set();
        
        // Filter out duplicates and add unique keys
        const uniqueResults = data.reduce((acc, item) => {
          if (!seenIds.has(item._id)) {
            seenIds.add(item._id);
            acc.push({
              ...item,
              // Combine multiple unique identifiers
              uniqueKey: `search-${currentSearchId}-user-${item._id}-${Date.now()}`
            });
          }
          return acc;
        }, []);

        setResults(uniqueResults);
      } catch (err) {
        console.error('Search error:', err);
        setError(err.message);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debouncing
    timeoutRef.current = setTimeout(() => {
      searchUsers();
    }, 300);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchTerm, token]);

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        autoComplete="off"
      />
      
      {isLoading && <div className="loading-indicator">Searching...</div>}
      {error && <div className="error-message">{error}</div>}
      
      {results.length > 0 && !error && (
        <div className="search-results">
          {results.map((user) => (
            <div 
              key={user.uniqueKey}
              className="user-result"
              onClick={() => handleUserClick(user._id)}
            >
              <img 
                src={`${API_URL}/assets/${user.picturePath}`} 
                alt={`${user.firstName} ${user.lastName}`}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/assets/default-profile.png';
                }}
              />
              <div>
                <h4>{`${user.firstName} ${user.lastName}`}</h4>
                <p>{user.location}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSearch; 