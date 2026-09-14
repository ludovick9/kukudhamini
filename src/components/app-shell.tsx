"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, CircleHelp, Download, LayoutDashboard, Leaf, LogOut, Menu, Package, Pill, ReceiptText, Settings, ShoppingBasket, Sprout, TrendingUp, X } from "lucide-react";
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { Farm, User } from "@/domain/types";
import { useLanguage } from "@/lib/i18n/language-provider";
import { logoutAction } from "@/app/logout/actions";
import { formatLongDate } from "@/lib/timezone";

function LogoutButton({ className = "sidebar-logout", role }: { className?: string; role?: "menuitem" }) {
  const { pending } = useFormStatus();
  const { t } = useLanguage();

  return <button type="submit" className={className} role={role} disabled={pending} aria-label={pending ? t.common.loggingOut : t.common.logOut}><LogOut size={17} aria-hidden="true" /><span>{pending ? t.common.loggingOut : t.common.logOut}</span></button>;
}

function NavigationLink({ href, ...props }: ComponentProps<typeof Link>) {
  const router = useRouter();
  return <Link href={href} onMouseEnter={() => router.prefetch(href.toString())} onFocus={() => router.prefetch(href.toString())} {...props} />;
}

export function AppShell({ children, farm, user }: { children: ReactNode; farm: Farm; user: User }) {
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const navigation = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard }, { href: "/batches", label: t.nav.batches, icon: Sprout }, { href: "/expenses", label: t.nav.expenses, icon: ReceiptText }, { href: "/feed", label: t.nav.feed, icon: Package }, { href: "/health", label: t.nav.health, icon: Pill }, { href: "/mortality", label: t.nav.mortality, icon: TrendingUp }, { href: "/sales", label: t.nav.sales, icon: ShoppingBasket }, { href: "/reports", label: t.nav.reports, icon: Leaf }, { href: "/exports", label: "Exports", icon: Download }, { href: "/bulk-entry", label: "Bulk entry", icon: ReceiptText },
  ];

  useEffect(() => {
    const clear = window.setTimeout(() => setNavigating(false), 0);
    return () => window.clearTimeout(clear);
  }, [pathname]);

  useEffect(() => {
    if (!accountMenuOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) setAccountMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountMenuOpen]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><span>🐔</span></div>
          <div><strong>Kuku<span>Dhamini</span></strong><small>Your broiler farm guardian</small></div>
          <button type="button" className="mobile-close" onClick={() => setMobileOpen(false)} aria-label={t.common.closeNavigation}><X size={20} /></button>
        </div>

        <div className="farm-switcher">
          <div className="farm-avatar"><Sprout size={17} /></div>
          <div><small>{t.common.currentFarm}</small><strong>{farm.name}</strong></div>
          <ChevronDown size={16} className="muted-icon" />
        </div>

        <p className="nav-label">{t.common.workspace}</p>
        <nav className="main-nav" aria-label={t.common.workspace}>
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href === "/dashboard" && pathname === "/");
            return <NavigationLink key={href} href={href} onClick={() => { setMobileOpen(false); setNavigating(true); }} className={`nav-link ${active ? "nav-link-active" : ""}`}><Icon size={18} strokeWidth={active ? 2.2 : 1.8} /><span>{label}</span></NavigationLink>;
          })}
        </nav>

        <div className="sidebar-bottom">
          <NavigationLink href="/notifications" onClick={() => { setMobileOpen(false); setNavigating(true); }} className={`nav-link ${pathname === "/notifications" ? "nav-link-active" : ""}`}><Bell size={18} /><span>{t.nav.notifications}</span>{(farm.unreadNotificationCount ?? 0) > 0 && <span className="notification-count">{farm.unreadNotificationCount}</span>}</NavigationLink>
          <NavigationLink href="/settings" onClick={() => { setMobileOpen(false); setNavigating(true); }} className={`nav-link ${pathname === "/settings" ? "nav-link-active" : ""}`}><Settings size={18} /><span>{t.nav.settings}</span></NavigationLink>
          <div className="sidebar-account"><div className="sidebar-account-heading"><span className="sidebar-account-avatar" aria-hidden="true">{user.initials}</span><div><strong>{user.name}</strong>{user.email && <span>{user.email}</span>}</div></div><form action={logoutAction}><LogoutButton /></form></div>
          <div className="sidebar-help"><CircleHelp size={18} /><div><strong>{t.common.needHelp}</strong><span>{t.common.farmGuide}</span></div></div>
        </div>
      </aside>

      {mobileOpen && <button type="button" className="mobile-overlay" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}
      <main className="main-content">
        {navigating && <div className="navigation-progress" role="status" aria-label="Loading next page" />}
        <header className="topbar">
          <button type="button" className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label={t.common.openNavigation}><Menu size={22} /></button>
          <div className="mobile-brand"><span className="brand-mark small">🐔</span><strong>Kuku<span>Dhamini</span></strong></div>
          <div className="topbar-farm"><span className="status-dot" />{farm.name}<ChevronDown size={15} /></div>
          <div className="topbar-actions"><span className="topbar-date">{formatLongDate(new Date(), farm.timezone)}</span><Link href="/notifications" className="icon-button notification-button" aria-label="View notifications"><Bell size={19} /><i /></Link><div className="account-menu-wrap" ref={accountMenuRef}><button type="button" className="user-chip" aria-label={`${user.name}, ${t.common.accountSettings}`} aria-haspopup="menu" aria-expanded={accountMenuOpen} aria-controls="account-menu" onClick={() => setAccountMenuOpen((open) => !open)}><span>{user.initials}</span><strong>{user.name}</strong><ChevronDown size={14} /></button>{accountMenuOpen && <div id="account-menu" className="account-menu" role="menu"><div className="account-menu-header"><span className="account-menu-avatar" aria-hidden="true">{user.initials}</span><div><strong>{user.name}</strong>{user.email && <span>{user.email}</span>}</div></div><div className="account-menu-links"><Link href="/settings" role="menuitem" onClick={() => setAccountMenuOpen(false)}><Settings size={16} aria-hidden="true" />{t.common.accountSettings}</Link><Link href="/settings#appearance" role="menuitem" onClick={() => setAccountMenuOpen(false)}><Sprout size={16} aria-hidden="true" />{t.common.appearance}</Link><Link href="/settings#language" role="menuitem" onClick={() => setAccountMenuOpen(false)}><Leaf size={16} aria-hidden="true" />{t.common.language}</Link></div><div className="account-menu-divider" /><form action={logoutAction}><LogoutButton className="account-menu-logout" role="menuitem" /></form></div>}</div></div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}