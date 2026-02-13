import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Heart, Camera, Mail, X, Upload, Images } from 'lucide-react';
import PhotoBooth from './components/PhotoBooth';
import MessageCard from './components/MessageCard';
import Envelope from './components/Envelope';
import Album from './components/Album';
import { supabase } from './supabaseClient';

export default function App() {
  const [showEnvelope, setShowEnvelope] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showPhotoBooth, setShowPhotoBooth] = useState(false);
  const [showAlbum, setShowAlbum] = useState(false);
  
  // State to store generated photo strips/grids
  const [albumImages, setAlbumImages] = useState<string[]>([]);

  // Fetch images from Supabase on load
  useEffect(() => {
    const fetchImages = async () => {
      const { data, error } = await supabase
        .from('photos')
        .select('public_url')
        .order('created_at', { ascending: false });

      if (data) {
        // Filter out nulls just in case
        const urls = data
          .map(photo => photo.public_url)
          .filter((url): url is string => url !== null);
        setAlbumImages(urls);
      }
      if (error) {
        console.error('Error fetching images:', error);
      }
    };

    fetchImages();
  }, []);

  const addToAlbum = async (imageBase64: string): Promise<boolean> => {
    try {
      // 1. Convert Base64 to Blob
      const base64Response = await fetch(imageBase64);
      const blob = await base64Response.blob();
      
      const timestamp = Date.now();
      const fileName = `strip-${timestamp}.png`;
      const bucketName = 'photo-strips';

      // 2. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, blob);

      if (uploadError) {
          console.error('Supabase Storage Error:', uploadError.message);
          throw uploadError;
      }

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      // 4. Save URL to Database
      const { error: dbError } = await supabase
        .from('photos')
        .insert([{ 
          bucket_id: bucketName,
          file_path: fileName,
          public_url: publicUrl 
        }]);

      if (dbError) {
          console.error('Supabase DB Error:', dbError.message);
          throw dbError;
      }

      // 5. Update Local State
      setAlbumImages(prev => [publicUrl, ...prev]);
      
      return true; // Success
    } catch (error) {
      console.error('Error saving to album:', error);
      // Suppress alert to allow for non-intrusive auto-save failure (retry button will appear in UI)
      return false; // Failed
    }
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FF4D6D', '#FF8FA3', '#FFFFFF']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FF4D6D', '#FF8FA3', '#FFFFFF']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const handleOpenEnvelope = () => {
    setShowEnvelope(false);
    setShowMessage(true);
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center py-12 px-4 overflow-x-hidden">
      {/* Background Pattern */}
      <div className="heart-bg" />

      {/* Main Content Container */}
      <main className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center gap-8 justify-center min-h-[60vh]">
        
        {/* Header */}
        <header className="text-center animate-float">
          <div className="inline-flex items-center justify-center p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mb-6">
            <Heart className="w-6 h-6 text-valentine-red fill-valentine-red mr-2" />
            <span className="text-valentine-red font-bold text-sm tracking-wider uppercase">Important Persons</span>
            <Heart className="w-6 h-6 text-valentine-red fill-valentine-red ml-2" />
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-valentine-red mb-3 drop-shadow-sm">
            Happy Valentine’s, <br/> Mga gwapa kag gwapo
          </h1>
          <p className="font-body text-gray-600 text-lg">
            For Wena • Flora • Jerry Lou • Raden
          </p>
        </header>

        {/* Action Buttons Card */}
        <div className="w-full bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-8 border-2 border-valentine-pale flex flex-col gap-4 mt-4">
          
          <button 
            onClick={() => setShowEnvelope(true)}
            className="group relative w-full py-4 px-6 bg-gradient-to-r from-valentine-pink to-valentine-red rounded-xl shadow-md transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-95 flex items-center justify-center gap-3 text-white font-semibold text-lg"
          >
            <Mail className="w-5 h-5" />
            <span>Read Message</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity" />
          </button>

          <button 
            onClick={() => setShowPhotoBooth(true)}
            className="group relative w-full py-4 px-6 bg-white border-2 border-valentine-pink text-valentine-red rounded-xl shadow-sm transform transition-all duration-200 hover:bg-valentine-bg hover:shadow-md active:scale-95 flex items-center justify-center gap-3 font-semibold text-lg"
          >
            <Camera className="w-5 h-5" />
            <span>Take a Photo Strip</span>
          </button>

          <button 
            onClick={() => setShowAlbum(true)}
            className="group relative w-full py-4 px-6 bg-white border-2 border-valentine-pink text-valentine-red rounded-xl shadow-sm transform transition-all duration-200 hover:bg-valentine-bg hover:shadow-md active:scale-95 flex items-center justify-center gap-3 font-semibold text-lg"
          >
            <Images className="w-5 h-5" />
            <span>View Our Album</span>
            {albumImages.length > 0 && (
              <span className="absolute top-3 right-3 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-valentine-red opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-valentine-red"></span>
              </span>
            )}
          </button>

          <button 
            onClick={triggerConfetti}
            className="group relative w-full py-4 px-6 bg-valentine-pale text-valentine-red rounded-xl shadow-sm transform transition-all duration-200 hover:bg-valentine-light hover:text-white active:scale-95 flex items-center justify-center gap-3 font-semibold text-lg"
          >
            <Heart className="w-5 h-5 group-hover:animate-ping" />
            <span>Heart Confetti</span>
          </button>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-auto text-center text-valentine-red/80 font-medium py-6">
        <p>Made by Kingkong💌</p>
      </footer>

      {/* Envelope Modal */}
      {showEnvelope && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="relative w-full max-w-lg flex flex-col items-center justify-center min-h-[50vh]">
              <button 
                onClick={() => setShowEnvelope(false)} 
                className="absolute top-0 right-4 p-3 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors z-50"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="font-heading text-3xl text-white mb-4 animate-bounce drop-shadow-md">
                You've got mail!
              </h2>
              
              <Envelope onClick={handleOpenEnvelope} />
              
              <p className="text-white/90 text-sm font-medium mt-4 animate-pulse">
                (Tap the envelope to open)
              </p>
           </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessage && (
        <MessageCard onClose={() => setShowMessage(false)} />
      )}

      {/* Album Modal */}
      {showAlbum && (
        <Album images={albumImages} onClose={() => setShowAlbum(false)} />
      )}

      {/* Photo Booth Modal */}
      {showPhotoBooth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
             <div className="p-4 bg-valentine-bg border-b border-valentine-pale flex justify-between items-center">
               <h3 className="font-heading text-xl text-valentine-red">Bestie Photo Booth</h3>
               <button onClick={() => setShowPhotoBooth(false)} className="p-2 hover:bg-valentine-pale rounded-full text-valentine-red transition-colors">
                 <X className="w-6 h-6" />
               </button>
             </div>
             <div className="flex-1 overflow-y-auto p-4">
               <PhotoBooth onSave={addToAlbum} />
             </div>
           </div>
        </div>
      )}
    </div>
  );
}