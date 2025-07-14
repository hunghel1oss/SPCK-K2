const API_URL = 'http://localhost:8080/api';

async function handleResponse(response) {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `Lỗi Server: ${response.status} ${response.statusText}` }));
        throw new Error(error.message || 'Đã có lỗi xảy ra');
    }
    return response.json();
}

export const register = async (username, password) => {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
};

export const login = async (username, password) => {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
};

export const getHistory = async (apiKey) => {
    const response = await fetch(`${API_URL}/history`, { headers: { 'x-api-key': apiKey } });
    return handleResponse(response);
};

export const saveGameToHistory = async (apiKey, gameData) => {
    const response = await fetch(`${API_URL}/history`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, }, body: JSON.stringify(gameData),
    });
    return handleResponse(response);
};

export const clearHistory = async (apiKey) => {
    const response = await fetch(`${API_URL}/history`, {
        method: 'DELETE', headers: { 'x-api-key': apiKey },
    });
    return handleResponse(response);
};

export const getFriends = async (apiKey) => {
    const response = await fetch(`${API_URL}/friends`, { headers: { 'x-api-key': apiKey } });
    return handleResponse(response);
};

export const sendFriendRequest = async (apiKey, targetUsername) => {
    const response = await fetch(`${API_URL}/friends/request`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, }, body: JSON.stringify({ targetUsername }),
    });
    return handleResponse(response);
};

export const respondToFriendRequest = async (apiKey, requesterUsername, action) => {
    const response = await fetch(`${API_URL}/friends/respond`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, }, body: JSON.stringify({ requesterUsername, action }),
    });
    return handleResponse(response);
};

export const searchUsers = async (apiKey, query) => {
    const response = await fetch(`${API_URL}/users/search?q=${query}`, { headers: { 'x-api-key': apiKey } });
    return handleResponse(response);
};