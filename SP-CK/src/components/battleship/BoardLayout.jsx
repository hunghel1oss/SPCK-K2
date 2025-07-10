import React from 'react';

const Coordinate = ({ children }) => (
    <div className="w-9 h-9 flex items-center justify-center font-bold text-cyan-400">
        {children}
    </div>
);


export const BoardLayout = ({ children }) => {
    const letters = "ABCDEFGHI".split('');
    const numbers = "123456789".split('');

    return (
        <div className="flex gap-1">
            {}
            <div className="flex flex-col gap-0.5 pt-9"> {}
                {numbers.map(n => <Coordinate key={n}>{n}</Coordinate>)}
            </div>
            
            {}
            <div className="flex flex-col">
                {}
                <div className="flex gap-0.5"> {}
                    {letters.map(l => <Coordinate key={l}>{l}</Coordinate>)}
                </div>
                {}
                <div className="mt-0.5"> {}
                    {children}
                </div>
            </div>
        </div>
    );
};