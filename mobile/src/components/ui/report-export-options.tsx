import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, textRoles } from '../../constants/theme';
import { AppButton } from './app-button';
import { SurfaceCard } from './surface-card';

export type ReportExportFormat = 'excel' | 'pdf';

type ReportExportOptionsProps = {
  format: ReportExportFormat;
  isExporting: boolean;
  onExport: () => void;
  onFormatChange: (format: ReportExportFormat) => void;
};

export function ReportExportOptions({
  format,
  isExporting,
  onExport,
  onFormatChange,
}: ReportExportOptionsProps) {
  return (
    <SurfaceCard style={styles.card}>
      <Text style={styles.heading}>Export Report</Text>
      <Text style={styles.subtitle}>
        Excel is best for filtering and accounting. PDF is best for printing and sharing.
      </Text>

      <View style={styles.options}>
        <Pressable
          onPress={() => onFormatChange('excel')}
          style={[styles.option, format === 'excel' && styles.optionActive]}>
          <View style={styles.optionHeader}>
            <Text style={styles.optionTitle}>Excel Report</Text>
            <View style={styles.recommendedPill}>
              <Text style={styles.recommendedPillText}>Recommended</Text>
            </View>
          </View>
          <Text style={styles.optionBody}>
            Best for sorting, filtering, and monthly accounting.
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onFormatChange('pdf')}
          style={[styles.option, format === 'pdf' && styles.optionActive]}>
          <View style={styles.optionHeader}>
            <Text style={styles.optionTitle}>PDF Report</Text>
          </View>
          <Text style={styles.optionBody}>
            Best for a clean printable summary and sharing.
          </Text>
        </Pressable>
      </View>

      <AppButton
        label={format === 'excel' ? 'Export as Excel' : 'Export as PDF'}
        loading={isExporting}
        onPress={onExport}
        variant="primary"
      />
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  heading: {
    color: colors.textStrong,
    ...textRoles.value,
  },
  subtitle: {
    color: colors.textSecondary,
    ...textRoles.body,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  options: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  option: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.borderMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  optionActive: {
    backgroundColor: colors.surfaceBrandSoft,
    borderColor: colors.borderInfoStrong,
  },
  optionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  optionTitle: {
    color: colors.textStrong,
    ...textRoles.value,
  },
  optionBody: {
    color: colors.textSecondary,
    ...textRoles.body,
    fontSize: 14,
    lineHeight: 22,
  },
  recommendedPill: {
    backgroundColor: colors.surfaceSuccessMuted,
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  recommendedPillText: {
    color: colors.successBright,
    ...textRoles.label,
  },
});
