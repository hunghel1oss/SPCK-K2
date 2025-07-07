import React from "react";

const DIFFICULTIES = [3, 4, 5, 6, 8]; // 3x3, 4x4, 5x5, 6x6, 8x8

const DifficultySelector = ({ onSelect, selected, disabled }) => {
    return (
        <div className="flex flex-col items-center my-6">
            <h3 className="text-xl font-semibold mb-3 text-gray-200">
                Chọn độ khó
            </h3>
            <div className="flex gap-3">
                {DIFFICULTIES.map((level) => (
                    <button
                        key={level}
                        onClick={() => onSelect(level)}
                        disabled={disabled}
                        className={`
                            px-5 py-2 rounded-lg font-bold text-white transition-all duration-200
                            ${selected === level
                                ? 'bg-purple-600 ring-2 ring-purple-300'
                                : 'bg-gray-700 hover:bg-gray-600'
                            }
                            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        {level}x{level}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DifficultySelector;