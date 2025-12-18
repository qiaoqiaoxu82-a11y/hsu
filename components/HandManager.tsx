import React, { useEffect, useRef, useState } from 'react';
import { TreeMorphState } from '../types';

declare global {
  interface Window {
    FilesetResolver: any;
    HandLandmarker: any;
  }
}

interface HandManagerProps {
  onModeChange: (mode: TreeMorphState) => void;
  onCameraStatusChange: (active: boolean) => void;
  onLoadComplete: () => void;
  retryTrigger: number;
}

const HandManager: React.FC<HandManagerProps> = ({ 
  onModeChange, 
  onCameraStatusChange,
  onLoadComplete,
  retryTrigger
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visionLoaded, setVisionLoaded] = useState(false);
  const handLandmarkerRef = useRef<any>(null);
  const requestRef = useRef<number>();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/vision_bundle.js";
    script.crossOrigin = "anonymous";
    script.async = true;
    
    script.onload = async () => {
      try {
        const { FilesetResolver, HandLandmarker } = window as any;
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        setVisionLoaded(true);
        onLoadComplete();
      } catch (err) {
        console.error("Failed to load MediaPipe:", err);
        onLoadComplete();
      }
    };
    
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!visionLoaded) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', predictWebcam);
          onCameraStatusChange(true);
        }
      } catch (err) {
        console.warn("Camera access denied or unavailable", err);
        onCameraStatusChange(false);
      }
    };

    startCamera();

    return () => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visionLoaded, retryTrigger]);

  const predictWebcam = () => {
    const video = videoRef.current;
    const handLandmarker = handLandmarkerRef.current;

    if (video && handLandmarker) {
      const nowInMs = Date.now();
      const results = handLandmarker.detectForVideo(video, nowInMs);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        
        const wristY = landmarks[0].y;
        const indexTipY = landmarks[8].y;
        const middleTipY = landmarks[12].y;
        const ringTipY = landmarks[16].y;
        
        const indexPipY = landmarks[6].y;
        const middlePipY = landmarks[10].y;
        const ringPipY = landmarks[14].y;
        
        const isIndexOpen = indexTipY < indexPipY;
        const isMiddleOpen = middleTipY < middlePipY;
        const isRingOpen = ringTipY < ringPipY;

        if (isIndexOpen && isMiddleOpen && isRingOpen) {
          onModeChange(TreeMorphState.SCATTERED);
        } else {
          onModeChange(TreeMorphState.TREE_SHAPE);
        }
      } else {
        onModeChange(TreeMorphState.TREE_SHAPE);
      }
    }
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="hidden">
      <video ref={videoRef} autoPlay playsInline muted style={{ width: 640, height: 480 }} />
    </div>
  );
};

export default HandManager;