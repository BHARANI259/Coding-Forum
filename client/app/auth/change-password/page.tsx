"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { changePassword } from "@/lib/api";
import {
  consumePostPasswordRedirect,
  getStoredUser,
  getAuthToken,
  logout,
  updateStoredUser
} from "@/lib/auth";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    const user = getStoredUser();

    if (!token || !user) {
      logout();
      router.replace("/");
      return;
    }

    setEmail(user.email);
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const updatedUser = await changePassword(oldPassword, newPassword);
      updateStoredUser(updatedUser);
      router.push(consumePostPasswordRedirect(updatedUser.role));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Password change failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-kec-bg px-4 py-6 sm:px-6 lg:py-10">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center">
        <Card className="w-full p-8">
          <form onSubmit={handleSubmit}>
            <p className="text-sm font-semibold uppercase tracking-wide text-kec-purple">First Login</p>
            <h1 className="mt-2 text-2xl font-bold text-kec-text">Change Password</h1>
            <p className="mt-2 text-sm text-kec-secondary">
              {email ? `Signed in as ${email}` : "Complete password change to continue."}
            </p>
            <p className="mt-1 text-sm text-kec-muted">Required before continuing to the portal.</p>

            <div className="mt-8 space-y-5">
              <Input
                label="Current Password"
                id="oldPassword"
                type="password"
                autoComplete="current-password"
                required
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
              />

              <Input
                label="New Password"
                id="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />

              <Input
                label="Confirm New Password"
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>

            {error ? (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <Button type="submit" loading={submitting} className="mt-6 w-full">
              Change Password
            </Button>
          </form>
        </Card>
      </section>
    </main>
  );
}
