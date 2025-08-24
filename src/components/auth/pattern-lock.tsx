
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const GRID_SIZE = 3;
const DOT_SIZE = 24;
const GRID_GAP = 48;

interface Dot {
    id: number;
    x: number;
    y: number;
}

interface PatternLockProps {
    onPatternComplete: (pattern: number[]) => void;
    mode: 'set' | 'verify';
    savedPattern?: number[];
}

export function PatternLock({ onPatternComplete, mode, savedPattern }: PatternLockProps) {
    const { toast } = useToast();
    const [dots, setDots] = useState<Dot[]>([]);
    const [path, setPath] = useState<number[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isError, setIsError] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const tempDots: Dot[] = [];
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            tempDots.push({
                id: i,
                x: (i % GRID_SIZE) * (DOT_SIZE + GRID_GAP) + DOT_SIZE / 2,
                y: Math.floor(i / GRID_SIZE) * (DOT_SIZE + GRID_GAP) + DOT_SIZE / 2,
            });
        }
        setDots(tempDots);
    }, []);

    const getDotFromEvent = (e: React.MouseEvent | React.TouchEvent): Dot | undefined => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const touch = 'touches' in e ? e.touches[0] : e;
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        return dots.find(dot =>
            Math.sqrt((dot.x - x) ** 2 + (dot.y - y) ** 2) < DOT_SIZE
        );
    };

    const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsDrawing(true);
        const dot = getDotFromEvent(e);
        if (dot) {
            setPath([dot.id]);
        }
    };
    
    const handleInteractionMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        
        const rect = svgRef.current?.getBoundingClientRect();
        if(!rect) return;
        const touch = 'touches' in e ? e.touches[0] : e;

        setMousePos({x: touch.clientX - rect.left, y: touch.clientY - rect.top});

        const dot = getDotFromEvent(e);
        if (dot && !path.includes(dot.id)) {
            const lastDotId = path[path.length - 1];
            const lastDot = dots.find(d => d.id === lastDotId);
            if(lastDot) {
                 setLines(prev => [...prev, { x1: lastDot.x, y1: lastDot.y, x2: dot.x, y2: dot.y }]);
            }
            setPath(prev => [...prev, dot.id]);
        }
    };

    const handleInteractionEnd = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        setMousePos({x: 0, y: 0});
        
        if (path.length < 4) {
            if (mode === 'set') toast({ variant: "destructive", title: "Pattern Too Short", description: "Please use at least 4 dots." });
            reset();
            return;
        }

        if (mode === 'verify') {
            if (JSON.stringify(path) === JSON.stringify(savedPattern)) {
                onPatternComplete(path);
            } else {
                toast({ variant: "destructive", title: "Pattern Incorrect", description: "Please try again." });
                setIsError(true);
                setTimeout(reset, 800);
            }
        } else {
             onPatternComplete(path);
             // Visual feedback for successful set
             setTimeout(reset, 500);
        }
    };

    const reset = () => {
        setIsDrawing(false);
        setPath([]);
        setLines([]);
        setMousePos({ x: 0, y: 0 });
        setIsError(false);
    };
    
    const lastPoint = path.length > 0 ? dots.find(d => d.id === path[path.length - 1]) : null;

    return (
        <div className="flex justify-center" onMouseUp={handleInteractionEnd} onTouchEnd={handleInteractionEnd} onMouseLeave={handleInteractionEnd}>
            <svg 
                ref={svgRef} 
                className="touch-none cursor-pointer"
                width={GRID_SIZE * (DOT_SIZE + GRID_GAP) - GRID_GAP} 
                height={GRID_SIZE * (DOT_SIZE + GRID_GAP) - GRID_GAP}
                onMouseDown={handleInteractionStart}
                onMouseMove={handleInteractionMove}
                onTouchStart={handleInteractionStart}
                onTouchMove={handleInteractionMove}
            >
                {/* Lines for completed path segments */}
                {lines.map((line, i) => (
                    <line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} className={cn("stroke-primary/50 stroke-[6px]", isError && "stroke-destructive")} />
                ))}
                 {/* Line from last dot to cursor */}
                {isDrawing && lastPoint && (
                    <line x1={lastPoint.x} y1={lastPoint.y} x2={mousePos.x} y2={mousePos.y} className={cn("stroke-primary/50 stroke-[6px]", isError && "stroke-destructive")} />
                )}
                {/* Dots */}
                {dots.map(dot => (
                    <circle 
                        key={dot.id} 
                        cx={dot.x} 
                        cy={dot.y} 
                        r={DOT_SIZE/2} 
                        className={cn(
                            "fill-muted transition-colors",
                            (isDrawing && path.includes(dot.id)) && "fill-primary/20"
                        )}
                    />
                ))}
                 {/* Highlighted active dots */}
                {dots.map(dot => path.includes(dot.id) && (
                     <circle 
                        key={`active-${dot.id}`} 
                        cx={dot.x} 
                        cy={dot.y} 
                        r={DOT_SIZE/3} 
                        className={cn("fill-primary transition-colors", isError && "fill-destructive")}
                    />
                ))}
            </svg>
        </div>
    );
}

