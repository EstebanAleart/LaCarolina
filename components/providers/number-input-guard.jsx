'use client';

import { useEffect } from 'react';

// Evita que un <input type="number"> cambie de valor solo, por la rueda del mouse o las
// flechas ↑↓ del teclado (así se cargaban $149.999 queriendo $150.000). Las flechitas
// visuales se ocultan en app/globals.css. Aplica a todos los inputs numéricos de la app.
export default function NumberInputGuard() {
  useEffect(() => {
    const esNumero = (el) => el instanceof HTMLInputElement && el.type === 'number';
    const onWheel = (e) => { if (esNumero(e.target) && document.activeElement === e.target) e.preventDefault(); };
    const onKeyDown = (e) => { if (esNumero(e.target) && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) e.preventDefault(); };
    document.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('wheel', onWheel);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);
  return null;
}
