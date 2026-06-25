/**
 * Typography — semantic text wrapper components.
 *
 * Use these instead of hardcoding font-size/weight/color.
 * Each maps directly to one level in the 6-level text hierarchy.
 *
 * Hierarchy:
 *   <PageTitle>      1.55rem / 800 / textPrimary  — one per page
 *   <SectionTitle>   0.95rem / 700 / textPrimary  — major section
 *   <CardTitle>      0.88rem / 700 / textPrimary  — card / panel header
 *   <BodyText>       0.82rem / 400 / textSecondary
 *   <MetaText>       0.74rem / 400 / textMuted    — dates, counts, labels
 *   <LabelCaps>      0.62rem / 700 / textMuted    — ALL-CAPS section label
 *   <BadgeText>      0.74rem / 600                — badge / pill labels
 */

import { ReactNode, CSSProperties } from "react";
import { typography, color } from "../../tokens";

const FF = typography.fontFamily;

interface TextProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function PageTitle({ children, style, className = "", as: Tag = "h1" }: TextProps) {
  return (
    <Tag
      className={className}
      style={{ ...typography.pageTitle, fontFamily: FF, margin: 0, ...style }}
    >
      {children}
    </Tag>
  );
}

export function SectionTitle({ children, style, className = "", as: Tag = "h2" }: TextProps) {
  return (
    <Tag
      className={className}
      style={{ ...typography.sectionTitle, fontFamily: FF, margin: 0, ...style }}
    >
      {children}
    </Tag>
  );
}

export function CardTitle({ children, style, className = "", as: Tag = "h3" }: TextProps) {
  return (
    <Tag
      className={className}
      style={{ ...typography.cardTitle, fontFamily: FF, margin: 0, ...style }}
    >
      {children}
    </Tag>
  );
}

export function BodyText({ children, style, className = "", as: Tag = "p" }: TextProps) {
  return (
    <Tag
      className={className}
      style={{ ...typography.body, fontFamily: FF, margin: 0, ...style }}
    >
      {children}
    </Tag>
  );
}

export function MetaText({ children, style, className = "", as: Tag = "span" }: TextProps) {
  return (
    <Tag
      className={className}
      style={{ ...typography.meta, fontFamily: FF, ...style }}
    >
      {children}
    </Tag>
  );
}

export function LabelCaps({ children, style, className = "", as: Tag = "div" }: TextProps) {
  return (
    <Tag
      className={className}
      style={{ ...typography.labelCaps, fontFamily: FF, ...style }}
    >
      {children}
    </Tag>
  );
}

export function BadgeText({ children, style, className = "", textColor }: TextProps & { textColor?: string }) {
  return (
    <span
      className={className}
      style={{ ...typography.badgeText, fontFamily: FF, color: textColor, ...style }}
    >
      {children}
    </span>
  );
}
