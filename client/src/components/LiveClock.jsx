import { useEffect, useState } from 'react';

export default function LiveClock({ className = '' }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString('es-ES', { hour12: false });
  const date = now.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={className}>
      <div className="font-mono-tech text-6xl md:text-7xl font-semibold tracking-wider text-cyan-300 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
        {time}
      </div>
      <div className="mt-1 text-slate-400 capitalize tracking-wide">{date}</div>
    </div>
  );
}
