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
        router.push("/auth/change-password");
        return;
      }

      router.push(redirectPath);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-kec-bg px-4 py-6 sm:px-6 lg:py-10">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-xl border border-kec-border bg-white shadow-sm lg:grid-cols-[1fr_420px]">
        <div className="future-image-slot hidden flex-col justify-between border-r border-kec-border bg-white p-8 lg:flex">
          <Link href="/" className="text-sm font-semibold text-kec-purple hover:text-kec-purpleHover">
            Back to portal selection
          </Link>

          <div className="my-12">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-kec-purple">
              Kongu Engineering College
            </p>
            <h1 className="max-w-xl text-3xl font-bold text-kec-text sm:text-4xl">
              Coding Forum Portal
            </h1>
            <p className="mt-3 max-w-md text-sm text-kec-secondary">
              Academic event registration and student performance access.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-kec-border bg-white">
            <img
              src="/logo.jpeg"
              alt="Kongu Engineering College logo"
              className="h-56 w-full object-contain p-6"
            />
          </div>
        </div>

        <div className="flex items-center p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="mb-6 flex items-center justify-between gap-3">
              <Link href="/" className="text-sm font-semibold text-kec-purple hover:text-kec-purpleHover lg:hidden">
                Back
              </Link>
              <RoleBadge role={roleLabel} />
            </div>
            <h2 className="text-2xl font-bold text-kec-text">{title}</h2>
            <p className="mt-2 text-sm text-kec-secondary">{subtitle}</p>

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
        </div>
      </section>
    </main>
  );
}
