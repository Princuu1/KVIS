import * as faceapi from 'face-api.js';

let isInitialized = false;

export const initializeFaceAPI = async (): Promise<void> => {
  if (isInitialized) return;
  
  try {
    // Load models from CDN
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      faceapi.nets.faceExpressionNet.loadFromUri('/models'),
    ]);
    
    isInitialized = true;
    console.log('Face-api.js models loaded successfully');
  } catch (error) {
    console.error('Error loading face-api.js models:', error);
    throw error;
  }
};

export const detectFaceFromVideo = async (
  video: HTMLVideoElement
): Promise<faceapi.FaceDetection | null> => {
  if (!isInitialized) {
    await initializeFaceAPI();
  }
  
  try {
    const detection = await faceapi.detectSingleFace(
      video,
      new faceapi.TinyFaceDetectorOptions()
    );
    
    return detection;
  } catch (error) {
    console.error('Error detecting face:', error);
    return null;
  }
};

export const getFaceDescriptor = async (
  video: HTMLVideoElement
): Promise<Float32Array | null> => {
  if (!isInitialized) {
    await initializeFaceAPI();
  }
  
  try {
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (detection) {
      return detection.descriptor;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting face descriptor:', error);
    return null;
  }
};

export const compareFaceDescriptors = (
  descriptor1: Float32Array,
  descriptor2: Float32Array,
  threshold: number = 0.6
): boolean => {
  try {
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    return distance < threshold;
  } catch (error) {
    console.error('Error comparing face descriptors:', error);
    return false;
  }
};

export const startCamera = async (): Promise<MediaStream | null> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      }
    });
    
    return stream;
  } catch (error) {
    console.error('Error accessing camera:', error);
    return null;
  }
};

export const stopCamera = (stream: MediaStream): void => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
};
