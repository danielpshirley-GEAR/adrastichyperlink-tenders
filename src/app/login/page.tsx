'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowRight, ShieldCheck, Eye, EyeOff, Key } from 'lucide-react';

const PREVIEW_DEFAULT_TOKEN = 'adrastichyperlink-admin-preview-2026!';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/today';

  const [token, setToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const performLogin = async (candidateToken: string) => {
    if (!candidateToken.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: candidateToken.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Authentication failed');
      }

      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Invalid administrator token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const queryToken = searchParams.get('token');
    if (queryToken) {
      setToken(queryToken);
      performLogin(queryToken);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(token);
  };

  const handleFillPreviewToken = () => {
    setToken(PREVIEW_DEFAULT_TOKEN);
    setError(null);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="token" className="block text-xs font-mono uppercase tracking-wider text-gallery-muted font-semibold">
            Access Password / Token
          </label>
          <button
            type="button"
            onClick={handleFillPreviewToken}
            className="text-[11px] font-mono text-tender-primary hover:underline flex items-center gap-1"
          >
            <Key className="w-3 h-3" />
            Fill Preview Token
          </button>
        </div>
        <div className="mt-2 relative">
          <input
            id="token"
            name="token"
            type={showPassword ? 'text' : 'password'}
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter access token..."
            className="appearance-none block w-full pl-3 pr-10 py-2.5 border border-gallery-border rounded-lg placeholder-gallery-muted/60 text-gallery-charcoal focus:outline-none focus:ring-2 focus:ring-tender-primary text-sm font-mono"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gallery-muted hover:text-gallery-charcoal transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          {error}
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={loading || !token.trim()}
          className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gallery-charcoal hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gallery-charcoal disabled:opacity-50 transition-colors"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gallery-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-gallery-charcoal text-white flex items-center justify-center shadow-lg">
            <Lock className="w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-extrabold text-gallery-charcoal tracking-tight">
          Adrastichyperlink Tender Engine
        </h2>
        <p className="mt-2 text-center text-xs text-gallery-muted font-mono uppercase tracking-wider">
          Sign In to Tender Engine
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gallery-surface py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-gallery-border">
          <Suspense fallback={<div className="py-8 text-center text-xs text-gallery-muted font-mono">Loading authentication...</div>}>
            <LoginForm />
          </Suspense>

          <div className="mt-6 border-t border-gallery-border pt-4">
            <div className="flex items-center gap-2 text-[11px] text-gallery-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                Production bid management, private evidence, and scan controls are restricted to authorized team members.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
