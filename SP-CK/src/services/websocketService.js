import EventEmitter from 'eventemitter3';

const WEBSOCKET_URL = 'ws://localhost:8080';
const emitter = new EventEmitter();
let socket = null;

const WebSocketState = {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
};

export function connect(apiKey) {
    if (socket && socket.readyState !== WebSocketState.CLOSED) {
        console.warn('[WebSocket] Connection attempt ignored, socket is already open or connecting.');
        return;
    }

    if (!apiKey) {
        console.error('[WebSocket] API Key is required to connect.');
        return;
    }

    console.log('[WebSocket] Attempting to connect...');
    socket = new WebSocket(`${WEBSOCKET_URL}?apiKey=${apiKey}`);

    socket.onopen = () => {
        console.log('%c[WebSocket] Connection established.', 'color: green; font-weight: bold;');
        emitter.emit('connect');
    };

    socket.onmessage = (event) => {
        try {
            const { type, payload } = JSON.parse(event.data);
            if (type) {
                emitter.emit(type, payload);
            }
        } catch (error) {
            console.error('[WebSocket] Error parsing message:', error, event.data);
        }
    };

    socket.onclose = (event) => {
        console.log(`%c[WebSocket] Connection closed. Code: ${event.code}`, 'color: red; font-weight: bold;');
        emitter.emit('disconnect');
        socket = null;
    };

    socket.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        emitter.emit('error', error);
    };
}

export function disconnect() {
    if (socket) {
        console.log('[WebSocket] Disconnecting...');
        socket.close();
    }
}

export function send(eventName, data) {
    if (socket && socket.readyState === WebSocketState.OPEN) {
        socket.send(JSON.stringify({ type: eventName, payload: data }));
    } else {
        console.warn(`[WebSocket] Cannot send message, socket is not open. Event: ${eventName}`);
    }
}

export const on = (eventName, callback) => emitter.on(eventName, callback);
export const off = (eventName, callback) => emitter.off(eventName, callback);

export { send as emit };