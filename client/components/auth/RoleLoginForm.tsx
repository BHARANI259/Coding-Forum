"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { login, type UserRole } from "@/lib/api";
import { saveAuthUser, setPostPasswordRedirect } from "@/lib/auth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import RoleBadge from "@/components/ui/RoleBadge";

type RoleLoginFormProps = {
  roleLabel: UserRole;
  title: string;
  subtitle: string;
  endpoint: string;
  redirectPath: string;
};

export default function RoleLoginForm({
  roleLabel,
  title,
  subtitle,
  endpoint,
  redirectPath
}: RoleLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [exiting, setExiting] = useState(false);

  function redirectWithFade(path: string) {
    setExiting(true);
    window.setTimeout(() => {
      router.push(path);
    }, 220);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const user = await login(endpoint, email, password);
      if (user.role !== roleLabel) {
        throw new Error("This account is not allowed to use this portal.");
      }

      saveAuthUser(user);

      if (user.firstLoginRequired) {
        setPostPasswordRedirect(redirectPath);
        redirectWithFade("/auth/change-password");
        return;
      }

      redirectWithFade(redirectPath);
    } catch (caught) {
      setExiting(false);
      setError(caught instanceof Error ? caught.message : "Login failed. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-login-page">
      <section className={exiting ? "auth-login-card auth-login-card-exit" : "auth-login-card"}>
        <Link href="/" className="auth-login-back">
          Back to portal selection
        </Link>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-kec-text sm:text-3xl">KEC Coding Forum</h1>
            <div className="mt-5 flex justify-center">
              <RoleBadge role={roleLabel} />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-kec-text">{title}</h2>
            <p className="mt-2 text-sm text-kec-secondary">{subtitle}</p>
          </div>

          <div className="mt-8 space-y-5">
            <Input
              label="Email"
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <Input
              label="Password"
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error ? (
            <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            loading={submitting}
            className="mt-6 w-full"
          >
            Sign in
          </Button>
        </form>
      </section>
    </main>
  );
}
