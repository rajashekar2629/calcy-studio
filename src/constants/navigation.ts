import { ArrowLeftRight, Calculator, CalendarDays, HeartPulse, Landmark, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  /** Short label shown in the navigation bar. */
  label: string;
  /** Full section name (page title, accessible name, tooltip). */
  title: string;
  icon: LucideIcon;
  /** Match the route exactly (needed for "/" so it is not active on every page). */
  end?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Basic', title: 'Basic Calculator', icon: Calculator, end: true },
  { to: '/interest', label: 'Interest', title: 'Interest Calculator', icon: Landmark },
  { to: '/converter', label: 'Converter', title: 'Length, Weight and Volume Converter', icon: ArrowLeftRight },
  { to: '/bmi', label: 'BMI', title: 'BMI Calculator', icon: HeartPulse },
  { to: '/age', label: 'Age', title: 'Age Calculator', icon: CalendarDays },
];
