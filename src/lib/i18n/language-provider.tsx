"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { operationalTranslations, translations, type Language } from "@/lib/i18n/locales";

const storageKey = "kukudhamini-language";
type TranslationShape = (typeof translations)[Language];
type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; t: TranslationShape; translate: (key: string, values?: Record<string, string | number>) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored !== "sw") return;
    const restore = window.setTimeout(() => setLanguageState("sw"), 0);
    return () => window.clearTimeout(restore);
  }, []);
  useEffect(() => {
    const handleLanguageButton = (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest("button.language-option");
      if (!button) return;
      const next: Language = button.textContent?.includes("Kiswahili") ? "sw" : "en";
      setLanguageState(next);
      window.localStorage.setItem(storageKey, next);
    };
    document.addEventListener("click", handleLanguageButton);
    return () => document.removeEventListener("click", handleLanguageButton);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language === "sw" ? "sw" : "en";
    const sourceText = new WeakMap<Text, string>();
    const translateStaticText = () => {
      const dictionary = operationalTranslations[language] as Record<string, string>;
      const keys = Object.keys(dictionary).sort((left, right) => right.length - left.length);
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      while (walker.nextNode()) nodes.push(walker.currentNode as Text);
      nodes.forEach((node) => {
        const source = sourceText.get(node) ?? node.nodeValue ?? "";
        sourceText.set(node, source);
        const value = source.trim();
        if (!value) return;
        let translated = dictionary[value];
        if (!translated) {
          translated = keys.reduce((result, key) => result.replaceAll(key, dictionary[key]), value);
          if (language === "sw") {
            translated = translated.replace(/^Good morning, (.+)\.$/, "Habari za asubuhi, $1.");
            translated = translated.replace(/^Here's what's happening across (.+) today\.$/, "Hivi ndivyo kinachoendelea katika $1 leo.");
          }
        }
        if (translated !== value) node.nodeValue = source.replace(value, translated);
      });
    };
    translateStaticText();
    const observer = new MutationObserver(translateStaticText);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);
  const setLanguage = (next: Language) => { setLanguageState(next); window.localStorage.setItem(storageKey, next); document.documentElement.lang = next === "sw" ? "sw" : "en"; };
  const translate = (key: string, values: Record<string, string | number> = {}) => {
    const dictionary = operationalTranslations[language] as Record<string, string>;
    let result = dictionary[key] ?? key;
    Object.entries(values).forEach(([name, value]) => { result = result.replaceAll(`{${name}}`, String(value)); });
    return result;
  };
  return <LanguageContext.Provider value={{ language, setLanguage, t: translations[language], translate }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}