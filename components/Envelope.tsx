import React from 'react';
import { Heart } from 'lucide-react';

interface EnvelopeProps {
  onClick: () => void;
}

const Envelope: React.FC<EnvelopeProps> = ({ onClick }) => {
  return (
    <div className="flex justify-center w-full py-8">
      <div 
        onClick={onClick}
        className="relative w-80 h-64 cursor-pointer group flex justify-center items-end"
        role="button"
        aria-label="Open message envelope"
      >
        {/* 1. Envelope Interior (Dark Background) */}
        <div className="absolute bottom-0 w-[95%] h-48 bg-[#C04545] rounded-b-[2rem] border-4 border-[#3E2723]"></div>

        {/* 2. The Card (Slides up animation) */}
        <div className="absolute bottom-4 w-64 h-56 bg-[#FFFDF5] border-4 border-[#3E2723] rounded-2xl flex flex-col items-center pt-6 px-4 transition-transform duration-500 ease-out group-hover:-translate-y-24 origin-bottom shadow-sm">
           <Heart className="w-8 h-8 text-[#FF4D6D] fill-[#FF4D6D] transform -rotate-12 drop-shadow-sm" />
           <div className="mt-6 w-full space-y-3 opacity-40">
             <div className="h-2 bg-[#FF4D6D] rounded-full w-full"></div>
             <div className="h-2 bg-[#FF4D6D] rounded-full w-5/6"></div>
             <div className="h-2 bg-[#FF4D6D] rounded-full w-full"></div>
           </div>
        </div>

        {/* 3. Front Pocket (SVG for shape & stitching) */}
        <div className="absolute bottom-0 w-full h-full pointer-events-none z-10 filter drop-shadow-xl">
           <svg viewBox="0 0 320 250" className="w-full h-full overflow-visible">
              {/* Main Red Pocket Shape with Cartoon Stroke */}
              <path 
                d="M 10,100 L 160,195 L 310,100 L 310,215 Q 310,245 280,245 L 40,245 Q 10,245 10,215 Z" 
                fill="#EF5350" 
                stroke="#3E2723" 
                strokeWidth="6" 
                strokeLinejoin="round" 
              />
              
              {/* White Dashed Stitching Line */}
              <path 
                d="M 22,112 L 160,200 L 298,112 L 298,215 Q 298,233 280,233 L 40,233 Q 22,233 22,215 Z" 
                fill="none" 
                stroke="white" 
                strokeWidth="3" 
                strokeDasharray="12 8" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
           </svg>

           {/* 4. Large Cream Heart */}
           <div className="absolute bottom-5 left-1/2 -translate-x-1/2 translate-y-1">
              <Heart 
                className="w-16 h-16 text-[#FFFDF5] fill-[#FFFDF5] stroke-[#3E2723] stroke-[3]" 
                style={{ filter: 'drop-shadow(0 2px 0 rgba(0,0,0,0.1))' }}
              />
           </div>
        </div>
      </div>
    </div>
  );
};

export default Envelope;