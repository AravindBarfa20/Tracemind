import React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import Card from '../Card/Card';
import './MetricCard.css';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number | string;
    isPositive: boolean;
  };
  icon?: string;
  color?: 'teal' | 'coral' | 'blue' | 'green' | 'rose';
  sparklineData?: number[];
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  icon,
  color = 'teal',
  sparklineData,
  className = '',
}) => {
  // Format standard sparkline mock charts
  const chartData = sparklineData
    ? sparklineData.map((val, idx) => ({ id: idx, value: val }))
    : [];

  const getThemeColor = () => {
    switch (color) {
      case 'coral': return 'var(--color-accent-500)';
      case 'blue': return 'var(--color-info-500)';
      case 'green': return 'var(--color-success-500)';
      case 'rose': return 'var(--color-error-500)';
      default: return 'var(--color-primary-500)';
    }
  };

  const getThemeBg = () => {
    switch (color) {
      case 'coral': return 'var(--color-accent-50)';
      case 'blue': return 'var(--color-info-50)';
      case 'green': return 'var(--color-success-50)';
      case 'rose': return 'var(--color-error-50)';
      default: return 'var(--color-primary-50)';
    }
  };

  return (
    <Card variant="default" hover className={`metric-card ${color} ${className}`}>
      <div className="metric-card-top">
        <span className="metric-card-title">{title}</span>
        {icon && (
          <div className="metric-card-icon-wrapper" style={{ backgroundColor: getThemeBg() }}>
            <span className="metric-card-icon">{icon}</span>
          </div>
        )}
      </div>

      <div className="metric-card-middle">
        <h3 className="metric-card-value">{value}</h3>
        {trend && (
          <div className={`metric-card-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
            <span className="trend-arrow">{trend.isPositive ? '▴' : '▾'}</span>
            <span className="trend-value">{trend.value}</span>
          </div>
        )}
      </div>

      {chartData.length > 0 && (
        <div className="metric-card-chart-area">
          <ResponsiveContainer width="100%" height={40}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={getThemeColor()} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={getThemeColor()} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={getThemeColor()}
                strokeWidth={1.5}
                fillOpacity={1}
                fill={`url(#gradient-${color})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};
export default MetricCard;
