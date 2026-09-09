import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import LiveClock from '../components/LiveClock.jsx';
import { loadFaceModels, detectSingleFace, findBestMatch } from '../lib/face.js';
import { api } from '../lib/api.js';

const LABEL_META = {
  checkin: { icon: '🟢', text: 'Ingreso registrado', color: 'from-emerald-400 to-teal-400' },
  lunch_out: { icon: '🍽️', text: 'Salida a almorzar', color: 'from-amber-400 to-orange-400' },
  lunch_in: { icon: '↩️', text: 'Regreso de almuerzo', color: 'from-sky-400 to-cyan-400' },
  checkout: { icon: '🌙', text: 'Salida registrada', color: 'from-violet-400 to-fuchsia-400' },
};

function drawScanBox(ctx, box, color) {
  const { x, y, width, height } = box;
  const len = Math.min(width, height) * 0.25;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  const corners = [
    [x, y, 1, 1],
    [x + width, y, -1, 1],
    [x, y + height, 1, -1],
    [x + width, y + height, -1, -1],
  ];
  corners.forEach(([cx, cy, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy + len * dy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + len * dx, cy);
    ctx.stroke();
  });
  ctx.shadowBlur = 0;
}

export default function KioskPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const employeesRef = useRef([]);
  const cooldownRef = useRef(new Map());
  const busyRef = useRef(false);
  const rafRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('scanning');
  const [result, setResult] = useState(null);
  const [faceCount, setFaceCount] = useState(0);

  const refreshEmployees = useCallback(async () => {
    try {
      employeesRef.current = await api.getFaceData();
    } catch {
      // se reintenta en el siguiente ciclo automatico
    }
  }, []);

  const handlePunch = useCallback(async (employee) => {
    try {
      const res = await api.punch(employee.id);
      setResult({ employee: employee.name, ...res });
      setStatus('success');
    } catch (err) {
      setResult({ employee: employee.name, error: err.message });
      setStatus(err.message?.includes('completaste') ? 'done' : 'error');
    } finally {
      cooldownRef.current.set(employee.id, Date.now() + 15000);
      setTimeout(() => {
        setStatus('scanning');
        setResult(null);
        busyRef.current = false;
      }, 4500);
    }
  }, []);

  useEffect(() => {
    let stream;
    let cancelled = false;

    (async () => {
      try {
        await loadFaceModels();
        await refreshEmployees();
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
      } catch (err) {
        setError(err.message || 'No se pudo acceder a la camara');
      }
    })();

    const refreshInterval = setInterval(refreshEmployees, 60000);

    return () => {
      cancelled = true;
      clearInterval(refreshInterval);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [refreshEmployees]);

  useEffect(() => {
    if (!ready) return;

    async function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState >= 2) {
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!busyRef.current) {
          try {
            const detection = await detectSingleFace(video);
            setFaceCount(detection ? 1 : 0);
            if (detection) {
              const match = findBestMatch(detection.descriptor, employeesRef.current);
              drawScanBox(ctx, detection.detection.box, match ? '#22d3ee' : '#f87171');

              if (match) {
                const until = cooldownRef.current.get(match.employee.id) || 0;
                if (Date.now() > until) {
                  busyRef.current = true;
                  handlePunch(match.employee);
                }
              }
            }
          } catch {
            // se ignoran errores puntuales de un frame de deteccion
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [ready, handlePunch]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05070d] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.06)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[700px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />

      <Link
        to="/admin/login"
        className="absolute right-4 top-4 z-20 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-400 backdrop-blur transition hover:border-cyan-400/40 hover:text-cyan-300"
      >
        Acceso Administrador
      </Link>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-8 px-4 py-10">
        <div className="text-center">
          <p className="font-mono-tech text-xs uppercase tracking-[0.4em] text-cyan-400/80">
            Sistema de Control de Asistencia · FaceID
          </p>
          <LiveClock className="mt-2" />
        </div>

        <div className="relative">
          <div
            className={`relative aspect-[4/3] w-[min(90vw,560px)] overflow-hidden rounded-3xl border-2 bg-black shadow-[0_0_60px_rgba(34,211,238,0.15)] transition-colors duration-500 ${
              status === 'success'
                ? 'border-emerald-400/70'
                : status === 'error' || status === 'done'
                ? 'border-rose-400/60'
                : 'border-cyan-400/40'
            }`}
          >
            <video ref={videoRef} muted playsInline className="h-full w-full -scale-x-100 object-cover" />
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full -scale-x-100" />

            {!ready && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-slate-300">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                <p className="font-mono-tech text-sm">Inicializando IA de reconocimiento facial…</p>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/90 p-6 text-center text-rose-300">
                <p className="text-lg">⚠️ {error}</p>
                <p className="text-sm text-slate-400">Habilita el acceso a la camara y recarga la pagina.</p>
              </div>
            )}

            {ready && !busyRef.current && (
              <div className="absolute bottom-0 left-0 right-0 h-1 animate-[scan_2.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            )}

            <AnimatePresence>
              {status === 'success' && result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 text-center backdrop-blur"
                >
                  <div className="text-5xl">{LABEL_META[result.type]?.icon}</div>
                  <p className="text-2xl font-semibold text-emerald-300">¡Hola, {result.employee}!</p>
                  <p
                    className={`bg-gradient-to-r bg-clip-text text-lg font-medium text-transparent ${LABEL_META[result.type]?.color}`}
                  >
                    {LABEL_META[result.type]?.text}
                  </p>
                  <p className="font-mono-tech text-sm text-slate-400">
                    {new Date(result.timestamp).toLocaleTimeString('es-ES', { hour12: false })}
                  </p>
                </motion.div>
              )}

              {(status === 'error' || status === 'done') && result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 text-center backdrop-blur"
                >
                  <div className="text-5xl">✋</div>
                  <p className="text-xl font-semibold text-rose-300">{result.employee}</p>
                  <p className="text-sm text-slate-400">{result.error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="text-center">
          <p className="font-mono-tech text-sm text-slate-400">
            {ready
              ? faceCount
                ? 'Rostro detectado — verificando identidad…'
                : 'Colócate frente a la cámara para marcar tu horario'
              : 'Preparando cámara…'}
          </p>
          <div className="mt-3 flex justify-center gap-4 text-xs text-slate-500">
            <span>🟢 Ingreso</span>
            <span>🍽️ Salida almuerzo</span>
            <span>↩️ Regreso almuerzo</span>
            <span>🌙 Salida</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-260px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
