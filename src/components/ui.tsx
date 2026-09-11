import type { ReactNode } from "react";

export function Card({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return <section className={`panel ${className}`} id={id}>{children}</section>;
}

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="section-title">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "green" | "amber" | "red" | "neutral" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Button({ children, variant = "primary", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>;
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-state-mark">+</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}

export function LoadingState() {
  return <div className="loading-state"><span /><span /><span /></div>;
}

export function ErrorState() {
  return <div className="error-state"><strong>We couldn&apos;t load this view.</strong><span>Try again or check back in a moment.</span></div>;
}

export function FormField({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return <label className="form-field"><span>{label}</span>{children}{error ? <small className="field-error">{error}</small> : hint ? <small className="field-hint">{hint}</small> : null}</label>;
}

export function ConfirmDialog({ title, message, confirmLabel = "Confirm", children }: { title: string; message: string; confirmLabel?: string; children?: ReactNode }) {
  return <div className="dialog-preview" role="dialog" aria-label={title}><div className="dialog-icon">!</div><h3>{title}</h3><p>{message}</p><div className="dialog-actions">{children ?? <><Button variant="secondary">Cancel</Button><Button>{confirmLabel}</Button></>}</div></div>;
}