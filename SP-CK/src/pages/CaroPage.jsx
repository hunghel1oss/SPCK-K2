import React from 'react';
import { CaroGame } from '../components/caro/CaroGame';

const CaroPage = ({ onBack }) => {
    return <CaroGame onBack={onBack} />;
};

export default CaroPage;