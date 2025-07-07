// src/services/api.js
const API_URL = 'http://localhost:8080/api';

async function handleResponse(response) {
    if (!response.ok) {
        const error = await response.json();
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

// src/services/websocketService.js
const WEBSOCKET_URL = 'ws://localhost:8080';
let socket = null;
const listeners = {};

function setupSocketListeners() {
    if (!socket) return;

    socket.onopen = () => {
        console.log('[WebSocket] Đã kết nối thành công.');
        if (listeners['connect']) listeners['connect'].forEach(cb => cb());
    };
    socket.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            if (message.type && listeners[message.type]) {
                listeners[message.type].forEach(cb => cb(message.payload));
            }
        } catch (error) {
            console.error('[WebSocket] Lỗi khi xử lý message:', error);
        }
    };
    socket.onclose = () => {
        console.log('[WebSocket] Đã mất kết nối.');
        if (listeners['disconnect']) listeners['disconnect'].forEach(cb => cb());
        socket = null;
    };
    socket.onerror = (error) => console.error('[WebSocket] Lỗi:', error);
}

export const connect = (apiKey) => {
    if (socket || !apiKey) return;
    socket = new WebSocket(`${WEBSOCKET_URL}?apiKey=${apiKey}`);
    setupSocketListeners();
};
export const disconnect = () => {
    if (socket) {
        socket.close();
        socket = null;
    }
    Object.keys(listeners).forEach(key => delete listeners[key]);
};
export const on = (eventName, callback) => {
    if (!listeners[eventName]) listeners[eventName] = [];
    listeners[eventName].push(callback);
};
export const off = (eventName, callback) => {
    if (listeners[eventName]) {
        listeners[eventName] = listeners[eventName].filter(cb => cb !== callback);
    }
};
export const emit = (eventName, data) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: eventName, payload: data }));
    }
};