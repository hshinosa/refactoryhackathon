import { AuthForm } from '@/components/auth/AuthForm';
import { AuthPageLayout, AuthShowcaseCard } from '@/components/auth/AuthPageLayout';
import { signUpCopy } from '@/components/auth/authPageContent';

export default function SignUpPage() {
  return (
    <AuthPageLayout aside={<AuthShowcaseCard />}>
      <AuthForm mode="sign-up" copy={signUpCopy} />
    </AuthPageLayout>
  );
}
