import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Upload, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface PhotoUploadProps {
  onPhotoCapture: (photoUrl: string) => void;
  currentPhoto?: string;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({ onPhotoCapture, currentPhoto }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCapturing(true);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: 'Camera Error',
        description: 'Could not access camera. Please use file upload instead.',
        variant: 'destructive',
      });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoUrl = canvas.toDataURL('image/jpeg', 0.9);
        onPhotoCapture(photoUrl);
        stopCamera();
        
        toast({
          title: 'Photo Captured',
          description: 'Photo has been saved successfully.',
        });
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
    setIsCapturing(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onPhotoCapture(result);
        toast({
          title: 'Photo Uploaded',
          description: 'Photo has been saved successfully.',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    onPhotoCapture('');
  };

  return (
    <div className="space-y-4">
      {currentPhoto ? (
        <Card className="p-4">
          <div className="relative">
            <img src={currentPhoto} alt="Item" className="w-full h-48 object-cover rounded" />
            <Button
              onClick={removePhoto}
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {isCapturing ? (
            <Card className="p-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline
                  muted
                  className="w-full h-64 object-cover" 
                />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-4 border-2 border-white/50 rounded-lg" />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-8 h-8 border-2 border-white rounded-full" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={capturePhoto} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  size="lg"
                  id="capture-photo-button"
                  data-testid="capture-photo-button"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Take Photo
                </Button>
                <Button 
                  onClick={stopCamera} 
                  variant="outline"
                  size="lg"
                  id="cancel-camera-button"
                  data-testid="cancel-camera-button"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={startCamera} 
                variant="outline" 
                className="flex-1"
                size="lg"
                id="start-camera-button"
                data-testid="start-camera-button"
              >
                <Camera className="h-4 w-4 mr-2" />
                Open Camera
              </Button>
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                variant="outline" 
                className="flex-1"
                size="lg"
                id="upload-file-button"
                data-testid="upload-file-button"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </div>
          )}
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
        id="file-input"
        data-testid="file-input"
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};