export const getShipPositions = (start, size, orientation, boardSize) => {
    const positions = [];
    for (let i = 0; i < size; i++) {
        if (orientation === 'horizontal') {
            if ((start % boardSize) + i >= boardSize) return []; // Out of bounds
            positions.push(start + i);
        } else {
            if (start + (i * boardSize) >= boardSize * boardSize) return []; // Out of bounds
            positions.push(start + i * boardSize);
        }
    }
    return positions;
};

export const checkPlacement = (newShipPositions, allShips, boardSize) => {
    if (newShipPositions.length === 0) return false; // Invalid positions

    const placedPositions = new Set(allShips.flatMap(s => s.isPlaced ? s.positions : []));
    
    for (const pos of newShipPositions) {
        if (placedPositions.has(pos)) {
            return false;
        }
    }
    
    return true;
};