// src/components/Friends/UserSearch.jsx
import React, { useState } from 'react';
import * as api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext';
import { useFriends } from '../../context/FriendsContext';

const UserSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { apiKey } = useAuth();
    const { friends, requests, sendFriendRequest } = useFriends();

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setIsLoading(true);
        setMessage('');
        setResults([]);
        
        try {
            const data = await api.searchUsers(apiKey, query.trim());
            setResults(data);
            if (data.length === 0) {
                setMessage('Không tìm thấy người dùng nào phù hợp.');
            }
        } catch (error) {
            console.error("Lỗi khi tìm kiếm:", error);
            setMessage(`Lỗi: ${error.message}`);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAddFriend = async (username) => {
        try {
            const res = await sendFriendRequest(username);
            alert(res.message);
        } catch (error) {
            alert(`Lỗi: ${error.message}`);
        }
    };

    const getFriendStatus = (username) => {
        if (friends.some(f => f.username === username)) {
            return { text: 'Đã là bạn bè', disabled: true };
        }
        if (requests.some(r => r.username === username)) {
            return { text: 'Đã gửi yêu cầu', disabled: true };
        }
        return { text: 'Kết bạn', disabled: false };
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-white">Tìm kiếm bạn bè</h3>
            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Nhập tên người dùng..."
                    className="flex-grow bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? '...' : 'Tìm kiếm'}
                </button>
            </form>

            <div className="mt-4 min-h-[60px]">
                {isLoading && <p className="text-gray-400">Đang tìm kiếm...</p>}
                {!isLoading && message && <p className="text-gray-400">{message}</p>}
                {!isLoading && results.map(user => {
                    const status = getFriendStatus(user.username);
                    return (
                        <div key={user.username} className="flex justify-between items-center bg-gray-700 p-2 rounded-md mt-2">
                            <span className="text-white">{user.username}</span>
                            <button 
                                onClick={() => handleAddFriend(user.username)}
                                disabled={status.disabled}
                                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                    status.disabled 
                                    ? 'bg-gray-500 cursor-not-allowed' 
                                    : 'bg-green-600 hover:bg-green-700'
                                }`}
                            >
                                {status.text}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UserSearch;