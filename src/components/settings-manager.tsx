"use client";

import { Check, Languages, MapPin, Moon, RefreshCw, Sun, UserRound, Laptop } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Farm, User } from "@/domain/types";
import { useLanguage } from "@/lib/i18n/language-provider";
import { useTheme, type Theme } from "@/lib/theme-provider";
import type { Language } from "@/lib/i18n/locales";
import { Badge, Card, SectionHeading } from "@/components/ui";
import { offlineDb } from "@/lib/offline/db";
import { clearFarmOfflineData, hydrateOfflineData, syncPendingOperations } from "@/lib/offline/sync";

export function OfflineCenter({ farmId }: { farmId: string }) {
  const [online, setOnline] = useState(() => typeof navigator !== "undefined" && navigator.onLine);
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(0);
  const [localRecords, setLocalRecords] = useState(0);
  const [lastSynced, setLastSynced] = useState<string>();
  const [message, setMessage] = useState("");
  const refresh = useCallback(async () => {
    const [queue, records] = await Promise.all([offlineDb.syncQueue.where("farmId").equals(farmId).toArray(), offlineDb.records.where("farmId").equals(farmId).toArray()]);
    setPending(queue.length); setFailed(queue.filter((item) => item.status === "failed").length); setLocalRecords(records.filter((record) => !record.deletedAt).length);
    setLastSynced(records.map((record) => record.lastSyncedAt).filter(Boolean).sort().at(-1));
  }, [farmId]);
  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); const onlineHandler = () => setOnline(true); const offlineHandler = () => setOnline(false); window.addEventListener("online", onlineHandler); window.addEventListener("offline", offlineHandler); window.addEventListener("kukudhamini-sync-change", refresh); return () => { window.clearTimeout(timer); window.removeEventListener("online", onlineHandler); window.removeEventListener("offline", offlineHandler); window.removeEventListener("kukudhamini-sync-change", refresh); }; }, [refresh]);
  async function sync() { setMessage("Syncing..."); const result = await syncPendingOperations(); await refresh(); setMessage(result.failed ? "Some changes need attention." : "All changes are up to date."); }
  async function refreshData() { setMessage("Refreshing offline data..."); await hydrateOfflineData(farmId); await refresh(); setMessage("Offline data refreshed."); }
  async function retry() { await offlineDb.syncQueue.where("farmId").equals(farmId).modify({ status: "pending", nextAttemptAt: new Date().toISOString() }); await sync(); }
  async function clear() { if (pending && !window.confirm("Unsynchronized changes will be permanently removed from this device. Continue?")) return; await clearFarmOfflineData(farmId); await refresh(); setMessage("Offline data cleared."); }
  return <Card><SectionHeading eyebrow="Device storage" title="Offline Center" /><p className="settings-description">Farm data saved here remains available when the connection is unreliable.</p><div className="settings-info-list"><div><strong>Connection</strong><span>{online ? "ONLINE" : "OFFLINE"}</span></div><div><strong>Last synchronization</strong><span>{lastSynced ? new Date(lastSynced).toLocaleString() : "Not synchronized"}</span></div><div><strong>Pending changes</strong><span>{pending}</span></div><div><strong>Failed changes</strong><span>{failed}</span></div><div><strong>Offline records</strong><span>{localRecords}</span></div></div>{message && <p className="settings-saved"><Check size={14} /> {message}</p>}<div className="heading-actions" style={{ marginTop: 16 }}><button className="button button-secondary" type="button" onClick={() => void refreshData()} disabled={!online}><RefreshCw size={15} /> Refresh offline data</button><button className="button button-secondary" type="button" onClick={() => void retry()} disabled={!online || !failed}>Retry failed syncs</button><button className="button button-primary" type="button" onClick={() => void sync()} disabled={!online || !pending}>Sync now</button><button className="button button-ghost" type="button" onClick={() => void clear()}>Clear offline data</button></div></Card>;
}

export function SettingsManager({ farm, user }: { farm: Farm; user: User }) {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const appearanceOptions: Array<[Theme, typeof Sun, string, string]> = [["light", Sun, t.settings.light, t.settings.lightDescription], ["dark", Moon, t.settings.dark, t.settings.darkDescription], ["system", Laptop, t.settings.system, t.settings.systemDescription]];
  return <><div className="page-heading"><div><p className="eyebrow">{t.settings.eyebrow}</p><h1>{t.settings.title}</h1><p className="heading-subtitle">{t.settings.description}</p></div></div><div className="settings-grid"><Card><SectionHeading eyebrow="Language" title={t.settings.languageTitle} /><p className="settings-description">{t.settings.languageDescription}</p><div className="language-selector" role="group" aria-label={t.common.language}>{([['en', t.common.english], ['sw', t.common.kiswahili]] as const).map(([value, label]) => <button key={value} className={language === value ? "language-option language-option-active" : "language-option"} onClick={() => setLanguage(value as Language)} aria-pressed={language === value}><Languages size={17} /><span>{label}</span>{language === value && <Check size={15} />}</button>)}</div><p className="settings-saved"><Check size={14} /> {t.settings.saved}</p></Card><Card><SectionHeading eyebrow="Appearance" title={t.settings.appearanceTitle} /><p className="settings-description">{t.settings.appearanceDescription}</p><div className="appearance-selector" role="radiogroup" aria-label={t.settings.appearanceTitle}>{appearanceOptions.map(([value, Icon, title, description]) => <button key={value} className={theme === value ? "appearance-option appearance-option-active" : "appearance-option"} onClick={() => setTheme(value)} role="radio" aria-checked={theme === value}><Icon size={17} /><div><strong>{title}</strong><small>{description}</small></div>{theme === value && <Check size={15} />}</button>)}</div></Card><Card><SectionHeading eyebrow="Farm" title={t.settings.farmTitle} /><p className="settings-description">{t.settings.farmDescription}</p><div className="settings-info-list"><div><strong>{t.settings.farmName}</strong><span>{farm.name}</span></div><div><strong>{t.settings.location}</strong><span><MapPin size={13} /> {farm.location}</span></div><div><strong>{t.settings.currency}</strong><span>{farm.currency}</span></div><div><strong>{t.settings.timezone}</strong><span>{farm.timezone}</span></div></div></Card><Card><SectionHeading eyebrow="Account" title={t.settings.accountTitle} /><p className="settings-description">{t.settings.accountDescription}</p><div className="settings-account"><div className="settings-account-avatar"><UserRound size={18} /></div><div><strong>{user.name}</strong><span>{user.role}</span></div></div><Badge tone="green">{t.common.selected}</Badge></Card></div></>;
}