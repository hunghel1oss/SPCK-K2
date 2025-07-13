const API_URL = 'http://localhost:8080/api';
const WEBSOCKET_URL = 'ws://localhost:8080';

async function handleResponse(response) {
    if (!response.ok) {
        const error = await response.json().catch(() => {
            return { message: `Lỗi Server: ${response.status} ${response.statusText}` };
        });
        throw new Error(error.message || 'Đã có lỗi xảy ra');
    }
    return response.json();
}

export const register = async (username, password) => {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
};

export const login = async (username, password) => {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
};

export const getHistory = async (apiKey) => {
    const response = await fetch(`${API_URL}/history`, {
        headers: { 'x-api-key': apiKey },
    });
    return handleResponse(response);
};

export const saveGameToHistory = async (apiKey, gameData) => {
    const response = await fetch(`${API_URL}/history`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
        body: JSON.stringify(gameData),
    });
    return handleResponse(response);
};

export const clearHistory = async (apiKey) => {
    const response = await fetch(`${API_URL}/history`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
    });
    return handleResponse(response);
};


// --- Friend Functions ---
export const getFriends = async (apiKey) => {
    const response = await fetch(`${API_URL}/friends`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
    });
    return handleResponse(response);
};

export const sendFriendRequest = async (apiKey, targetUsername) => {
    const response = await fetch(`${API_URL}/friends/request`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
        body: JSON.stringify({ targetUsername }),
    });
    return handleResponse(response);
};

export const respondToFriendRequest = async (apiKey, requesterUsername, action) => {
    const response = await fetch(`${API_URL}/friends/respond`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
        body: JSON.stringify({ requesterUsername, action }),
    });
    return handleResponse(response);
};

export const searchUsers = async (apiKey, query) => {
    const response = await fetch(`${API_URL}/users/search?q=${query}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
    });
    return handleResponse(response);
};


// --- WebSocket Logic ---
let socket = null;
const listeners = new Map();

function setupSocketListeners() {
    if (!socket) return;

    socket.onopen = () => {
        console.log('[WebSocket] Đã kết nối thành công.');
        listeners.get('connect')?.forEach(cb => cb());
    };

    socket.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            listeners.get(message.type)?.forEach(cb => cb(message.payload));
        } catch (error) {
            console.error('[WebSocket] Lỗi khi xử lý message:', error);
        }
    };

    socket.onclose = () => {
        console.log('[WebSocket] Đã mất kết nối.');
        listeners.get('disconnect')?.forEach(cb => cb());
        socket = null;
    };

    socket.onerror = (error) => console.error('[WebSocket] Lỗi:', error.message);
}

export const connect = (apiKey) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        return;
    }
    if (!apiKey) return;
    
    socket = new WebSocket(`${WEBSOCKET_URL}?apiKey=${apiKey}`);
    setupSocketListeners();
};

export const disconnect = () => {
    if (socket) {
        socket.close();
        socket = null;
        listeners.clear();
    }
};

export const on = (eventName, callback) => {
    if (!listeners.has(eventName)) {
        listeners.set(eventName, new Set());
    }
    listeners.get(eventName).add(callback);
};

export const off = (eventName, callback) => {
    listeners.get(eventName)?.delete(callback);
};

export const emit = (eventName, data) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: eventName, payload: data }));
    } else {
        console.warn(`[WebSocket] Not connected. Cannot emit event: ${eventName}`);
    }
};