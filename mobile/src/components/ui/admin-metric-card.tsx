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
  default: { detail: '#3E4454', value: '#111111' },
  success: { detail: '#119B39', value: '#119B39' },
  danger: { detail: '#D11D1D', value: '#D11D1D' },
  positive: { detail: '#0E9F3E', value: '#111D77' },
  negative: { detail: '#C62828', value: '#111D77' },
  neutral: { detail: '#677085', value: '#111D77' },
};

export function AdminMetricCard({
  title,
  value,
  detail,
  tone = 'default',
  style,
  valueColor,
  titleColor = '#2F3546',
  detailColor,
  minHeight = 158,
  width = '47.5%',
  paddingHorizontal = 22,
  paddingVertical = 22,
  titleMarginBottom = 24,
  valueMarginBottom = 8,
  titleLetterSpacing = 2.2,
  valueFontSize = 24,
  valueLineHeight = 29,
  infoDialogTitle,
  infoDialogValue,
}: AdminMetricCardProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const palette = toneStyles[tone];
  const resolvedWidth = width ?? (screenWidth < 420 ? '100%' : '47.5%');

  return (
    <SurfaceCard
      style={[
        styles.card,
        {
          minHeight,
          paddingHorizontal,
          paddingVertical,
          width: resolvedWidth,
        },
        style,
      ]}>
      <View style={[styles.headerRow, { marginBottom: titleMarginBottom }]}>
        <Text
          style={[
            styles.title,
            {
              color: titleColor,
              letterSpacing: titleLetterSpacing,
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
            fontSize: valueFontSize,
            lineHeight: valueLineHeight,
            marginBottom: valueMarginBottom,
          },
        ]}>
        {value}
      </Text>
      <Text style={[styles.detail, { color: detailColor || palette.detail }]}>{detail}</Text>

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
                      icon={() => <X color="#666C7A" size={18} strokeWidth={2.2} />}
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
    minHeight: 30,
  },
  title: {
    ...textRoles.label,
    flex: 1,
    fontSize: textSizes.medium,
    lineHeight: 22,
    minHeight: 22,
  },
  infoButton: {
    borderColor: '#CBD2E4',
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: 10,
  },
  infoSpacer: {
    height: 42,
    marginLeft: 10,
    width: 42,
  },
  value: {
    ...textRoles.value,
  },
  detail: {
    ...textRoles.label,
  },
  dialogBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.34)',
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
    backgroundColor: '#EEF2FF',
    borderColor: '#CBD5FF',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  dialogEyebrow: {
    color: '#6A7285',
    ...textRoles.label,
    letterSpacing: 1.1,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  dialogTitle: {
    color: '#23293A',
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
    color: '#667085',
    ...textRoles.body,
    fontSize: 14,
    lineHeight: 22,
  },
});
