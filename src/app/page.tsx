import { LoginForm } from "@/components/auth/login-form";
import { RtfLogo } from "@/components/rtf-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center text-center">
        <RtfLogo className="w-24 h-24 mb-4 text-primary" />
        <h1 className="text-5xl font-bold font-headline text-primary">
          Raghav Tailors & Fabrics
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Your Digital Tailoring Assistant
        </p>
      </div>

      <Card className="w-full max-w-sm mt-8 shadow-2xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
          <CardDescription>
            Enter your phone number to sign in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
