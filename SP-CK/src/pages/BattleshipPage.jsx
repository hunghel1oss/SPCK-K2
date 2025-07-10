// src/pages/BattleshipPage.jsx

import React from 'react';
import { BattleshipGame } from '../components/battleship/BattleshipGame';

const BattleshipPage = ({ onBack }) => {
    return <BattleshipGame onBack={onBack} />;
};

export default BattleshipPage;