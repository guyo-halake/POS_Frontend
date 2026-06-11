import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Lock } from 'lucide-react';

export const LockScreen: React.FC = () => {
  const { currentUser, unlockRegister, logout } = useStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleKeyClick = async (num: string) => {
    if (loading) return;
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        setLoading(true);
        const success = await unlockRegister(newPin);
        if (!success) {
          setError(true);
          setPin('');
          setTimeout(() => setError(false), 1000);
        }
        setLoading(false);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) setPin(pin.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl">
      <div className="flex flex-col items-center max-w-sm w-full p-8 rounded-3xl glass-panel text-center">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Register Locked</h2>
        <p className="text-muted-foreground mb-8">
          Logged in as <strong>{currentUser?.name || 'User'}</strong>
        </p>

        {/* PIN display dots */}
        <div className="flex gap-4 mb-8 justify-center">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full transition-colors ${
                error ? 'bg-destructive' : 
                i < pin.length ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 mb-8 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleKeyClick(num.toString())}
              className="keypad-btn h-16 rounded-2xl bg-secondary/50 hover:bg-secondary text-2xl font-bold"
            >
              {num}
            </button>
          ))}
          <button 
            onClick={logout} 
            className="keypad-btn h-16 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/20 text-sm font-bold uppercase"
          >
            Switch User
          </button>
          <button
            onClick={() => handleKeyClick('0')}
            className="keypad-btn h-16 rounded-2xl bg-secondary/50 hover:bg-secondary text-2xl font-bold"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="keypad-btn h-16 rounded-2xl bg-secondary/50 hover:bg-secondary text-lg font-bold"
          >
            DEL
          </button>
        </div>
      </div>
    </div>
  );
};
