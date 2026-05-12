'use client';

import Link from 'next/link';
import * as React from 'react';
import { signIn } from 'next-auth/react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { cn } from '@/components/ui/cn';
import type { AuthPageCopy } from './authPageContent';

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up';
  copy: AuthPageCopy;
}

type SubmitState = 'idle' | 'success';

interface SocialProvider {
  id: 'google' | 'github';
  label: string;
  icon: React.ReactNode;
}

const socialProviders: SocialProvider[] = [
  {
    id: 'google',
    label: 'Continue with Google',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.42c-.23 1.26-.96 2.33-2.06 3.06l3.32 2.58c1.94-1.79 3.06-4.43 3.06-7.58 0-.73-.06-1.43-.19-2.1H12Z"
        />
        <path
          fill="#34A853"
          d="M12 22c2.77 0 5.1-.92 6.8-2.5l-3.32-2.58c-.92.62-2.1.98-3.48.98-2.67 0-4.94-1.8-5.75-4.23l-3.43 2.65A10.27 10.27 0 0 0 12 22Z"
        />
        <path
          fill="#4A90E2"
          d="M6.25 13.67A6.15 6.15 0 0 1 5.9 12c0-.58.1-1.14.28-1.67L2.75 7.68A10.14 10.14 0 0 0 1.7 12c0 1.63.39 3.16 1.06 4.52l3.49-2.85Z"
        />
        <path
          fill="#FBBC05"
          d="M12 6.1c1.51 0 2.86.52 3.92 1.53l2.94-2.94C17.09 3.05 14.76 2 12 2 7.97 2 4.48 4.3 2.75 7.68l3.43 2.65C7.06 7.9 9.33 6.1 12 6.1Z"
        />
      </svg>
    ),
  },
  {
    id: 'github',
    label: 'Continue with GitHub',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.16c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18A10.9 10.9 0 0 1 12 6c.98 0 1.96.13 2.88.38 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
      </svg>
    ),
  },
];

export function AuthForm({ mode, copy }: AuthFormProps) {
  const [submitState, setSubmitState] = React.useState<SubmitState>('idle');

  const handleCredentialsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '').trim();
    const name = String(formData.get('name') || '').trim();

    if (!email || !password) {
      return;
    }

    const result = await signIn('credentials', {
      redirect: false,
      userId: email.toLowerCase(),
      email,
      name: name || (mode === 'sign-up' ? email.split('@')[0] : 'Codebase Wiki User'),
    });

    if (result?.ok) {
      setSubmitState('success');
    }
  };

  const handleMockProvider = async (providerId: SocialProvider['id']) => {
    const result = await signIn('credentials', {
      redirect: false,
      userId: `${providerId}-demo-user`,
      email: `${providerId}@example.com`,
      name: providerId === 'google' ? 'Google Demo User' : 'GitHub Demo User',
    });

    if (result?.ok) {
      setSubmitState('success');
    }
  };

  return (
    <GlassCard
      insetGlow
      className="mx-auto w-full max-w-[560px] rounded-[32px] border-white/10 bg-[rgba(10,15,24,0.82)] p-6 shadow-[0_32px_80px_rgba(15,23,42,0.52)] sm:p-8"
    >
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-200/85">{copy.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">{copy.title}</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300/80 sm:text-base">{copy.description}</p>
      </div>

      <form className="space-y-5" onSubmit={handleCredentialsSubmit}>
        {mode === 'sign-up' ? (
          <Field label="Full name" htmlFor="name">
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              className={inputClassName}
              placeholder="Ada Lovelace"
            />
          </Field>
        ) : null}

        <Field label="Email address" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={inputClassName}
            placeholder="you@company.com"
            required
          />
        </Field>

        <Field label="Password" htmlFor="password" trailing={mode === 'sign-in' ? <Link href="#" className="text-sm text-violet-200 transition hover:text-white">Forgot password?</Link> : null}>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            className={inputClassName}
            placeholder="Enter your password"
            required
          />
        </Field>

        <GradientButton type="submit" className="h-12 w-full justify-center text-base font-semibold">
          {copy.submitLabel}
        </GradientButton>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[rgba(10,15,24,0.82)] px-3 text-xs uppercase tracking-[0.18em] text-slate-400">
              Or continue with
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {socialProviders.map((provider) => (
            <GradientButton
              key={provider.id}
              variant="secondary"
              className="h-12 w-full justify-center border-white/10 bg-white/[0.03] text-sm font-medium text-slate-100"
              leadingIcon={provider.icon}
              onClick={() => {
                void handleMockProvider(provider.id);
              }}
            >
              {provider.label}
            </GradientButton>
          ))}
        </div>
      </form>

      <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-300/80 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {copy.alternatePrompt}{' '}
          <Link href={copy.alternateHref} className="font-medium text-violet-200 transition hover:text-white">
            {copy.alternateLabel}
          </Link>
        </p>
        <StatusPill state={submitState} />
      </div>
    </GlassCard>
  );
}

function Field({
  label,
  htmlFor,
  children,
  trailing,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-slate-200">
        <span>{label}</span>
        {trailing}
      </span>
      {children}
    </label>
  );
}

function StatusPill({ state }: { state: SubmitState }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition',
        state === 'success'
          ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
          : 'border-white/10 bg-white/[0.03] text-slate-400'
      )}
      aria-live="polite"
    >
      {state === 'success' ? 'Mock auth connected' : 'Safe mock flow enabled'}
    </span>
  );
}

const inputClassName =
  'h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-violet-300/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-400/20';
