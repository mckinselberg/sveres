import { useState, useEffect, useRef } from 'react';

export function useDraggable(handleRef) {
    const [position, setPosition] = useState({
        x: 0,
        y: 0,
    });
    const isDraggingRef = useRef(false);
    const offsetRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseDown = (e) => {
            isDraggingRef.current = true;
            offsetRef.current = {
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            };
        };

        const handleMouseMove = (e) => {
            if (!isDraggingRef.current) return;
            setPosition({
                x: e.clientX - offsetRef.current.x,
                y: e.clientY - offsetRef.current.y,
            });
        };

        const handleMouseUp = () => {
            isDraggingRef.current = false;
        };

        const handleElement = handleRef.current;
        if (handleElement) {
            handleElement.addEventListener('mousedown', handleMouseDown);
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            if (handleElement) {
                handleElement.removeEventListener('mousedown', handleMouseDown);
            }
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleRef, position.x, position.y]);

    return position;
}
