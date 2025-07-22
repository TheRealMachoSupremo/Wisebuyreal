import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, RotateCcw, Check, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface CameraCaptureProps {
  onCapture: (photoBase64: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose, isOpen }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen && !isStreaming && !capturedPhoto) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.playsInline = true;
        videoRef.current.autoplay = true;
        videoRef.current.muted = true;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Camera access denied or not available');
      toast({
        title: 'Camera Error',
        description: 'Could not access camera. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(photoBase64);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const usePhoto = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      onClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedPhoto(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Camera</h3>
            <Button onClick={handleClose} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {capturedPhoto ? (
              <div className="space-y-4">
                <img 
                  src={capturedPhoto} 
                  alt="Captured" 
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="flex gap-2">
                  <Button onClick={retakePhoto} variant="outline" className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retake
                  </Button>
                  <Button onClick={usePhoto} className="flex-1">
                    <Check className="h-4 w-4 mr-2" />
                    Use Photo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className="w-full h-64 object-cover"
                  />
                  {isStreaming && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-4 border-2 border-white/50 rounded-lg" />
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-white rounded-full" />
                      </div>
                    </div>
                  )}
                </div>
                
                {isStreaming && (
                  <Button onClick={takePhoto} className="w-full" size="lg">
                    <Camera className="h-5 w-5 mr-2" />
                    Take Photo
                  </Button>
                )}
                
                {!isStreaming && !error && (
                  <Button onClick={startCamera} className="w-full" size="lg">
                    <Camera className="h-5 w-5 mr-2" />
                    Start Camera
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};