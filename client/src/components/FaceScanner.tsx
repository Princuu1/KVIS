import { useState, useRef, useEffect } from "react";
import { X, Settings, Camera } from "lucide-react";
import { initializeFaceAPI, detectFaceFromVideo, getFaceDescriptor, startCamera, stopCamera } from "@/lib/faceApi";

interface FaceScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onFaceDetected: (faceDescriptor: Float32Array) => void;
}

export default function FaceScanner({ isOpen, onClose, onFaceDetected }: FaceScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startScanning = async () => {
    try {
      setIsInitializing(true);
      setError(null);

      // Initialize face-api.js
      await initializeFaceAPI();

      // Start camera
      const stream = await startCamera();
      if (!stream) {
        throw new Error("Failed to access camera");
      }

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve;
          }
        });
        
        setIsScanning(true);
        
        // Start face detection loop
        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && streamRef.current) {
            const detection = await detectFaceFromVideo(videoRef.current);
            setFaceDetected(!!detection);
          }
        }, 100);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start face scanning");
    } finally {
      setIsInitializing(false);
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current || !streamRef.current) return;

    try {
      const faceDescriptor = await getFaceDescriptor(videoRef.current);
      if (faceDescriptor) {
        onFaceDetected(faceDescriptor);
        handleClose();
      } else {
        setError("No face detected. Please position your face in the frame.");
      }
    } catch (err) {
      setError("Failed to capture face data");
    }
  };

  const handleClose = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      stopCamera(streamRef.current);
      streamRef.current = null;
    }

    setIsScanning(false);
    setFaceDetected(false);
    setError(null);
    onClose();
  };

  useEffect(() => {
    if (isOpen && !isScanning && !isInitializing) {
      startScanning();
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      if (streamRef.current) {
        stopCamera(streamRef.current);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="face-scanner-overlay active flex flex-col" data-testid="face-scanner-overlay">
      {/* Camera Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <button 
          onClick={handleClose} 
          className="p-2 hover:bg-white/10 rounded-lg"
          data-testid="button-close-scanner"
        >
          <X className="w-6 h-6" />
        </button>
        <h3 className="font-semibold">Face Recognition</h3>
        <button className="p-2 hover:bg-white/10 rounded-lg" data-testid="button-scanner-settings">
          <Settings className="w-6 h-6" />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative">
          {isScanning ? (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-80 h-80 bg-gray-800 rounded-xl border-4 border-white/20 object-cover"
                data-testid="video-camera"
              />
              
              {/* Face detection overlay */}
              {faceDetected && (
                <div 
                  className="absolute inset-0 border-2 border-green-400 rounded-xl animate-pulse"
                  data-testid="face-detected-overlay"
                />
              )}
              
              {/* Corner indicators */}
              <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-white" />
              <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-white" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-white" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-white" />
            </div>
          ) : (
            <div className="w-80 h-80 bg-gray-800 rounded-xl border-4 border-white/20 flex items-center justify-center">
              <div className="text-center text-white">
                {isInitializing ? (
                  <>
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-lg font-medium">Initializing...</p>
                    <p className="text-sm opacity-75 mt-2">Loading face recognition models</p>
                  </>
                ) : error ? (
                  <>
                    <X className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Camera Error</p>
                    <p className="text-sm opacity-75 mt-2">{error}</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-8 h-8" />
                    </div>
                    <p className="text-lg font-medium">Position your face in the frame</p>
                    <p className="text-sm opacity-75 mt-2">Make sure you're in good lighting</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 text-center">
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-200 text-sm" data-testid="text-scanner-error">{error}</p>
          </div>
        )}
        
        <div className="flex items-center justify-center space-x-4 mb-4">
          <button 
            onClick={captureFrame}
            disabled={!isScanning || !faceDetected || isInitializing}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-colors ${
              isScanning && faceDetected && !isInitializing
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-white/20 cursor-not-allowed'
            }`}
            data-testid="button-capture-face"
          >
            <Camera className="w-6 h-6" />
          </button>
        </div>
        
        <p className="text-white text-sm">
          {!isScanning ? 'Preparing camera...' : 
           faceDetected ? 'Face detected! Tap to capture' : 
           'Position your face in the frame'}
        </p>
      </div>
    </div>
  );
}
