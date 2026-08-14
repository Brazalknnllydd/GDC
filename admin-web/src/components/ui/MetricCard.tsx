import { ReactNode, ComponentType } from 'react';

type MetricCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ComponentType<any>;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'primary' | 'secondary' | 'success' | 'danger';
};

const colorMap = {
  primary: { bg: 'var(--primary-light)', color: 'var(--primary)' },
  secondary: { bg: '#e0f2fe', color: 'var(--secondary)' },
  success: { bg: 'var(--success-light)', color: 'var(--success)' },
  danger: { bg: 'var(--danger-light)', color: 'var(--danger)' },
};

export function MetricCard({ title, value, subtitle, icon: Icon, trend, color = 'primary' }: MetricCardProps) {
  const style = colorMap[color];

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="flex items-center justify-between">
        <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </h3>
        <div style={{ backgroundColor: style.bg, color: style.color, padding: '0.5rem', borderRadius: '0.75rem' }}>
          <Icon size={20} />
        </div>
      </div>
      
      <div>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
          {value}
        </div>
        
        <div className="flex items-center gap-2 mt-2" style={{ fontSize: '0.875rem' }}>
          {trend && (
            <span style={{ color: trend.isPositive ? 'var(--success)' : 'var(--danger)', fontWeight: 500 }}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
          {subtitle && (
            <span style={{ color: 'var(--text-muted)' }}>{subtitle}</span>
          )}
        </div>
      </div>
    </div>
  );
}
