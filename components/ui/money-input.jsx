'use client';

import { useState, useEffect } from 'react';

const fmt = (n) => (n === '' || n == null || Number.isNaN(Number(n))) ? '' : Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 });
const parse = (s) => { const d = String(s).replace(/\D/g, ''); return d ? parseInt(d, 10) : null; };

// Campo de plata: texto con puntos de miles (es-AR). Al ser texto no tiene flechitas ni cambia con la
// rueda del mouse (así aparecían $149.999 queriendo $150.000). Entrega un entero o null.
// - onChange(n): en cada tecla.  - onCommit(n): al salir del campo (para guardar en blur).
export default function MoneyInput({ value, onChange, onCommit, className, placeholder = '$', ...rest }) {
  const [text, setText] = useState(fmt(value));
  useEffect(() => { setText(fmt(value)); }, [value]);
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={text}
      placeholder={placeholder}
      className={className}
      onChange={(e) => { const n = parse(e.target.value); setText(fmt(n)); onChange?.(n); }}
      onBlur={() => onCommit?.(parse(text))}
      {...rest}
    />
  );
}
