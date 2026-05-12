import { AuthForm } from '@/components/auth/AuthForm';
import { AuthPageLayout, AuthShowcaseCard } from '@/components/auth/AuthPageLayout';
import { signInCopy } from '@/components/auth/authPageContent';

export default function SignInPage() {
  return (
    <AuthPageLayout aside={<AuthShowcaseCard />}>
      <AuthForm mode="sign-in" copy={signInCopy} />
    </AuthPageLayout>
  );
}
