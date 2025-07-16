// src/components/Friends/FriendsPage.jsx
import React from 'react';
import UserSearch from './UserSearch';
import PendingRequests from './PendingRequests';

const FriendsPage = () => {
    return (
        <div className="container mx-auto p-4 md:p-8 text-white">
            <h2 className="text-3xl font-bold mb-6">Quản lý bạn bè</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <UserSearch />
                    <PendingRequests />
                </div>
                <div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-xl font-semibold mb-4 text-white">Bạn bè của bạn</h3>
                        <p className="text-gray-400">Danh sách bạn bè và trạng thái của họ được hiển thị ở thanh bên phải màn hình.</p>
                         <p className="text-gray-400 mt-2">Tính năng "Chơi gần đây" sẽ được phát triển trong tương lai.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FriendsPage;