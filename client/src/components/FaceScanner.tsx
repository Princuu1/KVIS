import React, { useEffect, useRef, useState } from "react";
import { X, Settings, Camera } from "lucide-react";
import { initializeFaceAPI, detectFaceFromVideo, getFaceDescriptor, startCamera, stopCamera } from "@/lib/faceApi";
import * as faceapi from "face-api.js";

interface FaceScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onFaceDetected: (faceDescriptor: Float32Array) => void;
}

export default function FaceScanner({ isOpen, onClose, onFaceDetected }: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const [isInitializing, setIsInitializing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start camera + models
  const start = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      console.log("[FaceScanner] initializing face-api models...");
      await initializeFaceAPI();
      console.log("[FaceScanner] face-api models ready");

      const stream = await startCamera();
      if (!stream) throw new Error("Failed to get camera stream");
      streamRef.current = stream;

      if (!videoRef.current) throw new Error("Missing video element");
      videoRef.current.srcObject = stream;

      // ensure video plays
      await new Promise<void>((resolve, reject) => {
        const v = videoRef.current!;
        v.onloadedmetadata = () => {
          // important: play() may return a promise
          v.play().then(() => {
            resolve();
          }).catch((err) => {
            console.warn("[FaceScanner] video.play() failed:", err);
            // try still to resolve so detection loop may run
            resolve();
          });
        };
        // fallback timeout
        setTimeout(() => {
          resolve();
        }, 1500);
      });

      setIsScanning(true);
      setFaceDetected(false);
      startDetectionLoop();
    } catch (err: any) {
      console.error("[FaceScanner] start error:", err);
      setError(err?.message || "Failed to start camera");
      cleanup();
    } finally {
      setIsInitializing(false);
    }
  };

  // Clean up everything
  const cleanup = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      stopCamera(streamRef.current);
      streamRef.current = null;
    }
    setIsScanning(false);
    setFaceDetected(false);
  };

  // Detection loop using requestAnimationFrame
  const startDetectionLoop = () => {
    const run = async () => {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || video.readyState < 2) {
          // not ready yet — skip
          rafRef.current = requestAnimationFrame(run);
          return;
        }

        // draw video to canvas for debug (optional) and set canvas size
        if (canvas) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Mirror video horizontally for user-friendly preview:
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
            ctx.restore();
          }
        }

        // run face detection (single face)
        // Use the detectFaceFromVideo helper (it uses tinyDetector by default)
        const detection = await detectFaceFromVideo(video);
        if (detection) {
          setFaceDetected(true);
          // draw bbox if canvas exists
          if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.strokeStyle = "#00FF00";
              ctx.lineWidth = 2;
              const box = detection.box;
              // map box coordinates to mirrored canvas (we mirrored the video)
              const x = canvas.width - box.x - box.width;
              ctx.strokeRect(x, box.y, box.width, box.height);
            }
          }
        } else {
          setFaceDetected(false);
        }
      } catch (err) {
        console.error("[FaceScanner] detection loop error:", err);
        // don't stop loop — log and continue
      }
      rafRef.current = requestAnimationFrame(run);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(run);
  };

  // Capture final descriptor
  const handleCapture = async () => {
    try {
      if (!videoRef.current) throw new Error("No video available");
      const descriptor = await getFaceDescriptor(videoRef.current);
      if (!descriptor) {
        setError("No face detected in capture. Reposition and try again.");
        setFaceDetected(false);
        return;
      }
      // success
      onFaceDetected(descriptor);
      cleanup();
    } catch (err: any) {
      console.error("[FaceScanner] capture error:", err);
      setError(err?.message || "Capture failed");
    }
  };

  // Open / close effects
  useEffect(() => {
    if (isOpen) start();
    if (!isOpen) cleanup();
    // cleanup on unmount
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[#0f1724] rounded-lg overflow-hidden w-[420px] max-w-full">
        <div className="flex items-center justify-between p-4 text-white">
          <button onClick={() => { cleanup(); onClose(); }} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-6 h-6" />
          </button>
          <h3 className="font-semibold">Face Recognition</h3>
          <button className="p-2 hover:bg-white/10 rounded-lg">
            <Settings className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 flex items-center justify-center">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-80 h-80 bg-gray-800 rounded-xl object-cover"
              style={{ display: isScanning ? "block" : "none" }}
            />
            {/* Canvas overlay: we mirror draw video there and draw detection box */}
            <canvas
              ref={canvasRef}
              className="w-80 h-80 absolute top-0 left-0 pointer-events-none"
              style={{ borderRadius: 12 }}
            />
            {!isScanning && (
              <div className="w-80 h-80 bg-gray-800 rounded-xl border-4 border-white/10 flex items-center justify-center">
                {isInitializing ? (
                  <div className="text-white text-center">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-lg">Initializing...</p>
                  </div>
                ) : error ? (
                  <div className="text-white text-center">
                    <p className="text-lg">Camera Error</p>
                    <p className="text-sm mt-2 text-red-300">{error}</p>
                  </div>
                ) : (
                  <div className="text-white text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-8 h-8" />
                    </div>
                    <p className="text-lg">Position your face in the frame</p>
                    <p className="text-sm opacity-75 mt-2">Make sure you're in good lighting</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 text-center">
          {error && <div className="mb-2 text-red-300">{error}</div>}
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={handleCapture}
              disabled={!isScanning || !faceDetected || isInitializing}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white ${isScanning && faceDetected && !isInitializing ? 'bg-green-500 hover:bg-green-600' : 'bg-white/10 cursor-not-allowed'}`}
            >
              <Camera className="w-6 h-6" />
            </button>
          </div>
          <p className="text-white text-sm">
            {!isScanning ? 'Preparing camera...' : faceDetected ? 'Face detected — tap to capture' : 'Position your face in the frame'}
          </p>
        </div>
      </div>
    </div>
  );
}
