import { v4 as uuidv4 } from 'uuid';

export const createInitialShips = (shipsToPlace) => {
    const initialShips = [];
    
    Object.entries(shipsToPlace).forEach(([type, { size, count }]) => {
        for (let i = 0; i < count; i++) {
            initialShips.push({
                id: `${type}_${i}`, 
                type: type,
                size: size,
                orientation: 'horizontal', 
                isPlaced: false,
                positions: [], 
            });
        }
    });
    
    return initialShips;
};