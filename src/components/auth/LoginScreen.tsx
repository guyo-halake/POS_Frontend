
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Delete } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { API_BASE_URL } from '@/config/api';

export const LoginScreen: React.FC = () => {
  const { setCurrentUser, login } = useStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  // Reset Flow State
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [pendingOtp, setPendingOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showNewPinForm, setShowNewPinForm] = useState(false);
  const [pinChangeMsg, setPinChangeMsg] = useState('');

  // Sign Up State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPin, setSignUpPin] = useState('');
  const [signUpRole, setSignUpRole] = useState('Cashier');
  const [signUpError, setSignUpError] = useState('');

  const keypadButtons = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    'clear', '0', 'delete'
  ];

  const handlePinInput = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  React.useEffect(() => {
    if (pin.length === 4) {
      handleLogin();
    }
  }, [pin]);

  // Keyboard listener: allow typing digits, Backspace, and Enter to submit
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

      if (/^[0-9]$/.test(e.key)) {
        handlePinInput(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        if (pin.length === 4) handleLogin();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pin]);

  // Password login state and handler
  const [showPasswordLogin, setShowPasswordLogin] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');

  const handlePasswordLogin = async () => {
    if (!password || password.length === 0) {
      setPasswordError('Enter your password');
      return;
    }
    setPasswordError('');
    try {
      const success = await login(password);
      if (!success) setPasswordError('Invalid password');
      else setShowPasswordLogin(false);
    } catch (e) {
      setPasswordError('Login failed');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleLogin = async () => {
    if (pin.length !== 4) return;

    try {
      const success = await login(pin);
      if (!success) {
        setError('Invalid PIN');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setPin('');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleEmailReset = async () => {
    if (!resetEmail) {
      setResetError('Please enter your email');
      return;
    }
    setPendingOtp(true);
    setResetError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();
      if (data.success) {
        setShowOtpInput(true);
      } else {
        setResetError(data.error || 'Failed to send OTP');
        setPendingOtp(false);
      }
    } catch (error) {
       setResetError('Network error');
       setPendingOtp(false);
    }
  };

  const handleWhatsAppReset = () => {
     // Placeholder for future WhatsApp integration
     setResetError('WhatsApp reset not configured yet.');
  };

  const handleOtpVerify = async () => {
    if (!otp) {
      setOtpError('Please enter the code');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, otp })
      });
      const data = await res.json();
      if (data.success) {
        setShowNewPinForm(true);
        setShowOtpInput(false);
        setOtpError('');
      } else {
        setOtpError(data.error || 'Invalid OTP');
      }
    } catch (error) {
      setOtpError('Network error');
    }
  };

  const handleSetNewPin = async () => {
    if (newPin.length !== 4 || confirmPin.length !== 4) {
      setPinChangeMsg('PIN must be 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinChangeMsg('PINs do not match');
      return;
    }
    try {
       const res = await fetch(`${API_BASE_URL}/api/users/reset-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, otp, newPin })
      });
      const data = await res.json();
      if (data.success) {
         setPinChangeMsg('PIN successfully changed! Please login.');
         setTimeout(() => {
             // Reset everything and go back to login
             setShowReset(false);
             setResetEmail('');
             setOtp('');
             setNewPin('');
             setConfirmPin('');
             setShowOtpInput(false);
             setShowNewPinForm(false);
             setPendingOtp(false);
             setPinChangeMsg('');
         }, 2000);
      } else {
         setPinChangeMsg(data.error || 'Failed to reset PIN');
      }
    } catch (error) {
        setPinChangeMsg('Network error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 animate-fade-in relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl -z-10" />

      {/* Main Logo */}
      <div className="mb-0 relative z-10 flex flex-col items-center animate-slide-up -mb-6">
        <div className="relative w-40 h-40 md:w-56 md:h-56 transition-transform duration-300">
          <img
            src="./main logos/main.png"
            alt="P3L Logo"
            className="w-full h-full object-contain drop-shadow-sm"
          />
        </div>

        <div className="w-full max-w-2xl mt-4 px-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="brand-title text-2xl md:text-3xl">P3L Point of Sale</h2>
              <p className="text-sm text-muted-foreground mt-1">Fast, offline-ready, M-Pesa-integrated</p>
            </div>
            <div>
              <button
                className="text-sm text-muted-foreground underline hover:text-foreground"
                onClick={() => setShowPasswordLogin(prev => !prev)}
                aria-expanded={showPasswordLogin}
              >
                Login with password
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {!showSignUp ? (
        <>
          {/* LOGIN FLOW (PIN and Keypad) - Hide when Resetting */}
          {!showReset && (
            <>
              {/* PIN Dots */}
              <div className={cn(
                "flex flex-col items-center mb-2 animate-slide-up",
                isShaking && "animate-[shake_0.5s_ease-in-out]"
              )}>
                <div className="flex gap-3 mb-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-4 h-4 rounded-full transition-all duration-200",
                        i < pin.length ? "bg-primary scale-110" : "bg-muted"
                      )}
                    />
                  ))}
                </div>
                {error && (
                  <p className="text-destructive text-sm mt-2 font-medium bg-destructive/10 px-3 py-1 rounded-full animate-fade-in">{error}</p>
                )}
              </div>

              {/* Keypad */}
              <div className="w-full max-w-md mx-auto mb-8" role="application" aria-label="PIN keypad">
                <div className="p-0">
                  <div className="grid grid-cols-3 gap-5 w-full animate-slide-up">
                    {keypadButtons.map((btn) => (
                      <button
                        key={btn}
                        onClick={() => {
                          if (btn === 'clear') handleClear();
                          else if (btn === 'delete') handleDelete();
                          else handlePinInput(btn);
                        }}
                        className={cn(
                          "keypad-btn",
                          btn === 'delete' && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                          btn === 'clear' && "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {btn === 'delete' ? (
                          <Delete className="w-6 h-6" />
                        ) : btn === 'clear' ? (
                          <X className="w-6 h-6" />
                        ) : (
                          btn
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

                {/* Password login form (toggleable) */}
                {showPasswordLogin && (
                  <div className="w-full max-w-xs mx-auto mt-4">
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full p-3 rounded-lg border"
                      />
                      <button
                        className="px-4 py-3 bg-primary text-white rounded-lg"
                        onClick={handlePasswordLogin}
                      >
                        Login
                      </button>
                    </div>
                    {passwordError && <p className="text-destructive text-sm mt-2">{passwordError}</p>}
                  </div>
                )}

                {/* Keyboard support: accept digits and Enter/Backspace */}
                <script />

              {/* Login Button - Removed as per request for automatic login
              <div className="max-w-[200px] w-full mx-auto">
                <Button 
                  className="w-full mb-4 h-10 text-sm font-semibold shadow-lg hover:shadow-xl transition-all" 
                  onClick={handleLogin} 
                  disabled={pin.length !== 4}
                >
                  Login
                </Button>
              </div>
              */}

              {/* Forgot PIN Link */}
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground cursor-pointer underline hover:text-primary transition-colors" onClick={() => setShowReset(true)}>
                  Forgot your PIN?
                </p>
              </div>
            </>
          )}

          {/* RESET FLOW - Show only if showReset is true */}
          {showReset && (
            <div className="flex flex-col items-center w-full max-w-xs animate-fade-in">
              
              {/* Step 1: Email Input */}
              {!showOtpInput && !showNewPinForm && (
                <div className="w-full space-y-4 mt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email Address</label>
                    <Input
                      placeholder="Enter your email"
                      type="email"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={handleEmailReset}
                    disabled={pendingOtp}
                  >
                    {pendingOtp ? 'Sending OTP...' : 'Send Reset Code'}
                  </Button>
                  
                  {resetError && <p className="text-destructive text-sm mt-2 text-center">{resetError}</p>}
                  
                  <div className="pt-2">
                     <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => { setPendingOtp(false); setShowReset(false); setResetEmail(''); setOtp(''); setResetError(''); }}
                      >
                        Cancel
                      </Button>
                  </div>
                </div>
              )}

              {/* Step 2: OTP Input */}
              {showOtpInput && (
                <div className="w-full space-y-4 mt-2">
                  <div className="text-center mb-2">
                      <p className="text-sm text-muted-foreground">We sent a code to <span className="font-medium text-foreground">{resetEmail}</span></p>
                  </div>
                  <Input
                    placeholder="Enter 6-digit verification code"
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    className="text-center tracking-widest text-lg"
                  />
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={handleOtpVerify}
                  >
                    Verify Code
                  </Button>
                  {otpError && <p className="text-destructive text-sm mt-2 text-center">{otpError}</p>}
                   <Button
                      variant="ghost"
                      className="w-full mt-2 text-muted-foreground"
                      onClick={() => { setShowOtpInput(false); }}
                    >
                      Back
                    </Button>
                </div>
              )}

              {/* Step 3: New PIN Form */}
              {showNewPinForm && (
                <div className="w-full space-y-4 mt-2">
                  <Input
                    placeholder="Enter new 4-digit PIN"
                    type="number"
                    value={newPin}
                    onChange={e => setNewPin(e.target.value)}
                    maxLength={4}
                  />
                  <Input
                    placeholder="Confirm new 4-digit PIN"
                    type="number"
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value)}
                    maxLength={4}
                  />
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={handleSetNewPin}
                  >
                    Set New PIN
                  </Button>
                  {pinChangeMsg && <p className={cn("text-sm mt-2 text-center", pinChangeMsg.includes('success') ? "text-green-600" : "text-destructive")}>{pinChangeMsg}</p>}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        // SIGN UP FLOW
        <div className="w-full max-w-xs animate-slide-up">
          <Input className="mb-2" placeholder="Name" value={signUpName} onChange={e => setSignUpName(e.target.value)} />
          <Input className="mb-2" placeholder="Email" type="email" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} />
          <Input className="mb-2" placeholder="4-digit PIN" type="number" value={signUpPin} onChange={e => setSignUpPin(e.target.value)} maxLength={4} />
          <Input className="mb-2" placeholder="Role (Cashier/Manager)" value={signUpRole} onChange={e => setSignUpRole(e.target.value)} />
          
          {signUpError && <p className="text-destructive text-sm mb-2">{signUpError}</p>}
          
          <Button className="w-full mb-2" onClick={async () => {
            if (!signUpName || !signUpEmail || signUpPin.length !== 4 || !signUpRole) {
              setSignUpError('Please fill all fields and use a 4-digit PIN');
              return;
            }
            try {
              const res = await fetch(`${API_BASE_URL}/api/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: signUpName, email: signUpEmail, pin: signUpPin, role: signUpRole })
              });
              const data = await res.json();
              if (data.success) {
                setShowSignUp(false);
                setSignUpName('');
                setSignUpEmail('');
                setSignUpPin('');
                setSignUpRole('Cashier');
                setSignUpError('');
                setPin(signUpPin);
                setError('');
              } else {
                setSignUpError(data.error || 'Sign up failed');
              }
            } catch (err) {
              setSignUpError('Sign up failed');
            }
          }}>Create Account</Button>
          <Button className="w-full" variant="outline" onClick={() => setShowSignUp(false)}>Back to Login</Button>
        </div>
      )}

      {/* Sign Up Removed - Only Developers can create clients
      {!showSignUp && !showReset && (
        <div className="mt-8 text-center animate-fade-in">
           <p className="text-muted-foreground text-sm">
             New here? <Button variant="link" className="p-0 h-auto font-semibold text-primary" onClick={() => setShowSignUp(true)}>Create Account</Button>
           </p>
        </div>
      )}
      */}
    </div>
  );
};
