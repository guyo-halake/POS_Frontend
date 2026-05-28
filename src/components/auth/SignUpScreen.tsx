import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API_BASE_URL } from '@/config/api';

export const SignUpScreen: React.FC<{ onSignUp: () => void }> = ({ onSignUp }) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    if (!name || !pin || !email) {
      setError('All fields are required');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pin, email, role: 'owner' })
      });
      const data = await res.json();
      if (data.success) {
        // Auto-login the newly created owner and navigate into the app
        try {
          // Call central login to populate store
          const loginRes = await fetch(`${API_BASE_URL}/api/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin })
          });
          const loginData = await loginRes.json();
          if (loginData.success && loginData.user) {
            // Use the browser's window/global event to inform the root page to close signup
            window.dispatchEvent(new CustomEvent('user-logged-in', { detail: loginData.user }));
          }
        } catch (e) {
          // ignore auto-login failure, just proceed to close signup
        }
        onSignUp();
      } else {
        setError(data.error || 'Sign up failed');
      }
    } catch (err) {
      setError('Sign up failed');
    }
  };

  // No inline login form here; first-time setup only

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">POS First-Time Setup</h1>
      <div className="w-full max-w-xs space-y-4">
        <Input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
        <Input placeholder="PIN (4 digits)" type="password" value={pin} maxLength={4} onChange={e => setPin(e.target.value)} />
        <Input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button className="w-full" onClick={handleSignUp}>Sign Up</Button>
      </div>
    </div>
  );
};
