import React, { useState, useEffect, useCallback } from 'react';
import { createInitialShips } from './shipFactory';
import ShipTray from './ShipTray';
import { getShipPositions, checkPlacement } from './placementUtils';

const BOARD_SIZE = 9;
const CELL_SIZE = 36;

const shipImageMap = {
    carrier: '/img/tau-5.jpg',
    battleship: '/img/tau-4.jpg',
    cruiser: '/img/tau-3.jpg',
    destroyer: '/img/tau-2.jpg',
};

const PlacedShip = ({ ship }) => {
    if (!ship.isPlaced) return null;

    const startPos = ship.positions[0];
    const top = Math.floor(startPos / BOARD_SIZE) * CELL_SIZE;
    const left = (startPos % BOARD_SIZE) * CELL_SIZE;
    const width = ship.size * CELL_SIZE;
    const height = CELL_SIZE;
    const transform = ship.orientation === 'vertical' ? `rotate(90deg)` : 'none';

    const style = {
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: transform,
        transformOrigin: `top left`,
        marginLeft: ship.orientation === 'vertical' ? `${CELL_SIZE}px` : '0px',
        marginTop: ship.orientation === 'vertical' ? `-${CELL_SIZE}px` : '0px',
        pointerEvents: 'none',
    };

    return (
        <div style={style}>
            <img src={shipImageMap[ship.type]} alt={ship.type} style={{ width: '100%', height: '100%', objectFit: 'fill', borderRadius: '4px' }} />
        </div>
    );
};

const ShipPreview = ({ ship, hoverIndex, canPlace }) => {
    if (!ship || ship.isPlaced || hoverIndex === null) return null;

    const startPos = hoverIndex;
    const top = Math.floor(startPos / BOARD_SIZE) * CELL_SIZE;
    const left = (startPos % BOARD_SIZE) * CELL_SIZE;
    const width = (ship.orientation === 'horizontal' ? ship.size : 1) * CELL_SIZE;
    const height = (ship.orientation === 'vertical' ? ship.size : 1) * CELL_SIZE;
    const color = canPlace ? 'bg-green-500/50' : 'bg-red-500/50';

    const style = {
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${height}px`,
        pointerEvents: 'none',
    };

    return <div style={style} className={`z-20 ${color} rounded-md`}></div>;
};

const PlacementBoard = ({ shipsToPlace, onReady }) => {
    const [ships, setShips] = useState([]);
    const [selectedShipId, setSelectedShipId] = useState(null);
    const [hoverIndex, setHoverIndex] = useState(null);
    const [isWaiting, setIsWaiting] = useState(false);

    useEffect(() => {
        if (shipsToPlace) setShips(createInitialShips(shipsToPlace));
    }, [shipsToPlace]);

    const selectedShip = ships.find(s => s.id === selectedShipId);

    const handleRotateShip = useCallback(() => {
        if (!selectedShipId) return;
        setShips(prevShips => prevShips.map(ship => 
            ship.id === selectedShipId && !ship.isPlaced 
            ? { ...ship, orientation: ship.orientation === 'horizontal' ? 'vertical' : 'horizontal' } 
            : ship
        ));
    }, [selectedShipId]);
    
    useEffect(() => {
        const handleKeyPress = (e) => {
            if ((e.key === 'r' || e.key === 'R') && selectedShipId) {
                e.preventDefault();
                handleRotateShip();
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleRotateShip, selectedShipId]);

    const handleUnplaceShip = (shipId) => {
        setShips(prevShips => prevShips.map(ship => 
            ship.id === shipId ? { ...ship, isPlaced: false, positions: [] } : ship
        ));
    };

    const handleCellClick = (index) => {
        if (!selectedShip || selectedShip.isPlaced) return;
        const newPositions = getShipPositions(index, selectedShip.size, selectedShip.orientation, BOARD_SIZE);
        if (checkPlacement(newPositions, ships, BOARD_SIZE)) {
            setShips(prevShips => prevShips.map(ship => 
                ship.id === selectedShipId ? { ...ship, isPlaced: true, positions: newPositions } : ship
            ));
            setSelectedShipId(null);
        }
    };
    
    const handleRandomize = () => {
        let tempShips = createInitialShips(shipsToPlace);
        let placedShips = [];
        for(const shipToPlace of tempShips) {
            let placed = false;
            let attempts = 0;
            while(!placed && attempts < 100) {
                const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
                const startPos = Math.floor(Math.random() * BOARD_SIZE * BOARD_SIZE);
                const positions = getShipPositions(startPos, shipToPlace.size, orientation, BOARD_SIZE);
                if (checkPlacement(positions, placedShips, BOARD_SIZE)) {
                    placedShips.push({ ...shipToPlace, isPlaced: true, positions, orientation });
                    placed = true;
                }
                attempts++;
            }
        }
        if (placedShips.length === tempShips.length) {
            setShips(placedShips);
        } else {
            alert("Không thể xếp ngẫu nhiên, vui lòng thử lại!");
            setShips(createInitialShips(shipsToPlace));
        }
    };

    const handleReadyClick = () => {
        setIsWaiting(true);
        onReady(ships);
    }
    
    const allShipsPlaced = ships.length > 0 && ships.every(s => s.isPlaced);
    const canPlacePreview = selectedShip && hoverIndex !== null ? checkPlacement(getShipPositions(hoverIndex, selectedShip.size, selectedShip.orientation, BOARD_SIZE), ships, BOARD_SIZE) : false;

    return (
        <div className="flex flex-col items-center">
            <h2 className="text-2xl mb-4">Giai đoạn Sắp xếp</h2>
            <div className="flex flex-col md:flex-row gap-8">
                <div className="relative bg-blue-900/50" style={{ width: BOARD_SIZE * CELL_SIZE, height: BOARD_SIZE * CELL_SIZE }} onMouseLeave={() => setHoverIndex(null)}>
                    <div className="absolute top-0 left-0 grid z-20" style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`}}>
                        {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, index) => (
                            <div key={index} className="w-9 h-9 border border-blue-800 cursor-pointer" onMouseEnter={() => setHoverIndex(index)} onClick={() => handleCellClick(index)} />
                        ))}
                    </div>
                    {ships.map(ship => <PlacedShip key={ship.id} ship={ship} />)}
                    <ShipPreview ship={selectedShip} hoverIndex={hoverIndex} canPlace={canPlacePreview} />
                </div>
                <ShipTray ships={ships} selectedShipId={selectedShipId} onSelectShip={setSelectedShipId} onUnplaceShip={handleUnplaceShip} onRotateShip={handleRotateShip} onRandomize={handleRandomize} />
            </div>
            {isWaiting ? (
                 <h3 className="mt-8 text-xl text-yellow-300 animate-pulse">Đang chờ đối thủ...</h3>
            ) : (
                <button onClick={handleReadyClick} className="mt-8 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 text-xl rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed" disabled={!allShipsPlaced}>
                    Sẵn sàng
                </button>
            )}
        </div>
    );
};

export default PlacementBoard;