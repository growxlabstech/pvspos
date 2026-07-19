import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Welcome back</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in to your account to continue
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
