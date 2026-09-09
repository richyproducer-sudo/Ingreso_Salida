import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';
let modelsLoaded = false;

export async function loadFaceModels() {
  if (modelsLoaded) return;
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
}

const DETECTOR_OPTIONS = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });

export async function detectSingleFace(video) {
  return faceapi
    .detectSingleFace(video, DETECTOR_OPTIONS)
    .withFaceLandmarks()
    .withFaceDescriptor()
    .withFaceExpressions();
}

export async function detectAllFaces(video) {
  return faceapi.detectAllFaces(video, DETECTOR_OPTIONS).withFaceLandmarks().withFaceDescriptor();
}

// Distancia euclidiana entre descriptores: menor a ~0.5 se considera la misma persona
export function findBestMatch(descriptor, employees, threshold = 0.5) {
  let best = null;
  let bestDist = Infinity;
  for (const emp of employees) {
    const dist = faceapi.euclideanDistance(descriptor, emp.descriptor);
    if (dist < bestDist) {
      bestDist = dist;
      best = emp;
    }
  }
  if (best && bestDist <= threshold) return { employee: best, distance: bestDist };
  return null;
}

export { faceapi };
