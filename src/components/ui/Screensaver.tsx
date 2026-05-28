import React, { useEffect } from 'react';

interface ScreensaverProps {
  open: boolean;
  onClose: () => void;
  logoSrc?: string;
  title?: string;
}

export const Screensaver: React.FC<ScreensaverProps> = ({ open, onClose, logoSrc = '/main%20logos/main.png', title = 'Point of Sale System' }) => {
  const [closing, setClosing] = React.useState(false);

  useEffect(() => {
    if (!open) return;
    const handleActivity = () => {
      // play dismiss animation first
      setClosing(true);
      setTimeout(() => {
        setClosing(false);
        onClose();
      }, 260);
    };
    // Close on any user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity ${closing ? 'opacity-0' : 'opacity-100'}`}>
      <style>{`
        @keyframes floaty { 0% { transform: translateY(0px); } 50% { transform: translateY(-18px); } 100% { transform: translateY(0px); } }
      `}</style>
      <div className="flex flex-col items-center justify-center gap-4 pointer-events-auto text-center p-6">
        <img src={logoSrc} alt="logo" className="w-40 h-40 object-contain drop-shadow-lg animate-[floaty_4s_ease-in-out_infinite]" />
        <div className="text-white text-lg font-semibold">{title}</div>
        <div className="text-sm text-white/80">Supermarket Point of Sale</div>
        <div className="mt-3 text-sm text-white/80 animate-pulse">Tap, press Enter/Space, or press any key to return</div>
      </div>
    </div>
  );
};

export default Screensaver;
