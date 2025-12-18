import React, { useState, Suspense } from 'react';
import { TreeMorphState } from './types';
import Experience from './components/Experience';
import HandManager from './components/HandManager';

const App: React.FC = () => {
  const [mode, setMode] = useState<TreeMorphState>(TreeMorphState.TREE_SHAPE);
  const [hasCameraAccess, setHasCameraAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);
  const [isModalDismissed, setIsModalDismissed] = useState<boolean>(false);

  return (
    <div className="relative w-full h-screen bg-[#000502] overflow-hidden">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={null}>
          <Experience mode={mode} />
        </Suspense>
      </div>

      {/* Camera Logic Layer */}
      <HandManager 
        onModeChange={setMode} 
        onCameraStatusChange={setHasCameraAccess}
        onLoadComplete={() => setLoading(false)}
        retryTrigger={retryTrigger}
      />

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8">
        
        {/* Header - Arix Signature Branding */}
        <div className="flex flex-col items-center">
          <h1 className="font-['Cinzel'] text-4xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-b from-[#F7E7CE] via-[#D4AF37] to-[#806000] drop-shadow-[0_0_25px_rgba(212,175,55,0.6)] tracking-widest uppercase text-center border-b border-[#D4AF37]/30 pb-4 mb-2">
            Arix Signature
          </h1>
          <p className="font-['Playfair_Display'] text-[#50C878] italic text-lg md:text-xl tracking-[0.2em] uppercase opacity-90 drop-shadow-lg">
            Interactive Christmas Edition
          </p>
        </div>

        {/* Loading / Status */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto text-center">
          {loading && (
            <div className="flex flex-col items-center space-y-4 animate-pulse">
              <div className="w-16 h-16 border-[3px] border-[#D4AF37] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#D4AF37]"></div>
              <span className="font-['Cinzel'] text-[#F7E7CE] text-xl tracking-widest">Preparing Experience...</span>
            </div>
          )}
        </div>

        {/* Permission Modal */}
        {!loading && !hasCameraAccess && !isModalDismissed && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md transition-opacity duration-700 pointer-events-auto">
            <div className="flex flex-col items-center bg-[#001a0a] border border-[#D4AF37] p-10 max-w-lg text-center shadow-[0_0_80px_rgba(212,175,55,0.2)]">
              <div className="mb-6">
                <div className="w-12 h-12 border-2 border-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-2 shadow-[0_0_15px_#D4AF37] animate-pulse">
                   <div className="w-2 h-2 bg-[#F7E7CE] rounded-full" />
                </div>
                <h2 className="font-['Cinzel'] text-3xl text-[#F7E7CE] tracking-widest uppercase border-b border-[#D4AF37]/30 pb-2">
                  Immersion Required
                </h2>
              </div>
              <p className="font-['Playfair_Display'] text-[#50C878] text-lg italic mb-8 leading-relaxed">
                The Arix Signature Tree comes alive with your touch.<br/>
                Please enable camera access for the full hand-gesture experience.
              </p>
              <div className="flex flex-col w-full space-y-4">
                <button 
                  onClick={() => setRetryTrigger(c => c + 1)}
                  className="bg-[#D4AF37] hover:bg-[#F7E7CE] text-[#001a0a] font-['Cinzel'] font-bold py-4 px-8 tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_40px_rgba(212,175,55,0.6)]"
                >
                  Initialize Sensors
                </button>
                <button 
                  onClick={() => setIsModalDismissed(true)}
                  className="text-[#D4AF37]/50 hover:text-[#D4AF37] font-['Cinzel'] text-xs uppercase tracking-widest transition-colors pt-2"
                >
                  Proceed with Manual Controls
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Controls / Footer */}
        <div className="flex flex-col items-center space-y-6 pb-10 pointer-events-auto">
          <div className="bg-[#001a0a]/60 backdrop-blur-xl border border-[#D4AF37]/30 rounded-full px-10 py-4 transition-all duration-700 hover:border-[#D4AF37] hover:bg-[#001a0a]/80 hover:shadow-[0_0_40px_rgba(212,175,55,0.2)]">
             <div className="flex items-center space-x-4">
               <div className={`w-3 h-3 rounded-full transition-all duration-500 ${mode === TreeMorphState.SCATTERED ? 'bg-[#D4AF37] shadow-[0_0_15px_#D4AF37] scale-125' : 'bg-[#50C878]/50'}`}></div>
               <span className="font-['Cinzel'] text-[#F7E7CE] text-xs md:text-sm tracking-[0.2em] font-bold">
                 {hasCameraAccess ? "OPEN PALM TO SCATTER" : "HOLD TO SCATTER"}
               </span>
             </div>
          </div>
          
          {!hasCameraAccess && !loading && (
             <button 
               onMouseDown={() => setMode(TreeMorphState.SCATTERED)}
               onMouseUp={() => setMode(TreeMorphState.TREE_SHAPE)}
               onMouseLeave={() => setMode(TreeMorphState.TREE_SHAPE)}
               onTouchStart={() => setMode(TreeMorphState.SCATTERED)}
               onTouchEnd={() => setMode(TreeMorphState.TREE_SHAPE)}
               className="font-['Cinzel'] text-[10px] text-[#D4AF37]/60 uppercase tracking-widest hover:text-[#D4AF37] transition-colors border-b border-transparent hover:border-[#D4AF37]/40"
             >
               (Manual Interaction Mode)
             </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;