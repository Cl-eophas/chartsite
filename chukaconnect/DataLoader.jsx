import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api';

const DataLoader = ({ children }) => {
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const pageRef = useRef({ users: 1, posts: 1 });
    const observerRef = useRef(null);
    const loadingRef = useRef(false);

    // Optimized data fetching
    const fetchInitialData = useCallback(async () => {
        if (loadingRef.current) return;
        loadingRef.current = true;

        try {
            setLoading(true);
            const [usersData, postsData] = await api.batchFetch([
                { endpoint: '/users?page=1&limit=20' },
                { endpoint: '/posts?page=1&limit=20' }
            ]);

            setUsers(usersData);
            setPosts(postsData);
            pageRef.current = { users: 2, posts: 2 };
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, []);

    // Infinite scroll implementation
    const setupInfiniteScroll = useCallback(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(
            async (entries) => {
                if (entries[0].isIntersecting && !loadingRef.current) {
                    await loadMoreData();
                }
            },
            { threshold: 0.5 }
        );

        const sentinel = document.querySelector('#scroll-sentinel');
        if (sentinel) {
            observerRef.current.observe(sentinel);
        }
    }, []);

    // Load more data when scrolling
    const loadMoreData = async () => {
        if (loadingRef.current) return;
        loadingRef.current = true;

        try {
            const [newUsers, newPosts] = await Promise.all([
                api.getUsers(pageRef.current.users),
                api.getPosts(pageRef.current.posts)
            ]);

            if (newUsers.length || newPosts.length) {
                setUsers(prev => [...prev, ...newUsers]);
                setPosts(prev => [...prev, ...newPosts]);
                pageRef.current = {
                    users: pageRef.current.users + 1,
                    posts: pageRef.current.posts + 1
                };
            }
        } catch (err) {
            console.error('Error loading more data:', err);
        } finally {
            loadingRef.current = false;
        }
    };

    useEffect(() => {
        fetchInitialData();
        setupInfiniteScroll();

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [fetchInitialData, setupInfiniteScroll]);

    return (
        <div className="data-container">
            {loading && <div className="loading-spinner">Loading...</div>}
            {error && <div className="error-message">{error}</div>}
            
            {children({ users, posts, loading })}
            
            <div id="scroll-sentinel" style={{ height: '20px' }} />
        </div>
    );
};

export default DataLoader; 