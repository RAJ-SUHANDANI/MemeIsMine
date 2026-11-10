"use client";

import { ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";

export function AuthPassword({
  signup,
  disabled,
}: {
  signup: boolean;
  disabled: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="auth-password-field">
      <input
        id="auth-password"
        type={visible ? "text" : "password"}
        name="password"
        autoComplete={signup ? "new-password" : "current-password"}
        required
        minLength={signup ? 12 : undefined}
        maxLength={128}
        disabled={disabled}
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-controls="auth-password"
        disabled={disabled}
        onClick={() => setVisible((value) => !value)}
      >
        {visible ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </div>
  );
}

export function AuthSubmit({
  signup,
  disabled,
}: {
  signup: boolean;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className="button button-dark auth-submit"
      disabled={disabled || pending}
    >
      {pending
        ? signup
          ? "Creating account…"
          : "Signing in…"
        : signup
          ? "Create free account"
          : "Sign in"}
      <ArrowUpRight size={18} aria-hidden="true" />
    </button>
  );
}
