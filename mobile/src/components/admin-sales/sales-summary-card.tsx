import { useResponsiveLayout } from '../../hooks/use-responsive-layout';
import { colors, textSizes } from '../../constants/theme';
import { AdminMetricCard } from '../ui/admin-metric-card';

type SalesSummaryCardProps = {
  detail: string;
  detailTone?: 'positive' | 'negative' | 'neutral';
  title: string;
  value: string;
};

export function SalesSummaryCard({
  detail,
  detailTone = 'neutral',
  title,
  value,
}: SalesSummaryCardProps) {
  const { isTablet, isWideTablet } = useResponsiveLayout();
  const cardWidth = isWideTablet ? '23.5%' : isTablet ? '48%' : '48%';

  return (
    <AdminMetricCard
      detail={detail}
      minHeight={138}
      paddingHorizontal={18}
      paddingVertical={18}
      title={title}
      titleColor={colors.textHeading}
      titleLetterSpacing={1.8}
      titleMarginBottom={16}
      tone={detailTone}
      value={value}
      valueColor={colors.neutral}
      valueFontSize={21}
      valueLineHeight={26}
      valueMarginBottom={8}
      width={cardWidth}
    />
  );
}
