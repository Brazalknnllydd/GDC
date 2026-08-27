import { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textSizes } from '../../constants/theme';
import { formatCompactTick } from './admin-chart-utils';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';
import { formatPeso } from '../../lib/product-utils';

type AdminLineChartDataset = {
  color: string;
  data: number[];
};

type AdminLineChartProps = {
  datasets: AdminLineChartDataset[];
  height?: number;
  labels: string[];
};

// Colors matching the requested premium white design
const chartColors = {
  background: '#FFFFFF',     // Pure white background
  grid: '#E2E8F0',           // Light Slate 200 grid lines
  axis: '#94A3B8',           // Muted Slate 400 axis lines
  text: '#475569',           // Darker Slate 600 labels
  cursor: '#94A3B8',         // Slate 400 vertical dashed line
  revenue: '#3B82F6',        // Bright blue
  discounts: '#EF4444',      // Bright red
};

const Y_SECTIONS = 4;
const Y_LABEL_WIDTH = 46;
const X_LABEL_HEIGHT = 28;
const PADDING_TOP = 20;
const PADDING_RIGHT = 16;

export function AdminLineChart({ datasets, height = 220, labels }: AdminLineChartProps) {
  const { compactPhone, width } = useResponsiveLayout();
  const [chartAreaWidth, setChartAreaWidth] = useState<number | null>(null);
  
  const fallbackChartWidth = Math.max(Math.min(width - (compactPhone ? 56 : 96), 1200), 248);
  const chartWidth = Math.max(chartAreaWidth ?? fallbackChartWidth, compactPhone ? 248 : 320);

  // Default to the last data point so the chart shows live metrics immediately
  const [selectedIndex, setSelectedIndex] = useState<number | null>(() => {
    return labels.length > 0 ? labels.length - 1 : null;
  });

  const maxValue = Math.max(...datasets.flatMap((ds) => ds.data), 0);
  const normalizedMax = maxValue > 0 ? maxValue * 1.15 : 100; // Extra headroom for visual aesthetics

  const plotWidth = chartWidth - Y_LABEL_WIDTH - PADDING_RIGHT;
  const plotHeight = height - X_LABEL_HEIGHT - PADDING_TOP;
  const n = labels.length;

  function xFor(i: number) {
    return Y_LABEL_WIDTH + (n <= 1 ? plotWidth / 2 : (i / (n - 1)) * plotWidth);
  }

  function yFor(value: number) {
    return PADDING_TOP + plotHeight - (value / normalizedMax) * plotHeight;
  }

  // Smooth cubic Bezier path generator
  function buildPath(data: number[]) {
    if (data.length === 0) return '';
    const pts = data.map((v, i) => ({ x: xFor(i), y: yFor(v) }));
    return pts
      .map((pt, i) => {
        if (i === 0) return `M ${pt.x} ${pt.y}`;
        const prev = pts[i - 1];
        const cpx = (prev.x + pt.x) / 2;
        return `C ${cpx} ${prev.y} ${cpx} ${pt.y} ${pt.x} ${pt.y}`;
      })
      .join(' ');
  }

  const yTicks = Array.from({ length: Y_SECTIONS + 1 }, (_, i) =>
    (normalizedMax * i) / Y_SECTIONS
  );

  const isDense = labels.length > 10;
  const labelStep = isDense ? Math.ceil(labels.length / 6) : 1;

  function handleChartLayout(event: LayoutChangeEvent) {
    const nextWidth = Math.floor(event.nativeEvent.layout.width);
    if (nextWidth > 0) setChartAreaWidth(nextWidth);
  }

  return (
    <View style={styles.wrap}>
      {/* Legend matching the image */}
      <View style={styles.legendContainer}>
        {datasets.map((ds, di) => (
          <View key={di} style={styles.legendItem}>
            <View style={styles.legendLineWrap}>
              <View style={[styles.legendLine, { backgroundColor: ds.color }]} />
              <View style={[styles.legendCircle, { borderColor: ds.color }]} />
            </View>
            <Text style={styles.legendText}>{di === 0 ? 'Revenue' : 'Discounts'}</Text>
          </View>
        ))}
      </View>

      <View onLayout={handleChartLayout} style={styles.chartContainer}>
        <Svg width={chartWidth} height={height}>
          {/* Grid lines (horizontal and vertical) */}
          {yTicks.map((tick, i) => {
            const y = yFor(tick);
            return (
              <Line
                key={`y-grid-${i}`}
                x1={Y_LABEL_WIDTH}
                y1={y}
                x2={chartWidth - PADDING_RIGHT}
                y2={y}
                stroke={chartColors.grid}
                strokeWidth={1}
              />
            );
          })}
          
          {labels.map((_, i) => {
            const x = xFor(i);
            return (
              <Line
                key={`x-grid-${i}`}
                x1={x}
                y1={PADDING_TOP}
                x2={x}
                y2={PADDING_TOP + plotHeight}
                stroke={chartColors.grid}
                strokeWidth={1}
                strokeOpacity={0.4}
              />
            );
          })}

          {/* Active indicator line */}
          {selectedIndex !== null && (
            <Line
              x1={xFor(selectedIndex)}
              y1={PADDING_TOP}
              x2={xFor(selectedIndex)}
              y2={PADDING_TOP + plotHeight}
              stroke={chartColors.cursor}
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          )}

          {/* Axis lines and ticks */}
          <Line
            x1={Y_LABEL_WIDTH}
            y1={PADDING_TOP}
            x2={Y_LABEL_WIDTH}
            y2={PADDING_TOP + plotHeight}
            stroke={chartColors.axis}
            strokeWidth={1.5}
          />
          <Line
            x1={Y_LABEL_WIDTH}
            y1={PADDING_TOP + plotHeight}
            x2={chartWidth - PADDING_RIGHT}
            y2={PADDING_TOP + plotHeight}
            stroke={chartColors.axis}
            strokeWidth={1.5}
          />

          {/* Y-axis labels & ticks */}
          {yTicks.map((tick, i) => {
            const y = yFor(tick);
            return (
              <Line
                key={`y-tick-${i}`}
                x1={Y_LABEL_WIDTH}
                y1={y}
                x2={Y_LABEL_WIDTH - 4}
                y2={y}
                stroke={chartColors.axis}
                strokeWidth={1.5}
              />
            );
          })}
          {yTicks.map((tick, i) => (
            <SvgText
              key={`y-lbl-${i}`}
              x={Y_LABEL_WIDTH - 8}
              y={yFor(tick) + 4}
              textAnchor="end"
              fontSize={textSizes.smallCaps}
              fill={chartColors.text}
              fontFamily={fonts.medium}>
              {formatCompactTick(String(tick))}
            </SvgText>
          ))}

          {/* X-axis labels & ticks */}
          {labels.map((label, i) => {
            const x = xFor(i);
            const showLabel = i % labelStep === 0;
            return (
              <Line
                key={`x-tick-${i}`}
                x1={x}
                y1={PADDING_TOP + plotHeight}
                x2={x}
                y2={PADDING_TOP + plotHeight + 4}
                stroke={chartColors.axis}
                strokeWidth={1.5}
              />
            );
          })}
          {labels.map((label, i) => {
            const x = xFor(i);
            const showLabel = i % labelStep === 0;
            return showLabel ? (
              <SvgText
                key={`x-lbl-${i}`}
                x={x}
                y={height - 6}
                textAnchor="middle"
                fontSize={textSizes.smallCaps}
                fill={chartColors.text}
                fontFamily={fonts.medium}>
                {label}
              </SvgText>
            ) : null;
          })}

          {/* Line paths */}
          {datasets.map((ds, di) => (
            <Path
              key={`path-${di}`}
              d={buildPath(ds.data)}
              stroke={ds.color}
              strokeWidth={3}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {/* Dot markers */}
          {labels.map((_, i) => {
            const x = xFor(i);
            const isSelected = selectedIndex === i;
            return datasets.map((ds, di) => {
              const y = yFor(ds.data[i] ?? 0);
              return (
                <Circle
                  key={`dot-${di}-${i}`}
                  cx={x}
                  cy={y}
                  r={isSelected ? 6 : 4}
                  fill={isSelected ? ds.color : chartColors.background}
                  stroke={ds.color}
                  strokeWidth={2}
                />
              );
            });
          })}
        </Svg>

        {/* Absolute touch overlay columns */}
        <View style={[StyleSheet.absoluteFillObject, styles.touchOverlay]}>
          {labels.map((_, i) => {
            const x = xFor(i);
            const sliceWidth = n <= 1 ? plotWidth : plotWidth / Math.max(n - 1, 1);
            return (
              <Pressable
                key={`touch-${i}`}
                onPress={() => setSelectedIndex(i)}
                style={{
                  position: 'absolute',
                  left: x - sliceWidth / 2,
                  width: sliceWidth,
                  top: 0,
                  bottom: 0,
                  backgroundColor: 'transparent',
                }}
              />
            );
          })}
        </View>
      </View>

      {/* Selected details banner below */}
      <View style={styles.valueBanner}>
        {selectedIndex !== null ? (
          <>
            <View>
              <Text style={styles.valueBannerLabel}>Selected period</Text>
              <Text style={styles.valueBannerTitle}>{labels[selectedIndex]}</Text>
            </View>
            <View style={styles.amountsRow}>
              {datasets.map((ds, di) => (
                <View key={di} style={styles.amountItem}>
                  <Text style={[styles.amountLabel, { color: ds.color }]}>
                    {di === 0 ? 'REVENUE' : 'DISCOUNTS'}
                  </Text>
                  <Text style={styles.valueBannerAmount}>
                    {formatPeso(ds.data[selectedIndex ?? 0] ?? 0)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.valueBannerHint}>Tap any line section to review the metrics.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: '100%',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendLineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    width: 24,
    height: 12,
    justifyContent: 'center',
  },
  legendLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    borderRadius: radius.round,
  },
  legendCircle: {
    width: 6,
    height: 6,
    borderRadius: radius.round,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  legendText: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
  },
  chartContainer: {
    backgroundColor: chartColors.background,
    borderColor: colors.borderPanel,
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  touchOverlay: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  valueBanner: {
    alignItems: 'center',
    backgroundColor: colors.surfaceInfo,
    borderColor: colors.borderInfoStrong,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
  },
  valueBannerLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: textSizes.smallCaps,
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  valueBannerTitle: {
    color: colors.textStrong,
    fontFamily: fonts.semiBold,
    fontSize: textSizes.body,
  },
  amountsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  amountItem: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 9,
    fontFamily: fonts.bold,
    letterSpacing: 0.8,
  },
  valueBannerAmount: {
    color: colors.textStrong,
    fontFamily: fonts.bold,
    fontSize: textSizes.bodyLarge,
  },
  valueBannerHint: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    width: '100%',
    textAlign: 'center',
  },
});
