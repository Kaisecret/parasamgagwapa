import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Download, RefreshCcw, AlertCircle, Upload, LayoutGrid, Columns, Check, Loader2, Save } from 'lucide-react';

type PhotoStep = 'template-selection' | 'idle' | 'camera-ready' | 'counting' | 'review' | 'upload-fallback';
type TemplateType = 'strip' | 'grid';

const PHOTO_COUNT = 3;
const COUNTDOWN_SECONDS = 3;

interface PhotoBoothProps {
  onSave?: (image: string) => Promise<boolean>;
}

export default function PhotoBooth({ onSave }: PhotoBoothProps) {
  const [step, setStep] = useState<PhotoStep>('template-selection');
  const [template, setTemplate] = useState<TemplateType>('strip');
  const [images, setImages] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Saving states
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasAutoSaved, setHasAutoSaved] = useState(false);
  
  // Use state for stream to ensure UI updates when stream is ready
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);

  // Beauty filter for video and context
  const filterStyle = { filter: 'contrast(1.05) brightness(1.05) saturate(1.1) sepia(0.1)' };

  const handleTemplateSelect = (selected: TemplateType) => {
    setTemplate(selected);
    startCamera();
  };

  // Initialize camera
  const startCamera = async () => {
    try {
      setError(null);
      setStep('idle'); // Mounts the video element
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      });
      
      setMediaStream(stream);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Unable to access camera. You can upload photos instead!");
      setStep('upload-fallback');
    }
  };

  // Attach stream to video element when both are ready
  useEffect(() => {
    if (mediaStream && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = mediaStream;
      // Attempt to play immediately
      videoRef.current.play().catch((e) => console.log("Play interrupted or failed", e));
    }
  }, [mediaStream, step]);

  const handleVideoCanPlay = () => {
    // Only transition if we are waiting for it
    if (step === 'idle') {
      setStep('camera-ready');
    }
  };

  // Cleanup camera on unmount or reset
  useEffect(() => {
    return () => {
      // Only stop tracks if we are completely unmounting or resetting to selection
      if (step === 'template-selection' && mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [step, mediaStream]);

  // Cleanup on unmount component
  useEffect(() => {
    return () => {
       if (mediaStream) {
         mediaStream.getTracks().forEach(track => track.stop());
       }
    }
  }, []);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Mirror the image to match preview
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      
      // Apply the beauty filter to the captured image
      context.filter = 'contrast(1.05) brightness(1.05) saturate(1.1) sepia(0.1)';
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Reset transform
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.filter = 'none';

      const imageUrl = canvas.toDataURL('image/jpeg', 0.95);
      setImages(prev => [...prev, imageUrl]);
      
      // Flash effect
      setFlash(true);
      setTimeout(() => setFlash(false), 150);
    }
  }, []);

  // Handle the sequence of photos
  const startPhotoSequence = () => {
    setStep('counting');
    setIsSaved(false);
    setHasAutoSaved(false);
    let photosTaken = 0;

    const runCountdown = () => {
      let count = COUNTDOWN_SECONDS;
      setCountdown(count);
      
      const timer = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
        } else {
          clearInterval(timer);
          setCountdown(null);
          takePhoto();
          photosTaken++;
          
          if (photosTaken < PHOTO_COUNT) {
            setTimeout(runCountdown, 1000);
          } else {
            setTimeout(() => {
               setStep('review');
               if (mediaStream) {
                 mediaStream.getTracks().forEach(track => track.stop());
               }
            }, 500);
          }
        }
      }, 1000);
    };

    runCountdown();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 3);
      if (files.length < 3) {
        alert("Please select at least 3 photos!");
        return;
      }

      const readers = files.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then(results => {
        setImages(results);
        setIsSaved(false);
        setHasAutoSaved(false);
        setStep('review');
      });
    }
  };

  const downloadStrip = () => {
    if (!resultCanvasRef.current) return;
    const link = document.createElement('a');
    link.download = `besties-valentine-${template}.png`;
    link.href = resultCanvasRef.current.toDataURL('image/png');
    link.click();
  };

  // Logic to handle saving (called automatically or via retry)
  const performSave = async (dataUrl: string) => {
    if (!onSave || isSaving || isSaved) return;
    
    setIsSaving(true);
    const success = await onSave(dataUrl);
    setIsSaving(false);
    
    if (success) {
      setIsSaved(true);
    }
  };

  const retrySave = () => {
    if (resultCanvasRef.current) {
        const dataUrl = resultCanvasRef.current.toDataURL('image/png');
        performSave(dataUrl);
    }
  };

  const restart = () => {
    setImages([]);
    setMediaStream(null);
    setIsSaved(false);
    setIsSaving(false);
    setHasAutoSaved(false);
    setStep('template-selection');
  };

  // Render the final image based on template and Auto Save
  useEffect(() => {
    if (step === 'review' && images.length === 3 && resultCanvasRef.current) {
      const canvas = resultCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const drawTemplate = async () => {
        // Wait for fonts, but max 500ms so we don't hang forever
        try {
           await Promise.race([
             document.fonts.ready,
             new Promise(resolve => setTimeout(resolve, 500))
           ]);
        } catch (e) {
           console.log("Font loading timeout");
        }

        // ... Drawing Logic ...
        if (template === 'strip') {
            const photoWidth = 400;
            const photoHeight = 300; 
            const padding = 20;
            const headerHeight = 70;
            const footerHeight = 90;
            
            const totalWidth = photoWidth + (padding * 2);
            const totalHeight = headerHeight + (photoHeight * 3) + (padding * 3) + footerHeight;

            canvas.width = totalWidth;
            canvas.height = totalHeight;

            ctx.fillStyle = '#FFF0F3';
            ctx.fillRect(0, 0, totalWidth, totalHeight);
            ctx.strokeStyle = '#FF8FA3';
            ctx.lineWidth = 4;
            ctx.strokeRect(10, 10, totalWidth - 20, totalHeight - 20);

            ctx.fillStyle = '#FF4D6D';
            ctx.font = '32px "Pacifico", cursive';
            ctx.textAlign = 'center';
            ctx.fillText("Happy Valentine's!", totalWidth / 2, 50);

            for (let i = 0; i < images.length; i++) {
               const src = images[i];
               const img = new Image();
               img.src = src;
               await img.decode();
               
               const aspect = img.width / img.height;
               const targetAspect = photoWidth / photoHeight;
               let sx, sy, sWidth, sHeight;
               if (aspect > targetAspect) {
                 sHeight = img.height;
                 sWidth = img.height * targetAspect;
                 sx = (img.width - sWidth) / 2;
                 sy = 0;
               } else {
                 sWidth = img.width;
                 sHeight = img.width / targetAspect;
                 sx = 0;
                 sy = (img.height - sHeight) / 2;
               }
               const yPos = headerHeight + padding + (i * (photoHeight + padding));
               ctx.fillStyle = '#FFFFFF';
               ctx.fillRect(padding, yPos, photoWidth, photoHeight);
               ctx.drawImage(img, sx, sy, sWidth, sHeight, padding + 5, yPos + 5, photoWidth - 10, photoHeight - 10);
            }
            
            ctx.fillStyle = '#FF4D6D';
            ctx.font = 'bold 22px "Poppins", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("Happy Valentine's 2026", totalWidth / 2, totalHeight - 50);
            ctx.font = '16px "Poppins", sans-serif';
            ctx.fillStyle = '#888';
            ctx.fillText("Gwapa & Gwapo", totalWidth / 2, totalHeight - 25);

        } else {
            const boxSize = 350;
            const gap = 15;
            const padding = 20;
            const totalWidth = (boxSize * 2) + gap + (padding * 2);
            const totalHeight = (boxSize * 2) + gap + (padding * 2);

            canvas.width = totalWidth;
            canvas.height = totalHeight;

            ctx.fillStyle = '#FF4D6D';
            ctx.fillRect(0, 0, totalWidth, totalHeight);
            ctx.fillStyle = '#FFF0F3';
            ctx.fillRect(10, 10, totalWidth - 20, totalHeight - 20);

            const positions = [
               { x: padding, y: padding },
               { x: padding + boxSize + gap, y: padding },
               { x: padding, y: padding + boxSize + gap },
            ];

            for (let i = 0; i < images.length; i++) {
               const src = images[i];
               const img = new Image();
               img.src = src;
               await img.decode();

               const sSize = Math.min(img.width, img.height);
               const sx = (img.width - sSize) / 2;
               const sy = (img.height - sSize) / 2;
               const { x, y } = positions[i];
               
               ctx.fillStyle = '#FFFFFF';
               ctx.shadowColor = 'rgba(0,0,0,0.1)';
               ctx.shadowBlur = 5;
               ctx.fillRect(x, y, boxSize, boxSize);
               ctx.shadowBlur = 0;
               ctx.drawImage(img, sx, sy, sSize, sSize, x + 8, y + 8, boxSize - 16, boxSize - 16);
            }

            const x = padding + boxSize + gap;
            const y = padding + boxSize + gap;
            ctx.fillStyle = '#FFCCD5';
            ctx.fillRect(x, y, boxSize, boxSize);
            ctx.fillStyle = '#FF4D6D';
            ctx.textAlign = 'center';
            ctx.font = '42px "Pacifico", cursive';
            ctx.fillText("Happy", x + boxSize/2, y + boxSize/3);
            ctx.fillText("Valentine's", x + boxSize/2, y + boxSize/2 + 10);
            ctx.font = 'bold 32px "Poppins", sans-serif';
            ctx.fillStyle = '#C04545';
            ctx.fillText("2026", x + boxSize/2, y + boxSize/2 + 60);
            ctx.font = '18px "Poppins", sans-serif';
            ctx.fillStyle = '#888';
            ctx.fillText("Besties Forever", x + boxSize/2, y + boxSize - 30);
        }

        // TRIGGER AUTO SAVE
        if (onSave && !hasAutoSaved && !isSaved) {
            setHasAutoSaved(true);
            const dataUrl = canvas.toDataURL('image/png');
            // Slight delay to allow render to show before save logic
            setTimeout(() => {
                performSave(dataUrl);
            }, 100);
        }
      };
      
      drawTemplate();
    }
  }, [step, images, template, hasAutoSaved, isSaved]); // Intentionally omitting performSave/onSave to avoid re-loops

  return (
    <div className="flex flex-col items-center w-full min-h-[400px]">
      <canvas ref={canvasRef} className="hidden" />

      {step === 'template-selection' && (
        <div className="flex flex-col items-center justify-center w-full h-full py-8 animate-in fade-in zoom-in">
           <h3 className="text-xl font-heading text-valentine-red mb-6">Choose a Layout</h3>
           <div className="flex gap-6">
              <button 
                onClick={() => handleTemplateSelect('strip')}
                className="flex flex-col items-center gap-3 p-6 bg-white border-2 border-valentine-pale rounded-2xl shadow-sm hover:shadow-md hover:border-valentine-pink hover:bg-valentine-bg transition-all w-36"
              >
                <Columns className="w-10 h-10 text-valentine-red" />
                <span className="font-semibold text-gray-700">Strip</span>
              </button>

              <button 
                onClick={() => handleTemplateSelect('grid')}
                className="flex flex-col items-center gap-3 p-6 bg-white border-2 border-valentine-pale rounded-2xl shadow-sm hover:shadow-md hover:border-valentine-pink hover:bg-valentine-bg transition-all w-36"
              >
                <LayoutGrid className="w-10 h-10 text-valentine-red" />
                <span className="font-semibold text-gray-700">Grid</span>
              </button>
           </div>
        </div>
      )}

      {/* Camera View */}
      {(step === 'idle' || step === 'camera-ready' || step === 'counting') && (
        <div className="relative w-full max-w-[400px] aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-xl mb-4 border-4 border-white">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            onCanPlay={handleVideoCanPlay}
            style={filterStyle} 
            className="w-full h-full object-cover transform -scale-x-100"
          />
          
          {step === 'idle' && (
             <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white">
                <div className="w-10 h-10 border-4 border-valentine-red border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-valentine-red font-medium">Starting Camera...</p>
             </div>
          )}

          {step !== 'idle' && (
            <div className="absolute inset-0 border-4 border-white/20 rounded-xl pointer-events-none"></div>
          )}

          {flash && <div className="absolute inset-0 bg-white animate-out fade-out duration-300 z-30"></div>}

          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] z-20">
              <span className="text-9xl font-heading text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] animate-pulse">
                {countdown}
              </span>
            </div>
          )}

          <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
            {step === 'camera-ready' && (
              <button 
                onClick={startPhotoSequence}
                className="group relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-valentine-pink to-valentine-red rounded-full opacity-70 blur group-hover:opacity-100 transition duration-200"></div>
                <div className="relative w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-transparent bg-clip-padding">
                   <div className="w-12 h-12 bg-valentine-red rounded-full hover:scale-95 transition-transform"></div>
                </div>
              </button>
            )}
          </div>
          
          <div className="absolute top-4 right-4 flex gap-2 z-20 bg-black/20 p-2 rounded-full backdrop-blur-sm">
            {[...Array(PHOTO_COUNT)].map((_, i) => (
              <div 
                key={i} 
                className={`w-2.5 h-2.5 rounded-full transition-colors ${i < images.length ? 'bg-valentine-red' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </div>
      )}

      {step === 'upload-fallback' && (
        <div className="text-center py-8 w-full">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-6 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <label className="block w-full cursor-pointer">
             <div className="border-2 border-dashed border-valentine-pink rounded-xl p-8 hover:bg-valentine-bg transition-colors">
                <Upload className="w-12 h-12 text-valentine-pink mx-auto mb-2" />
                <span className="font-semibold text-valentine-red">Select 3 Photos</span>
                <p className="text-xs text-gray-500 mt-1">JPEG, PNG</p>
             </div>
             <input 
               type="file" 
               multiple 
               accept="image/*" 
               onChange={handleFileUpload} 
               className="hidden" 
             />
          </label>
        </div>
      )}

      {step === 'review' && (
        <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-500 w-full">
          <p className="text-valentine-red font-heading text-xl mb-4">Your Memory is Ready!</p>
          <div className="bg-white p-2 rounded-lg shadow-xl mb-6 max-h-[50vh] overflow-y-auto custom-scrollbar border border-gray-100">
            <canvas ref={resultCanvasRef} className="max-w-full h-auto rounded shadow-sm" />
          </div>
          
          <div className="flex flex-col gap-3 w-full items-center">
             <div className="flex flex-wrap gap-4 w-full justify-center">
                <button 
                  onClick={restart}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-full font-medium hover:bg-gray-50 transition-colors shadow-sm text-sm"
                >
                  <RefreshCcw className="w-4 h-4" />
                  New
                </button>
                
                {/* Status Indicator / Retry Button */}
                {onSave && (
                   <>
                    {isSaving ? (
                        <div className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 text-gray-500 border border-gray-100 rounded-full text-sm font-medium">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </div>
                    ) : isSaved ? (
                        <div className="flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-600 border border-green-100 rounded-full text-sm font-medium">
                          <Check className="w-4 h-4" />
                          Saved!
                        </div>
                    ) : (hasAutoSaved && !isSaving) ? (
                        <button 
                          onClick={retrySave}
                          className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 rounded-full font-medium transition-colors text-sm"
                        >
                          <Save className="w-4 h-4" />
                          Retry Save
                        </button>
                    ) : null}
                   </>
                )}

                <button 
                  onClick={downloadStrip}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-valentine-red to-pink-500 text-white rounded-full font-medium shadow-md hover:shadow-lg hover:scale-105 transition-all text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}