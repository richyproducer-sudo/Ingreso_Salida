// Descarga los pesos de los modelos de IA de face-api.js (deteccion, landmarks y reconocimiento facial)
// para que el reconocimiento funcione 100% local, sin depender de un CDN en tiempo de ejecucion.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'client', 'public', 'models');
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

const FILES = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1',
];

async function download(file) {
  const url = `${BASE_URL}/${file}`;
  const dest = path.join(OUT_DIR, file);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fallo al descargar ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  console.log(`Descargado ${file} (${(buf.length / 1024).toFixed(1)} KB)`);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const file of FILES) {
  await download(file);
}

console.log('Modelos de reconocimiento facial listos en client/public/models');
