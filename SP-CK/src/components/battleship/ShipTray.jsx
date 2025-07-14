import React from 'react';

const shipImageMap = {
    carrier: '/img/tau-5.jpg',
    battleship: '/img/tau-4.jpg',
    cruiser: '/img/tau-3.jpg',
    destroyer: '/img/tau-2.jpg',
};

const ShipUI = ({ ship, isSelected, onSelect, onUnplace }) => {
    const selectedClass = isSelected ? 'ring-4 ring-yellow-400 shadow-lg' : 'hover:bg-gray-600';
    const clickHandler = ship.isPlaced ? () => onUnplace(ship.id) : () => onSelect(ship.id);
    const placedStyle = ship.isPlaced ? 'grayscale opacity-50' : '';
    const cursorStyle = ship.isPlaced ? 'cursor-pointer' : (isSelected ? 'cursor-grabbing' : 'cursor-grab');

    return (
        <div 
            className={`p-3 rounded-lg bg-gray-700 ${selectedClass} ${cursorStyle} transition-all duration-200 ease-in-out`}
            onClick={clickHandler}
        >
            <div className={`flex justify-between items-center ${placedStyle}`}>
                <div className="flex-1">
                    <p className="capitalize text-lg font-semibold text-gray-200">{ship.type}</p>
                    <p className="text-sm text-gray-400">{ship.size} ô</p>
                </div>
                <div className="w-24 h-10 flex items-center justify-center bg-black/20 rounded">
                     <img src={shipImageMap[ship.type]} alt={ship.type} className="max-h-full max-w-full object-contain" />
                </div>
            </div>
            {ship.isPlaced && <p className="text-xs text-center text-green-400 mt-1">Đã đặt (Click để gỡ)</p>}
        </div>
    );
};

const ShipTray = ({ ships, selectedShipId, onSelectShip, onUnplaceShip, onRotateShip, onRandomize }) => {
    const sortedShips = [...ships].sort((a, b) => b.size - a.size);

    return (
        <div className="w-80 flex flex-col gap-4 p-4 bg-gray-800 rounded-lg shadow-xl">
            <h3 className="text-xl font-bold text-center text-blue-300">Hạm Đội Của Bạn</h3>
            <div className="space-y-3 overflow-y-auto pr-2" style={{maxHeight: '400px'}}>
                {sortedShips.map(ship => (
                    <ShipUI
                        key={ship.id}
                        ship={ship}
                        isSelected={ship.id === selectedShipId && !ship.isPlaced} 
                        onSelect={onSelectShip}
                        onUnplace={onUnplaceShip}
                    />
                ))}
            </div>
            <div className="mt-auto pt-4 border-t-2 border-gray-600 flex flex-col gap-3">
                 <button 
                    onClick={onRotateShip} 
                    disabled={!selectedShipId || ships.find(s => s.id === selectedShipId)?.isPlaced}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-md transition-all disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    Xoay Thuyền (Phím R)
                </button>
                 <button 
                    onClick={onRandomize}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 rounded-md transition-all"
                 >
                    Xếp Ngẫu Nhiên
                </button>
            </div>
        </div>
    );
};

export default ShipTray;