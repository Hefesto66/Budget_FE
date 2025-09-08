
"use client";

import { useEffect, useState } from 'react';

// Utility to generate a random number in a range
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Array of vibrant colors for the confetti
const colors = [
  '#FFC700', // Gold
  '#FF4D4D', // Red
  '#4DFF8A', // Green
  '#4DA6FF', // Blue
  '#FF4DF2', // Pink
  '#E05423'
];

interface ConfettiPieceProps {
  x: number;
  y: number;
  color: string;
  delay: number;
}

const ConfettiPiece = ({ x, y, color, delay }: ConfettiPieceProps) => {
  const style = {
    '--x': `${x}vw`,
    '--y': `${y}vh`,
    backgroundColor: color,
    animationDelay: `${delay}s, ${delay}s`,
  } as React.CSSProperties;

  return <div className="confetti" style={style} />;
};


export const Confetti = () => {
    const [pieces, setPieces] = useState<ConfettiPieceProps[]>([]);

    useEffect(() => {
        const newPieces = Array(150)
        .fill(0)
        .map((_, i) => ({
            x: random(0, 100),
            y: random(-20, -80), // Start above the screen
            color: colors[i % colors.length],
            delay: random(0, 5),
        }));
        setPieces(newPieces);
    }, []);

    return (
        <div className="confetti-container" aria-hidden="true">
        {pieces.map((piece, i) => (
            <ConfettiPiece key={i} {...piece} />
        ))}
        </div>
    );
};

    