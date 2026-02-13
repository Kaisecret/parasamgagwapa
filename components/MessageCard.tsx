import React from 'react';
import { X, HeartHandshake } from 'lucide-react';

interface MessageCardProps {
  onClose: () => void;
}

const MessageCard: React.FC<MessageCardProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Decorative Header */}
        <div className="h-24 bg-gradient-to-br from-valentine-pink to-valentine-red flex items-center justify-center">
          <HeartHandshake className="w-12 h-12 text-white opacity-90" />
        </div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 text-center">
          <h2 className="font-heading text-2xl text-valentine-red mb-6">
            To Wena, Flora, Jerry Lou & Raden
          </h2>
          
          <div className="space-y-4 text-gray-700 font-body leading-relaxed">
            <p>
              Mga gwapa & gwapo! Just wanted to drop by and say you four are such important people in my life.
            </p>
            <p>
              I hope you have a super fun Valentine's Day! Whether you're celebrating with loved ones or treating yourselves to something sweet, make sure to enjoy every moment of it.
            </p>
            <p>
              Don't forget to study hard and do your best in school—I know you've totally got this! I'm cheering for you always.
            </p>
            <p className="font-semibold text-valentine-red text-lg pt-2">
              And most importantly... stay always pretty & handsome! ✨
            </p>
          </div>

          <button 
            onClick={onClose}
            className="mt-8 px-8 py-3 bg-valentine-bg text-valentine-red border border-valentine-pink rounded-full font-medium hover:bg-valentine-pale transition-colors"
          >
            Close Message
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageCard;