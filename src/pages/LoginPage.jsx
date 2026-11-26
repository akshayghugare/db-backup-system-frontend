import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import AuthLayout, { FormError } from "../components/AuthLayout.jsx";
import { LockIcon, SpinnerIcon } from "../components/Icons.jsx";
import { Alert, Field, PasswordInput } from "../components/ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { login, notice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Only signed-in users can run a backup & restore."
      footer={
        <>
          No account yet?{" "}
          <Link to="/register" className="font-medium text-accent-soft hover:text-violet-200 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {notice && !error && <Alert tone="warning">{notice}</Alert>}
        <FormError message={error} />
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            className="field"
            disabled={submitting}
            autoFocus
          />
        </Field>
        <Field label="Password">
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Your password"
            disabled={submitting}
          />
        </Field>
        <button type="submit" className="btn-accent mt-2 h-11 w-full" disabled={submitting}>
          {submitting ? <SpinnerIcon /> : <LockIcon />}
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}
