export interface AuthPageCopy {
  eyebrow: string;
  title: string;
  description: string;
  submitLabel: string;
  alternatePrompt: string;
  alternateHref: string;
  alternateLabel: string;
}

export const signInCopy: AuthPageCopy = {
  eyebrow: 'Welcome back',
  title: 'Sign in to your workspace',
  description:
    'Access your generated docs, project analysis progress, and documentation reader from one secure place.',
  submitLabel: 'Sign in',
  alternatePrompt: "Don't have an account?",
  alternateHref: '/auth/sign-up',
  alternateLabel: 'Sign up',
};

export const signUpCopy: AuthPageCopy = {
  eyebrow: 'Get started',
  title: 'Create your Codebase Wiki account',
  description:
    'Start turning repositories into structured documentation with a setup flow designed for engineering teams.',
  submitLabel: 'Create account',
  alternatePrompt: 'Already have an account?',
  alternateHref: '/auth/sign-in',
  alternateLabel: 'Sign in',
};
