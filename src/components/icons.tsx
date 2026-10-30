// Inline stroke icons (24px grid, 1.75 stroke) so the site ships no icon
// font or package. They inherit currentColor and are decorative by default.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 20, children, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false" {...rest}>
      {children}
    </svg>
  );
}

export const CalculatorIcon = (p: IconProps) => (
  <Icon {...p}><rect x="5" y="3" width="14" height="18" rx="2.5" /><path d="M8.5 7h7M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M15.5 15v2.5M8.5 18h.01M12 18h.01" /></Icon>
);
export const ConvertIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5" /></Icon>
);
export const TextIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 6h16M4 10h16M4 14h10M4 18h7" /></Icon>
);
export const CheckIcon = (p: IconProps) => <Icon {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Icon>;
export const LockIcon = (p: IconProps) => (
  <Icon {...p}><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></Icon>
);
export const BoltIcon = (p: IconProps) => <Icon {...p}><path d="M13 3 5 13.5h6L10.5 21 19 10.5h-6L13 3Z" /></Icon>;
export const FormulaIcon = (p: IconProps) => <Icon {...p}><path d="M17 5H7l5.5 7L7 19h10" /></Icon>;
export const ArrowRightIcon = (p: IconProps) => <Icon {...p}><path d="M5 12h14m-5-5 5 5-5 5" /></Icon>;
export const MoonIcon = (p: IconProps) => <Icon {...p}><path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10Z" /></Icon>;
export const SunIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" /></Icon>
);
export const ChevronIcon = (p: IconProps) => <Icon {...p}><path d="m9 6 6 6-6 6" /></Icon>;
export const CopyIcon = (p: IconProps) => (
  <Icon {...p}><rect x="8.5" y="8.5" width="11" height="11" rx="2.5" /><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" /></Icon>
);
export const SearchIcon = (p: IconProps) => <Icon {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></Icon>;
export const MenuIcon = (p: IconProps) => <Icon {...p}><path d="M4 7h16M4 12h16M4 17h10" /></Icon>;
export const CloseIcon = (p: IconProps) => <Icon {...p}><path d="M6 6l12 12M18 6 6 18" /></Icon>;
export const ResetIcon = (p: IconProps) => <Icon {...p}><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9" /><path d="M4.5 4.5V9H9" /></Icon>;
export const GridIcon = (p: IconProps) => (
  <Icon {...p}><rect x="4" y="4" width="6.5" height="6.5" rx="1.75" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.75" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.75" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.75" /></Icon>
);
export const CalendarIcon = (p: IconProps) => (
  <Icon {...p}><rect x="4" y="5.5" width="16" height="14.5" rx="2.5" /><path d="M8 3.5v4M16 3.5v4M4 10h16" /></Icon>
);
export const PlusIcon = (p: IconProps) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>;

/** Category icon by cluster intent. */
export const INTENT_ICONS = {
  calculate: CalculatorIcon,
  convert: ConvertIcon,
  check: TextIcon,
  generate: BoltIcon,
} as const;

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden focusable="false">
      <rect width="32" height="32" rx="9" fill="var(--brand)" />
      <path d="M10 11.5h12M16 11.5V22" stroke="var(--brand-ink)" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="22" cy="21" r="2" fill="var(--brand-ink)" opacity=".55" />
    </svg>
  );
}
