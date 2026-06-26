import type { ComponentType } from 'react';

export type AppRoute =
  | '/admin'
  | '/admin-products'
  | '/admin-sales'
  | '/admin-reports'
  | '/admin-settings'
  | '/cashier';

export type NavIconProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
};

export type BottomNavItem = {
  label: string;
  icon: ComponentType<NavIconProps>;
  active?: boolean;
  route?: AppRoute;
};
