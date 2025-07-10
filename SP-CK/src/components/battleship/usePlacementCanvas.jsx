import { useEffect, useRef } from 'react';

const CELL_SIZE = 36;
const GRID_COLOR = '#1d4ed8';
const SHIP_COLOR = '#6b7280';
const SHIP_BORDER_COLOR = '#d1d5db';
const PREVIEW_HIT_COLOR = 'rgba(34, 197, 94, 0.6)';
const PREVIEW_MISS_COLOR = 'rgba(239, 68, 68, 0.6)';

const drawShip = (ctx, ship, boardSize) => {
    if (!ship.isPlaced) return;

    ctx.fillStyle = SHIP_COLOR;
    ctx.strokeStyle = SHIP_BORDER_COLOR;
    ctx.lineWidth = 2;

    const startPos = ship.positions[0];
    const x = (startPos % boardSize) * CELL_SIZE;
    const y = Math.floor(startPos / boardSize) * CELL_SIZE;

    let width, height;
    if (ship.orientation === 'horizontal') {
        width = ship.size * CELL_SIZE;
        height = CELL_SIZE;
    } else {
        width = CELL_SIZE;
        height = ship.size * CELL_SIZE;
    }
    
    const padding = 2;
    ctx.fillRect(x + padding, y + padding, width - padding * 2, height - padding * 2);
    ctx.strokeRect(x + padding, y + padding, width - padding * 2, height - padding * 2);
};

const drawPreview = (ctx, positions, canPlace, boardSize) => {
    ctx.fillStyle = canPlace ? PREVIEW_HIT_COLOR : PREVIEW_MISS_COLOR;
    positions.forEach(pos => {
        const x = (pos % boardSize) * CELL_SIZE;
        const y = Math.floor(pos / boardSize) * CELL_SIZE;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
    });
};


export const usePlacementCanvas = (boardSize, ships, hoverIndex, selectedShip) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = GRID_COLOR;
        ctx.lineWidth = 1;
        for (let i = 0; i <= boardSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i * CELL_SIZE, 0);
            ctx.lineTo(i * CELL_SIZE, boardSize * CELL_SIZE);
            ctx.moveTo(0, i * CELL_SIZE);
            ctx.lineTo(boardSize * CELL_SIZE, i * CELL_SIZE);
            ctx.stroke();
        }
        
        ships.forEach(ship => {
            drawShip(ctx, ship, boardSize);
        });

        if (selectedShip && !selectedShip.isPlaced && hoverIndex !== null) {
            const positions = getShipPositions(hoverIndex, selectedShip.size, selectedShip.orientation, boardSize);
            const canPlace = checkPlacement(positions, selectedShip.orientation, ships, boardSize);
            drawPreview(ctx, positions, canPlace, boardSize);
        }

    }, [boardSize, ships, hoverIndex, selectedShip]);

    return canvasRef;
};

export const getShipPositions = (start, size, orientation, boardSize) => {
    const positions = [];
    for (let i = 0; i < size; i++) {
        if (orientation === 'horizontal') {
            positions.push(start + i);
        } else {
            positions.push(start + i * boardSize);
        }
    }
    return positions;
};

export const checkPlacement = (newShipPositions, orientation, allShips, boardSize) => {
    const placedPositions = new Set(allShips.flatMap(s => s.isPlaced ? s.positions : []));
    const startPos = newShipPositions[0];
    const endPos = newShipPositions[newShipPositions.length - 1];

    if (orientation === 'horizontal') {
        if (Math.floor(startPos / boardSize) !== Math.floor(endPos / boardSize)) {
            return false;
        }
    } else { // vertical
        if (endPos >= boardSize * boardSize) {
            return false;
        }
    }
    
    for (const pos of newShipPositions) {
        if (placedPositions.has(pos)) {
            return false;
        }
    }
    
    return true;
};