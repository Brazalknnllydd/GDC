import type { ComponentType } from 'react';
import { AppBottomNav } from '../ui/app-bottom-nav';

export type CashierSection = 'register' | 'history' | 'inventory' | 'expenses' | 'customers' | 'settings';

type CashierBottomNavItem = {
  icon: ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
  key: CashierSection;
  label: string;
};

type CashierBottomNavProps = {
  activeKey: CashierSection;
  items: readonly CashierBottomNavItem[];
  onSelect: (key: CashierSection) => void;
};

export function CashierBottomNav({
  activeKey,
  items,
  onSelect,
}: CashierBottomNavProps) {
  return (
    <AppBottomNav
      activeKey={activeKey}
      activeMarker="bottom-pill"
      items={items}
      justify="space-around"
      onSelect={onSelect}
      stretchItems={false}
    />
  );
}
