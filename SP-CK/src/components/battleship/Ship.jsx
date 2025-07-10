import React from 'react';

const shipImages = {
    destroyer: '/img/ships/destroyer.png',
    cruiser: '/img/ships/cruiser.png',
    battleship: '/img/ships/battleship.png',
    carrier: '/img/ships/carrier.png'
};

const ShipUI = ({ ship, isSelected, onSelect, onUnplace }) => {
    const selectedClass = isSelected ? 'ring-2 ring-yellow-400' : 'hover:bg-gray-600';
    const clickHandler = ship.isPlaced ? () => onUnplace(ship.id) : () => onSelect(ship.id);
    const placedStyle = ship.isPlaced ? {
        filter: 'grayscale(80%) brightness(0.7)',
        opacity: 0.6
    } : {};

    return (
        <div 
            className={`p-2 rounded bg-gray-700 ${selectedClass} transition-all`}
            onClick={clickHandler}
            style={{cursor: ship.isPlaced ? 'pointer' : 'grab'}}
        >
            <p className="capitalize text-lg font-semibold">{ship.type} ({ship.size} ô)</p>
            <div className="flex justify-center items-center mt-1 h-10" style={placedStyle}>
                <img 
                    src={shipImages[ship.type] || '/img/ships/default.png'} 
                    alt={ship.type} 
                    className="h-full object-contain"
                />
            </div>
        </div>
    );
};

const ShipTray = ({ ships, selectedShipId, onSelectShip, onUnplaceShip, onRotateShip, onRandomize }) => {
    return (
        <div className="w-80 flex flex-col gap-4 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-xl font-bold text-center">Hạm Đội Của Bạn</h3>
            
            <div className="space-y-3">
                {ships.map(ship => (
                    <ShipUI
                        key={ship.id}
                        ship={ship}
                        isSelected={ship.id === selectedShipId}
                        onSelect={onSelectShip}
                        onUnplace={onUnplaceShip}
                    />
                ))}
            </div>

            <div className="mt-auto pt-4 border-t border-gray-600 flex flex-col gap-2">
                 <button 
                    onClick={onRotateShip} 
                    disabled={!selectedShipId || ships.find(s => s.id === selectedShipId)?.isPlaced}
                    className="w-full bg-blue-600 text-white font-bold p-2 rounded disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    Xoay Thuyền (R)
                </button>
                 <button 
                    onClick={onRandomize}
                    className="w-full bg-indigo-600 text-white font-bold p-2 rounded"
                 >
                    Xếp Ngẫu Nhiên
                </button>
            </div>
        </div>
    );
};

export default ShipTray;