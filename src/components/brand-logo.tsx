import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  compact?: boolean;
};

export function BrandLogo({ className = "", compact = false }: BrandLogoProps) {
  return (
    <Image
      src="/images/kukudhamini-logo.png"
      alt="KukuDhamini"
      width={compact ? 42 : 188}
      height={compact ? 42 : 165}
      className={`brand-logo ${compact ? "brand-logo-compact" : ""} ${className}`.trim()}
      priority
    />
  );
}