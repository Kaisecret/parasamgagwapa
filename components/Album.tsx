import React, { useState } from 'react';
import { X, Download, Image as ImageIcon } from 'lucide-react';

interface AlbumProps {
  images: string[];
  onClose: () => void;
}

const Album: React.FC<AlbumProps> = ({ images, onClose }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleDownload = (e: React.MouseEvent, src: string, index: number) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.download = `bestie-memory-${index + 1}.png`;
    link.href = src;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col h-full">
        
        {/* Header */}
        <div className="p-4 bg-valentine-bg border-b border-valentine-pale flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-valentine-red" />
            <h3 className="font-heading text-xl text-valentine-red">Our Memories</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-valentine-pale rounded-full text-valentine-red transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-50">
          {images.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
              <ImageIcon className="w-16 h-16 text-valentine-pink mb-4" />
              <p className="font-body text-gray-500 text-lg">No photos yet!</p>
              <p className="text-sm text-gray-400">Go to the Photo Booth to create some memories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((img, index) => (
                <div 
                  key={index}
                  onClick={() => setSelectedImage(img)}
                  className="relative aspect-[3/4] bg-white rounded-xl shadow-sm border border-valentine-pale overflow-hidden cursor-pointer group hover:shadow-md transition-all"
                >
                  <img 
                    src={img} 
                    alt={`Memory ${index + 1}`} 
                    className="w-full h-full object-contain bg-valentine-bg/30"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="bg-white/90 text-valentine-red text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      View
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-white border-t border-gray-100 text-center shrink-0">
          <p className="text-xs text-gray-400 font-body">
            {images.length} {images.length === 1 ? 'photo' : 'photos'} collected
          </p>
        </div>
      </div>

      {/* Lightbox / Popup View */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-in zoom-in-95 duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-full max-h-full flex flex-col items-center">
            <img 
              src={selectedImage} 
              alt="Full size memory" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()} 
            />
            
            <button
              onClick={(e) => handleDownload(e, selectedImage, images.indexOf(selectedImage))}
              className="mt-4 flex items-center gap-2 px-6 py-2 bg-white text-valentine-red rounded-full font-bold hover:bg-gray-100 transition-colors shadow-lg"
            >
              <Download className="w-4 h-4" />
              Download Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Album;