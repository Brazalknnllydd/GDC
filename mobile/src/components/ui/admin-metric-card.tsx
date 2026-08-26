import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Info, X } from 'lucide-react-native';
import { IconButton, Portal } from 'react-native-paper';

import { radius, spacing } from '../../constants/design-system';
import { colors, textRoles, textSizes } from '../../constants/theme';
import { SurfaceCard } from './surface-card';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';

type MetricTone = 'default' | 'success' | 'danger' | 'positive' | 'negative' | 'neutral';
type TonePalette = Record<MetricTone, { detail: string; value: string }>;

type AdminMetricCardProps = {
  title: string;
  value: string;
  detail: string;
  tone?: MetricTone;
  style?: StyleProp<ViewStyle>;
  valueColor?: string;
  titleColor?: string;
  detailColor?: string;
  minHeight?: number;
  width?: ViewStyle['width'];
  paddingHorizontal?: number;
  paddingVertical?: number;
  titleMarginBottom?: number;
  valueMarginBottom?: number;
  titleLetterSpacing?: number;
  valueFontSize?: number;
  valueLineHeight?: number;
  infoDialogTitle?: string;
  infoDialogValue?: string;
};

const toneStyles: TonePalette = {
  default: { detail: colors.textSoft, value: colors.neutral },
  success: { detail: colors.successBright, value: colors.successBright },
  danger: { detail: colors.danger, value: colors.danger },
  positive: { detail: colors.success, value: colors.secondary },
  negative: { detail: colors.dangerStrong, value: colors.secondary },
  neutral: { detail: colors.textTertiary, value: colors.secondary },
};

export function AdminMetricCard({
  title,
  value,
  detail,
  tone = 'default',
  style,
  valueColor,
  titleColor = colors.textHeading,
  detailColor,
  minHeight = 134,
  width,
  paddingHorizontal = 18,
  paddingVertical = 18,
  titleMarginBottom = 18,
  valueMarginBottom = 6,
  titleLetterSpacing = 1.8,
  valueFontSize = 21,
  valueLineHeight = 26,
  infoDialogTitle,
  infoDialogValue,
}: AdminMetricCardProps) {
  const { width: screenWidth } = useWindowDimensions();
  const { isTablet, isWideTablet } = useResponsiveLayout();
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const palette = toneStyles[tone];
  const isCompactPhone = screenWidth < 430;
  const isNarrowPhone = screenWidth < 390;
  
  const defaultWidth = isWideTablet ? '23.5%' : isTablet ? '31.5%' : '48%';
  const resolvedWidth = width ?? defaultWidth;
  const resolvedTitleLetterSpacing = isNarrowPhone
    ? Math.min(titleLetterSpacing, 0.8)
    : isCompactPhone
      ? Math.min(titleLetterSpacing, 1.3)
      : titleLetterSpacing;
  const resolvedTitleFontSize = isNarrowPhone ? 12 : isCompactPhone ? 13 : textSizes.body;
  const resolvedTitleLineHeight = isNarrowPhone ? 16 : isCompactPhone ? 17 : 20;
  const resolvedTitleHeight = resolvedTitleLineHeight * 2;
  const resolvedValueFontSize = isNarrowPhone
      ? Math.min(valueFontSize, 18)
    : isCompactPhone
      ? Math.min(valueFontSize, 20)
      : valueFontSize;
  const resolvedValueLineHeight = isNarrowPhone
    ? Math.min(valueLineHeight, 22)
    : isCompactPhone
      ? Math.min(valueLineHeight, 24)
      : valueLineHeight;
  const resolvedMinHeight = isNarrowPhone ? Math.max(minHeight, 118) : isCompactPhone ? Math.max(minHeight, 126) : minHeight;
  const resolvedPaddingHorizontal = isNarrowPhone ? 12 : isCompactPhone ? 15 : paddingHorizontal;
  const resolvedPaddingVertical = isNarrowPhone ? 13 : isCompactPhone ? 15 : paddingVertical;
  const resolvedTitleMarginBottom = isNarrowPhone
    ? Math.min(titleMarginBottom, 12)
    : isCompactPhone
      ? Math.min(titleMarginBottom, 14)
      : titleMarginBottom;
  const resolvedValueMarginBottom = isNarrowPhone ? Math.min(valueMarginBottom, 8) : valueMarginBottom;

  return (
    <SurfaceCard
      style={[
        styles.card,
        {
          minHeight: resolvedMinHeight,
          paddingHorizontal: resolvedPaddingHorizontal,
          paddingVertical: resolvedPaddingVertical,
          width: resolvedWidth,
        },
        style,
      ]}>
      <View style={[styles.headerRow, { height: resolvedTitleHeight, marginBottom: resolvedTitleMarginBottom }]}>
        <Text
          style={[
            styles.title,
            {
              color: titleColor,
              fontSize: resolvedTitleFontSize,
              letterSpacing: resolvedTitleLetterSpacing,
              lineHeight: resolvedTitleLineHeight,
            },
          ]}>
          {title}
        </Text>
        {infoDialogValue ? (
          <IconButton
            icon={() => <Info color={colors.secondary} size={16} strokeWidth={2.1} />}
            onPress={() => setShowInfoDialog(true)}
            size={18}
            style={styles.infoButton}
          />
        ) : (
          <View style={styles.infoSpacer} />
        )}
      </View>
      <Text
        style={[
          styles.value,
          {
            color: valueColor || palette.value,
            fontSize: resolvedValueFontSize,
            lineHeight: resolvedValueLineHeight,
            marginBottom: resolvedValueMarginBottom,
          },
        ]}>
        {value}
      </Text>
      <Text
        style={[
          styles.detail,
          isNarrowPhone && styles.detailNarrow,
          { color: detailColor || palette.detail },
        ]}>
        {detail}
      </Text>

      {infoDialogValue ? (
        <Portal>
          {showInfoDialog ? (
            <Pressable onPress={() => setShowInfoDialog(false)} style={styles.dialogBackdrop}>
              <Pressable onPress={() => undefined} style={styles.dialogCenter}>
                <SurfaceCard style={styles.dialogCard}>
                  <View style={styles.dialogTopRow}>
                    <View style={styles.dialogBadge}>
                      <Info color={colors.secondary} size={18} strokeWidth={2.2} />
                    </View>
                    <IconButton
                      icon={() => <X color={colors.textTertiary} size={18} strokeWidth={2.2} />}
                      onPress={() => setShowInfoDialog(false)}
                      size={18}
                      style={styles.dialogCloseButton}
                    />
                  </View>

                  <Text style={styles.dialogEyebrow}>Inventory Snapshot</Text>
                  <Text style={styles.dialogTitle}>{infoDialogTitle || title}</Text>
                  <Text style={styles.dialogValue}>{infoDialogValue}</Text>
                  <Text style={styles.dialogCaption}>
                    Current computed total based on the latest inventory data.
                  </Text>
                </SurfaceCard>
              </Pressable>
            </Pressable>
          ) : null}
        </Portal>
      ) : null}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    justifyContent: 'space-between',
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 24,
  },
  title: {
    ...textRoles.label,
    flex: 1,
    fontSize: textSizes.body,
    lineHeight: 18,
    minHeight: 20,
    textTransform: 'uppercase',
  },
  infoButton: {
    borderColor: colors.borderInfoStrong,
    borderRadius: radius.round,
    borderWidth: 1,
    marginLeft: 10,
  },
  infoSpacer: {
    height: 0,
    marginLeft: 0,
    width: 0,
  },
  value: {
    ...textRoles.value,
  },
  detail: {
    ...textRoles.label,
    fontSize: 12,
    lineHeight: 17,
  },
  detailNarrow: {
    fontSize: 12,
    lineHeight: 17,
  },
  dialogBackdrop: {
    alignItems: 'center',
    backgroundColor: colors.overlayScrim,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  dialogCenter: {
    width: '100%',
  },
  dialogCard: {
    alignSelf: 'center',
    borderRadius: radius.xxl,
    maxWidth: 460,
    minHeight: 220,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    width: '100%',
  },
  dialogTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dialogBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceBrandSoft,
    borderColor: colors.borderInfoStrong,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  dialogEyebrow: {
    color: colors.textTertiary,
    ...textRoles.label,
    letterSpacing: 1.1,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  dialogTitle: {
    color: colors.textHeading,
    ...textRoles.value,
    fontSize: 20,
    marginBottom: spacing.md,
  },
  dialogCloseButton: {
    margin: -6,
  },
  dialogValue: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: 34,
    lineHeight: 40,
    marginBottom: spacing.md,
  },
  dialogCaption: {
    color: colors.textTertiary,
    ...textRoles.body,
    fontSize: 14,
    lineHeight: 22,
  },
});
