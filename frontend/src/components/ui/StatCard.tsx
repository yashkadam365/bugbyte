'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  value: number | string;
  label: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
}

const variantColors = {
  default: 'var(--gradient-primary)',
  primary: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
  success: 'linear-gradient(135deg, #10b981, #06b6d4)',
  warning: 'linear-gradient(135deg, #f59e0b, #ec4899)',
  danger: 'linear-gradient(135deg, #ef4444, #ec4899)'
};

const variantGlows = {
  default: 'rgba(59, 130, 246, 0.15)',
  primary: 'rgba(59, 130, 246, 0.2)',
  success: 'rgba(16, 185, 129, 0.2)',
  warning: 'rgba(245, 158, 11, 0.2)',
  danger: 'rgba(239, 68, 68, 0.2)'
};

export function StatCard({
  value,
  label,
  icon,
  trend,
  variant = 'default',
  onClick
}: StatCardProps) {
  return (
    <motion.div
      className="stat-card"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: `0 4px 20px ${variantGlows[variant]}`
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between'
      }}>
        <div>
          <div
            className="stat-value"
            style={{ background: variantColors[variant] }}
          >
            {value}
          </div>
          <div className="stat-label">{label}</div>
        </div>
        {icon && (
          <div style={{
            color: 'var(--text-muted)',
            opacity: 0.7
          }}>
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div style={{
          marginTop: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px',
          color: trend.direction === 'up' ? 'var(--accent-green)' : 'var(--accent-red)'
        }}>
          <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
          <span>{trend.value}%</span>
          <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>vs last week</span>
        </div>
      )}
    </motion.div>
  );
}

interface StatGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}

export function StatGrid({ children, columns = 4 }: StatGridProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '16px'
    }}>
      {children}
    </div>
  );
}

export default StatCard;
