import { StyleSheet, Text, View } from 'react-native';
import { LogOut, Store } from 'lucide-react-native';

import { AppButton } from '../ui/app-button';
import { SectionHeading } from '../ui/section-heading';
import { SurfaceCard } from '../ui/surface-card';
import { colors, fonts, textSizes } from '../../constants/theme';
import { spacing } from '../../constants/design-system';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';

type CashierSettingsSectionProps = {
  cashierName: string;
  role: string;
  username: string;
  onLogout: () => void;
  onCloseShift?: () => void;
};

export function CashierSettingsSection({
  cashierName,
  role,
  username,
  onLogout,
  onCloseShift,
}: CashierSettingsSectionProps) {
  const { compactPhone } = useResponsiveLayout();

  return (
    <>
      <SectionHeading style={styles.sectionLabel}>CASHIER SETTINGS</SectionHeading>
      <SurfaceCard style={[styles.settingsCard, compactPhone && styles.settingsCardCompact]}>
        <Text style={styles.settingsTitle}>{cashierName}</Text>
        <Text style={styles.settingsMeta}>@{username}</Text>
        <Text style={styles.settingsMeta}>{role}</Text>
        <View style={styles.settingsDivider} />
        <Text style={styles.settingsCopy}>
          This section is ready for cashier profile, printer, and terminal preferences next.
        </Text>
        
        {onCloseShift && (
          <AppButton
            fullWidth={compactPhone}
            icon={({ color, size }) => <Store color={color} size={size} strokeWidth={2.1} />}
            label="End Shift"
            onPress={onCloseShift}
            style={styles.endShiftButton}
            variant="secondary"
          />
        )}

        <AppButton
          fullWidth={compactPhone}
          icon={({ color, size }) => <LogOut color={color} size={size} strokeWidth={2.1} />}
          label="Logout"
          onPress={onLogout}
          style={styles.logoutButton}
          variant="danger"
        />
      </SurfaceCard>
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    marginBottom: spacing.lg,
    marginTop: spacing.section,
  },
  settingsCard: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  settingsCardCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  settingsTitle: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  settingsMeta: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: textSizes.small + 1,
    marginBottom: spacing.xs,
  },
  settingsDivider: {
    backgroundColor: colors.dividerStrong,
    height: 1,
    marginVertical: spacing.lg,
  },
  settingsCopy: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    lineHeight: 22,
  },
  logoutButton: {
    marginTop: spacing.xl,
  },
});
