// src/components/battleship/PlacementBoard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { createInitialShips } from './shipFactory';
import ShipTray from './ShipTray';
import { getShipPositions, checkPlacement } from './usePlacementCanvas'; 
import { BoardLayout } from './BoardLayout';

const BOARD_SIZE = 9;
const CELL_SIZE = 36;

const shipImagePaths = {
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

    const shipWidth = ship.size * CELL_SIZE;
    const shipHeight = CELL_SIZE;
    let transform = 'none';

    if (ship.orientation === 'vertical') {
        transform = `rotate(90deg) translateY(-${shipHeight}px)`;
    }

    const style = {
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        width: `${shipWidth}px`,
        height: `${shipHeight}px`,
        transformOrigin: 'top left',
        transform: transform,
        transition: 'transform 0.3s ease',
        pointerEvents: 'none',
    };

    return <img src={shipImagePaths[ship.type]} alt={ship.type} style={style} className="z-10" />;
};

const ShipPreview = ({ ship, hoverIndex, canPlace }) => {
    if (!ship || ship.isPlaced || hoverIndex === null) return null;

    const top = Math.floor(hoverIndex / BOARD_SIZE) * CELL_SIZE;
    const left = (hoverIndex % BOARD_SIZE) * CELL_SIZE;
    const color = canPlace ? 'bg-green-500/50' : 'bg-red-500/50';

    const shipWidth = ship.size * CELL_SIZE;
    const shipHeight = CELL_SIZE;
    let transform = 'none';

    if (ship.orientation === 'vertical') {
        transform = `rotate(90deg) translateY(-${shipHeight}px)`;
    }

    const style = {
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        width: `${shipWidth}px`,
        height: `${shipHeight}px`,
        transformOrigin: 'top left',
        transform: transform,
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
        if (shipsToPlace) {
            setShips(createInitialShips(shipsToPlace));
        }
    }, [shipsToPlace]);

    const selectedShip = ships.find(s => s.id === selectedShipId);

    const handleRotateShip = useCallback(() => {
        if (!selectedShipId) return;
        setShips(prevShips => prevShips.map(ship => {
            if (ship.id === selectedShipId && !ship.isPlaced) {
                return { ...ship, orientation: ship.orientation === 'horizontal' ? 'vertical' : 'horizontal' };
            }
            return ship;
        }));
    }, [selectedShipId]);
    
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                handleRotateShip();
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleRotateShip]);

    const handleUnplaceShip = (shipId) => {
        setShips(prevShips => prevShips.map(ship => {
            if (ship.id === shipId) {
                return { ...ship, isPlaced: false, positions: [] };
            }
            return ship;
        }));
        if (selectedShipId === shipId) {
            setSelectedShipId(null);
        }
    };

    const handleCellClick = (index) => {
        if (!selectedShip || selectedShip.isPlaced) return;
        
        const newPositions = getShipPositions(index, selectedShip.size, selectedShip.orientation, BOARD_SIZE);
        const canPlace = checkPlacement(newPositions, selectedShip.orientation, ships, BOARD_SIZE);

        if (canPlace) {
            setShips(prevShips => prevShips.map(ship => {
                if (ship.id === selectedShipId) {
                    return { ...ship, isPlaced: true, positions: newPositions };
                }
                return ship;
            }));
            setSelectedShipId(null);
        }
    };
    
    const handleRandomize = () => {
        let tempShips = createInitialShips(shipsToPlace);
        let placedShips = [];
        let attempts = 0;

        while (placedShips.length < tempShips.length && attempts < 1000) {
            const shipToPlace = tempShips[placedShips.length];
            let placed = false;
            let shipAttempts = 0;
            
            while (!placed && shipAttempts < 100) {
                const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
                const startPos = Math.floor(Math.random() * BOARD_SIZE * BOARD_SIZE);
                const positions = getShipPositions(startPos, shipToPlace.size, orientation, BOARD_SIZE);
    
                if (checkPlacement(positions, orientation, placedShips, BOARD_SIZE)) {
                    placedShips.push({ ...shipToPlace, isPlaced: true, positions, orientation });
                    placed = true;
                }
                shipAttempts++;
            }
            attempts++;
        }
    
        if (placedShips.length === tempShips.length) {
            setShips(placedShips);
        } else {
            alert("Không thể xếp ngẫu nhiên, vui lòng thử lại hoặc xếp tay!");
            setShips(createInitialShips(shipsToPlace));
        }
    };

    const handleReadyClick = () => {
        setIsWaiting(true);
        onReady(ships);
    }
    
    const allShipsPlaced = ships.length > 0 && ships.every(s => s.isPlaced);
    const canPlacePreview = selectedShip && hoverIndex !== null ? checkPlacement(getShipPositions(hoverIndex, selectedShip.size, selectedShip.orientation, BOARD_SIZE), selectedShip.orientation, ships, BOARD_SIZE) : false;

    return (
        <div className="flex flex-col items-center">
            <h2 className="text-2xl mb-4">Giai đoạn Sắp xếp - Hãy đặt thuyền của bạn!</h2>
            
            <div className="flex flex-col md:flex-row gap-8">
                <BoardLayout>
                    <div
                        className="relative bg-blue-900/50"
                        style={{ width: BOARD_SIZE * CELL_SIZE, height: BOARD_SIZE * CELL_SIZE }}
                        onMouseLeave={() => setHoverIndex(null)}
                    >
                        <div 
                            className="absolute top-0 left-0 grid z-20"
                            style={{ 
                                gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
                                width: '100%',
                                height: '100%',
                            }}
                        >
                            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, index) => (
                                <div
                                    key={index}
                                    className="w-9 h-9 border border-blue-800"
                                    onMouseEnter={() => setHoverIndex(index)}
                                    onClick={() => handleCellClick(index)}
                                />
                            ))}
                        </div>

                        <div className="absolute top-0 left-0 w-full h-full">
                            {ships.map(ship => <PlacedShip key={ship.id} ship={ship} />)}
                        </div>

                        <ShipPreview ship={selectedShip} hoverIndex={hoverIndex} canPlace={canPlacePreview} />
                    </div>
                </BoardLayout>

                <ShipTray
                    ships={ships}
                    selectedShipId={selectedShipId}
                    onSelectShip={setSelectedShipId}
                    onUnplaceShip={handleUnplaceShip}
                    onRotateShip={handleRotateShip}
                    onRandomize={handleRandomize}
                />
            </div>

            {isWaiting ? (
                 <h3 className="mt-8 text-xl text-yellow-300 animate-pulse">Đang chờ đối thủ...</h3>
            ) : (
                <button 
                    onClick={handleReadyClick}
                    className="mt-8 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 text-xl rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
                    disabled={!allShipsPlaced}
                >
                    Sẵn sàng
                </button>
            )}
        </div>
    );
};

export default PlacementBoard;