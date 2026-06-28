'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch(`${apiBaseUrl}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(data?.error ?? `Sign in failed with status ${response.status}`);
        return;
      }

      setStatus('success');
      setMessage('Sign-in request succeeded. Authentication is scaffolded and ready for implementation.');
    } catch (error) {
      setStatus('error');
      setMessage('Unable to reach the API. Confirm the backend is running and CORS is configured.');
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <section className="mx-auto flex max-w-lg flex-col gap-8">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">Sign in</p>
          <h1 className="text-4xl font-semibold tracking-tight">Welcome back</h1>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Enter your email and password to continue. This page posts credentials to the API endpoint.
          </p>
        </div>

        <form className="space-y-6 rounded-2xl border bg-card p-8 shadow-sm" onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="you@example.com"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="••••••••"
              />
            </label>
          </div>

          <div className="flex flex-col gap-3">
            <Button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Signing in…' : 'Sign in'}
            </Button>
            <Link className="text-sm text-primary underline-offset-4 hover:underline" href="/">
              Back to home
            </Link>
          </div>

          {message ? (
            <div
              className={`rounded-md border px-4 py-3 text-sm ${
                status === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}
            >
              {message}
            </div>
          ) : null}
        </form>
      </section>
    </main>
  );
}
