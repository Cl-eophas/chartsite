// Constants for API configuration
const API_CONFIG = {
    BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    TIMEOUT: 5000, // Reduced from 8000
    RETRY_DELAY: 500, // Reduced from 1000
    MAX_RETRIES: 2 // Reduced from 3
};

// Cache manager for API responses
class CacheManager {
    constructor() {
        this.cache = new Map();
    }

    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    get(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        if (Date.now() - cached.timestamp > API_CONFIG.CACHE_TIME) {
            this.cache.delete(key);
            return null;
        }
        return cached.data;
    }

    clear() {
        this.cache.clear();
    }
}

const cache = new CacheManager();

// Enhanced connection manager
class ConnectionManager {
    constructor() {
        this.isConnected = false;
        this.lastCheck = 0;
        this.checkPromise = null;
    }

    async checkConnection() {
        const now = Date.now();

        // Prevent multiple simultaneous checks
        if (this.checkPromise && (now - this.lastCheck) < 5000) {
            return this.checkPromise;
        }

        this.checkPromise = (async() => {
            try {
                const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
                    method: 'GET',
                    headers: { 'Cache-Control': 'no-cache' },
                    timeout: 5000
                });

                this.isConnected = response.ok;
                this.lastCheck = now;
                return this.isConnected;
            } catch (error) {
                this.isConnected = false;
                throw new Error('Server unavailable');
            }
        })();

        return this.checkPromise;
    }

    async waitForConnection(retries = 0) {
        if (this.isConnected) return true;
        if (retries >= API_CONFIG.MAX_RETRIES) {
            throw new Error('Server unavailable after multiple attempts');
        }

        try {
            const isConnected = await this.checkConnection();
            if (isConnected) return true;
        } catch (error) {
            console.warn(`Connection attempt ${retries + 1} failed`);
        }

        await new Promise(resolve =>
            setTimeout(resolve, API_CONFIG.RETRY_DELAY * Math.pow(2, retries))
        );
        return this.waitForConnection(retries + 1);
    }
}

const connectionManager = new ConnectionManager();

// Simplified request handler
const requestHandler = {
    controller: null,
    abort() {
        if (this.controller) {
            this.controller.abort();
            this.controller = null;
        }
    },
    create() {
        this.abort();
        this.controller = new AbortController();
        return this.controller.signal;
    }
};

// Optimized API request function
async function apiRequest(endpoint, options = {}) {
    const signal = requestHandler.create();
    let attempt = 0;

    while (attempt < API_CONFIG.MAX_RETRIES) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                signal
            });

            requestHandler.abort();

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            attempt++;

            if (attempt === API_CONFIG.MAX_RETRIES) {
                throw error;
            }

            await new Promise(resolve =>
                setTimeout(resolve, API_CONFIG.RETRY_DELAY * attempt)
            );
        }
    }
}

// Simplified API interface
const api = {
    async login(credentials) {
        return apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    },

    async getUsers(page = 1) {
        return apiRequest(`/users?page=${page}&limit=10`);
    },

    async getPosts(page = 1) {
        return apiRequest(`/posts?page=${page}&limit=10`);
    },

    async getUserPosts(userId, page = 1, limit = API_CONFIG.BATCH_SIZE) {
        return apiRequest(`/users/${userId}/posts?page=${page}&limit=${limit}`);
    },

    // Batch fetch multiple resources
    async batchFetch(requests) {
        return Promise.all(
            requests.map(req => apiRequest(req.endpoint, req.options))
        );
    },

    async checkAuth() {
        return apiRequest('/auth/check', {
            method: 'GET',
            headers: { 'X-Priority': 'high' }
        });
    }
};

export { api };