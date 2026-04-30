import { Suspense } from "react";
import LoginClient from "./login-client";

type LoginPageProps = {
  searchParams?: {
    redirect?: string;
    tab?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const redirect = searchParams?.redirect || "/profile";
  const initialTab = searchParams?.tab === "register" ? "register" : "login";

  return (
    <Suspense fallback={<div className="page-content fade-up">Chargement...</div>}>
      <LoginClient initialTab={initialTab} redirect={redirect} />
    </Suspense>
  );
}
