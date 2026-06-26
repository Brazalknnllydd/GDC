import type { ComponentType } from 'react';
import { colors } from '../../constants/theme';

import { AppIconTile } from '../ui/app-icon-tile';

type IconProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
};

type ReportActionButtonProps = {
  icon: ComponentType<IconProps>;
  label: string;
};

export function ReportActionButton({ icon: Icon, label }: ReportActionButtonProps) {
  return (
    <AppIconTile
      icon={<Icon color={colors.secondary} size={18} strokeWidth={2} />}
      label={label}
    />
  );
}
