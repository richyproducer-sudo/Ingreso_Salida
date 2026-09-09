import { useEffect, useRef, useState } from 'react';
import { loadFaceModels, detectSingleFace } from '../lib/face.js';

export default function FaceCaptureModal({ title, onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const descriptorRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [hasFace, setHasFace] = useState(false);
  const [error, setError] = useState(null);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    let stream;
    let cancelled = false;

    (async () => {
      try {
        await loadFaceModels();
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 } });
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

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

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
        try {
          const detection = await detectSingleFace(video);
          if (detection) {
            descriptorRef.current = Array.from(detection.descriptor);
            setHasFace(true);
            const { x, y, width, height } = detection.detection.box;
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
          } else {
            descriptorRef.current = null;
            setHasFace(false);
          }
        } catch {
          // ignorar errores puntuales
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [ready]);

  function capture() {
    if (!descriptorRef.current) return;
    setCapturing(true);
    const video = videoRef.current;
    const snap = document.createElement('canvas');
    snap.width = video.videoWidth;
    snap.height = video.videoHeight;
    snap.getContext('2d').drawImage(video, 0, 0);
    const photo = snap.toDataURL('image/jpeg', 0.8);
    onCapture(descriptorRef.current, photo);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0d16] p-6 text-white">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10 bg-black">
          <video ref={videoRef} muted playsInline className="h-full w-full -scale-x-100 object-cover" />
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full -scale-x-100" />
          {!ready && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
              Iniciando cámara…
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-rose-300">
              {error}
            </div>
          )}
        </div>

        <p className="mt-3 text-center text-sm text-slate-400">
          {hasFace ? '✅ Rostro detectado, listo para capturar' : 'Centra tu rostro frente a la cámara'}
        </p>

        <button
          onClick={capture}
          disabled={!hasFace || capturing}
          className="mt-4 w-full rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 py-2.5 font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {capturing ? 'Guardando…' : 'Capturar rostro'}
        </button>
      </div>
    </div>
  );
}
