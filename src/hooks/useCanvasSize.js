import { useEffect, useState } from 'react';

export default function useCanvasSize() {
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    let raf = null;
    const update = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setSize({ w: window.innerWidth, h: window.innerHeight });
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return size; // { w, h }
}
