const WEBSOCKET_URL = 'ws://localhost:8080';
let socket = null;
const listeners = new Map();

function setupSocketListeners() {
    if (!socket) return;

    socket.onopen = () => {
        console.log('[WebSocket] Đã kết nối thành công.');
        const connectListeners = listeners.get('connect');
        if (connectListeners) connectListeners.forEach(cb => cb());
    };

    socket.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            const messageListeners = listeners.get(message.type);
            if (messageListeners) {
                messageListeners.forEach(cb => cb(message.payload));
            }
        } catch (error) {
            console.error('[WebSocket] Lỗi khi xử lý message:', error);
        }
    };

    socket.onclose = () => {
        console.log('[WebSocket] Đã mất kết nối.');
        const disconnectListeners = listeners.get('disconnect');
        if (disconnectListeners) disconnectListeners.forEach(cb => cb());
        socket = null;
    };

    socket.onerror = (error) => console.error('[WebSocket] Lỗi:', error);
}

export const connect = (apiKey) => {
    if (socket) {
        socket.close();
    }
    
    if (!apiKey) return;
    
    socket = new WebSocket(`${WEBSOCKET_URL}?apiKey=${apiKey}`);
    setupSocketListeners();
};

export const disconnect = () => {
    if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onclose = null;
        socket.onerror = null;
        socket.close();
        socket = null;
    }
};

export const on = (eventName, callback) => {
    if (!listeners.has(eventName)) {
        listeners.set(eventName, new Set());
    }
    listeners.get(eventName).add(callback);
};

export const off = (eventName, callback) => {
    if (listeners.has(eventName)) {
        listeners.get(eventName).delete(callback);
    }
};

export const emit = (eventName, data) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: eventName, payload: data }));
    }
};