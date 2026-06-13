import { useState } from 'react';
import { CalendarDays, Rocket, Upload } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  bestSellingProducts,
  categoryPerformance,
  exportActions,
  insightCards,
  paymentDistribution,
  reportMetrics,
  reportTabs,
  salesAnalyticsBars,
  salesAnalyticsTabs,
} from '../components/admin-reports/reports-screen-data';
import { BestSellingProductRow } from '../components/admin-reports/best-selling-product-row';
import { CategoryPerformanceRow } from '../components/admin-reports/category-performance-row';
import { PaymentDistributionRow } from '../components/admin-reports/payment-distribution-row';
import { ReportActionButton } from '../components/admin-reports/report-action-button';
import { AdminMetricCard } from '../components/ui/admin-metric-card';
import { AdminMetricGrid } from '../components/ui/admin-metric-grid';
import { AdminPageScreen } from '../components/ui/admin-page-screen';
import { SectionHeading } from '../components/ui/section-heading';
import { SurfaceCard } from '../components/ui/surface-card';
import { layout, radius, spacing } from '../constants/design-system';
import { colors, textRoles, textSizes } from '../constants/theme';

export default function AdminReportsScreen() {
  const [selectedAnalyticsTab, setSelectedAnalyticsTab] =
    useState<(typeof salesAnalyticsTabs)[number]>('Daily');

  return (
    <AdminPageScreen
      title="Reports"
      introDescription="Track revenue, profitability, and store performance in one place."
      bottomNavItems={reportTabs}
      introChildren={
        <View style={styles.filterToolbar}>
          <View style={styles.datePill}>
            <Text style={styles.datePillText}>Oct 1 - Oct 31</Text>
            <CalendarDays color="#4A5063" size={16} strokeWidth={2} />
          </View>

          <Pressable style={styles.toolbarIconButton}>
            <Upload color={colors.secondary} size={18} strokeWidth={2} />
          </Pressable>
        </View>
      }>
      <AdminMetricGrid>
        {reportMetrics.map((metric) => (
          <AdminMetricCard
            key={metric.title}
            detail={metric.detail}
            title={metric.title}
            tone={metric.tone}
            value={metric.value}
          />
        ))}
      </AdminMetricGrid>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Sales Analytics</Text>
        <View style={styles.analyticsTabs}>
          {salesAnalyticsTabs.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setSelectedAnalyticsTab(tab)}
              style={[
                styles.analyticsTabButton,
                selectedAnalyticsTab === tab && styles.analyticsTabButtonActive,
              ]}>
              <Text
                style={[
                  styles.analyticsTabText,
                  selectedAnalyticsTab === tab && styles.analyticsTabTextActive,
                ]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <SurfaceCard style={styles.analyticsCard}>
        <View style={styles.analyticsLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendRevenue]} />
            <Text style={styles.legendText}>Revenue</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendProfit]} />
            <Text style={styles.legendText}>Profit</Text>
          </View>
        </View>

        <View style={styles.chartColumns}>
          {salesAnalyticsBars.map((bar) => (
            <View key={bar.label} style={styles.chartColumn}>
              <View style={styles.barGroup}>
                <View
                  style={[
                    styles.revenueBar,
                    { height: bar.revenueHeight },
                    bar.active && styles.revenueBarActive,
                  ]}
                />
                <View
                  style={[
                    styles.profitBar,
                    { height: bar.profitHeight },
                    bar.active && styles.profitBarActive,
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </SurfaceCard>

      <SectionHeading style={styles.sectionHeading}>BUSINESS INSIGHTS</SectionHeading>
      <View style={styles.insightsStack}>
        <View style={styles.heroInsightCard}>
          <View>
            <Text style={styles.heroInsightLabel}>{insightCards[0]?.title}</Text>
            <Text style={styles.heroInsightValue}>{insightCards[0]?.value}</Text>
          </View>
          <Rocket color="#6B74C5" size={34} strokeWidth={2} />
        </View>

        <View style={styles.insightPair}>
          {insightCards.slice(1).map((card) => (
            <SurfaceCard
              key={card.title}
              style={[
                styles.insightTile,
                card.tone === 'danger' && styles.insightTileDanger,
                card.tone === 'neutral' && styles.insightTileNeutral,
              ]}>
              <Text
                style={[
                  styles.insightTileLabel,
                  card.tone === 'danger' && styles.insightTileLabelLight,
                ]}>
                {card.title}
              </Text>
              <Text
                style={[
                  styles.insightTileValue,
                  card.tone === 'danger' && styles.insightTileValueLight,
                ]}>
                {card.value}
              </Text>
            </SurfaceCard>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Best Selling Products</Text>
      <SurfaceCard style={styles.listCard}>
        {bestSellingProducts.map((product, index) => (
          <View key={product.name}>
            <BestSellingProductRow {...product} />
            {index < bestSellingProducts.length - 1 ? <View style={styles.separator} /> : null}
          </View>
        ))}
      </SurfaceCard>

      <Text style={styles.sectionTitle}>Category Performance</Text>
      <SurfaceCard style={styles.performanceCard}>
        {categoryPerformance.map((category) => (
          <CategoryPerformanceRow key={category.label} {...category} />
        ))}
      </SurfaceCard>

      <Text style={styles.sectionTitle}>Payment Distribution</Text>
      <SurfaceCard style={styles.paymentCard}>
        {paymentDistribution.map((payment) => (
          <PaymentDistributionRow key={payment.label} {...payment} />
        ))}
      </SurfaceCard>

      <View style={styles.exportRow}>
        {exportActions.map((action) => (
          <ReportActionButton key={action.label} {...action} />
        ))}
      </View>
    </AdminPageScreen>
  );
}

const styles = StyleSheet.create({
  filterToolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -6,
  },
  datePill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F4F5F8',
    borderColor: '#CDD2DF',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 1,
  },
  datePillText: {
    color: '#373D4C',
    ...textRoles.label,
    marginRight: spacing.sm,
  },
  toolbarIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.block,
  },
  sectionTitle: {
    color: '#171C28',
    ...textRoles.value,
    fontSize: textSizes.large,
  },
  analyticsTabs: {
    backgroundColor: '#F0F1F5',
    borderRadius: radius.md,
    flexDirection: 'row',
    padding: 4,
  },
  analyticsTabButton: {
    borderRadius: radius.sm - 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  analyticsTabButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  analyticsTabText: {
    color: '#3C4354',
    ...textRoles.label,
  },
  analyticsTabTextActive: {
    color: colors.secondary,
  },
  analyticsCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  analyticsLegend: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: spacing.lg,
  },
  legendDot: {
    borderRadius: radius.round,
    height: 8,
    marginRight: spacing.sm,
    width: 8,
  },
  legendRevenue: {
    backgroundColor: colors.secondary,
  },
  legendProfit: {
    backgroundColor: colors.tertiary,
  },
  legendText: {
    color: '#5A6071',
    ...textRoles.label,
  },
  chartColumns: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 176,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  barGroup: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  revenueBar: {
    backgroundColor: '#D9DCE8',
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    marginRight: 5,
    width: 18,
  },
  revenueBarActive: {
    backgroundColor: colors.secondary,
  },
  profitBar: {
    backgroundColor: '#ECEEF6',
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    width: 18,
  },
  profitBarActive: {
    backgroundColor: '#C7CDEE',
  },
  sectionHeading: {
    marginBottom: spacing.md,
    marginTop: spacing.block,
  },
  insightsStack: {
    marginBottom: spacing.section,
  },
  heroInsightCard: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  heroInsightLabel: {
    color: '#D7DBFF',
    ...textRoles.label,
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  heroInsightValue: {
    color: '#FFFFFF',
    ...textRoles.heading,
  },
  insightPair: {
    flexDirection: 'row',
    gap: layout.cardGap,
  },
  insightTile: {
    flex: 1,
    minHeight: 102,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  insightTileDanger: {
    backgroundColor: colors.tertiary,
    borderColor: '#C21F23',
  },
  insightTileNeutral: {
    backgroundColor: '#F1F2F6',
  },
  insightTileLabel: {
    color: '#777D8E',
    ...textRoles.label,
    marginBottom: 8,
  },
  insightTileLabelLight: {
    color: '#FFE8E8',
  },
  insightTileValue: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: textSizes.large - 2,
    lineHeight: 28,
  },
  insightTileValueLight: {
    color: '#FFFFFF',
  },
  listCard: {
    marginBottom: spacing.section,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  separator: {
    backgroundColor: '#E5E8F0',
    height: 1,
    width: '100%',
  },
  performanceCard: {
    marginBottom: spacing.section,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  paymentCard: {
    marginBottom: spacing.section,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  exportRow: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
  },
});
