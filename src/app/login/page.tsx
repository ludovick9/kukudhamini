"use client";

import Link from "next/link";
import { Check, Eye, EyeOff, Leaf, LockKeyhole, Mail, ShieldCheck, Sprout } from "lucide-react";
import { useActionState, useState } from "react";
import { useLanguage } from "@/lib/i18n/language-provider";
import { loginAction, type AuthActionState } from "@/app/login/actions";

const emptyState: AuthActionState = { ok: false, message: "" };

export default function LoginPage() {
  const { language, setLanguage, t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState(loginAction, emptyState);

  return <main className="auth-page">
    <section className="auth-visual" aria-label={t.auth.brandDescription}>
      <div className="auth-visual-glow" />
      <div className="auth-brand-row"><div className="auth-logo"><span>🐔</span></div><div><strong>Kuku<span>Dhamini</span></strong><small>{t.auth.brandTagline}</small></div></div>
      <div className="auth-visual-content"><p className="auth-kicker"><Sprout size={15} /> {t.auth.secureAccess}</p><h2>Run a healthier, more profitable flock.</h2><p>{t.auth.brandDescription}</p><ul>{[t.auth.trackBatches, t.auth.monitorHealth, t.auth.manageCosts, t.auth.followMoney].map((item) => <li key={item}><Check size={15} />{item}</li>)}</ul></div>
      <div className="auth-visual-footer"><Leaf size={15} /> Built for the daily rhythm of poultry farming.</div>
    </section>
    <section className="auth-form-side">
      <div className="auth-language" role="group" aria-label={t.common.language}><button type="button" className={language === "en" ? "auth-language-active" : ""} onClick={() => setLanguage("en")}>{t.common.english}</button><button type="button" className={language === "sw" ? "auth-language-active" : ""} onClick={() => setLanguage("sw")}>{t.common.kiswahili}</button></div>
      <div className="auth-card">
        <div className="auth-card-mark"><ShieldCheck size={18} /></div><p className="eyebrow">KukuDhamini</p><h1>{t.auth.loginTitle}</h1><p className="auth-card-subtitle">{t.auth.loginSubtitle}</p>
        <form action={formAction} className="auth-form" aria-label={t.auth.loginTitle}>
          {state.message ? <div className="form-feedback error" role="alert">{state.message}</div> : null}
          <label className="form-field"><span>{t.auth.emailLabel}</span><div className="input-wrap"><Mail size={17} aria-hidden="true" /><input name="email" type="email" autoComplete="email" placeholder={t.auth.emailHint} aria-label={t.auth.emailLabel} required /></div></label>
          <label className="form-field"><span>{t.auth.passwordLabel}</span><div className="input-wrap"><LockKeyhole size={17} aria-hidden="true" /><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" aria-label={t.auth.passwordLabel} required /><button type="button" className="password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
          <button className="button button-primary auth-submit" disabled={pending} type="submit">{pending ? t.auth.loading : t.auth.submit}</button>
        </form>
        <p className="auth-trust"><ShieldCheck size={14} /> {t.auth.trustNote}</p><p className="auth-switch">{t.auth.dontHaveAccount} <Link href="/signup">{t.common.signUp}</Link></p>
      </div>
    </section>
  </main>;
}
