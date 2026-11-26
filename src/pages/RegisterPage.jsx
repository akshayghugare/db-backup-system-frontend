import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { fetchConfig } from "../api/backup.js";
import AuthLayout, { FormError } from "../components/AuthLayout.jsx";
import { SpinnerIcon, UserIcon } from "../components/Icons.jsx";
import { Field, PasswordInput } from "../components/ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validate = ({ name, email, password, confirm }) => {
  if (!name.trim()) return "Enter your name";
  if (!EMAIL_PATTERN.test(email.trim())) return "Enter a valid email address";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Password must contain at least one letter and one number";
  if (password !== confirm) return "The two passwords do not match";
  return null;
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    fetchConfig()
      .then((config) => setEnabled(config.registration_enabled))
      .catch(() => undefined);
  }, []);

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    const problem = validate(form);
    if (problem) {
      setError(problem);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Accounts are stored in this tool's own local database."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {!enabled ? (
        <p className="text-[13px] text-muted">
          Registration is turned off on this server. Ask whoever runs it for an account, or set ALLOW_REGISTRATION=true in
          backend/.env.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-3" noValidate>
          <FormError message={error} />
          <Field label="Name">
            <input
              type="text"
              value={form.name}
              onChange={set("name")}
              autoComplete="name"
              placeholder="Your name"
              className="field"
              disabled={submitting}
              autoFocus
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              autoComplete="email"
              placeholder="you@example.com"
              className="field"
              disabled={submitting}
            />
          </Field>
          <Field label="Password" hint="At least 8 characters, with a letter and a number.">
            <PasswordInput value={form.password} onChange={set("password")} placeholder="Choose a password" disabled={submitting} />
          </Field>
          <Field label="Confirm password">
            <PasswordInput value={form.confirm} onChange={set("confirm")} placeholder="Type it again" disabled={submitting} />
          </Field>
          <button type="submit" className="btn-accent w-full" disabled={submitting}>
            {submitting ? <SpinnerIcon /> : <UserIcon />}
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
