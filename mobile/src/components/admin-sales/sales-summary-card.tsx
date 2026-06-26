import { textSizes } from '../../constants/theme';
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
  return (
    <AdminMetricCard
      detail={detail}
      minHeight={140}
      paddingHorizontal={16}
      paddingVertical={16}
      title={title}
      titleColor="#262B39"
      titleLetterSpacing={2}
      titleMarginBottom={14}
      tone={detailTone}
      value={value}
      valueColor="#111D77"
      valueFontSize={textSizes.large}
      valueLineHeight={24}
      valueMarginBottom={10}
      width="48%"
    />
  );
}
