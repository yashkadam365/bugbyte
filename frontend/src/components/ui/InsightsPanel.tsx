'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  FileText,
  Target,
  AlertTriangle,
  Users,
  Clock,
  Zap,
  TrendingUp,
  ChevronRight,
  Activity
} from 'lucide-react';

interface InsightItem {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  type?: 'default' | 'warning' | 'success' | 'danger';
  onClick?: () => void;
}

interface InsightsPanelProps {
  title: string;
  icon?: ReactNode;
  items: InsightItem[];
  emptyMessage?: string;
  variant?: 'left' | 'right';
}

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05 }
  })
};

export function InsightsPanel({
  title,
  icon,
  items,
  emptyMessage = 'No items',
  variant = 'left'
}: InsightsPanelProps) {
  return (
    <div className="insights-panel">
      <div className="panel-header">
        <div className="panel-icon">{icon}</div>
        <span className="panel-title">{title}</span>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div style={{
            color: 'var(--text-muted)',
            fontSize: '13px',
            textAlign: 'center',
            padding: '20px'
          }}>
            {emptyMessage}
          </div>
        ) : (
          items.map((item, index) => (
            <motion.div
              key={item.id}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              className={`insight-item ${item.type || ''}`}
              onClick={item.onClick}
            >
              <div className="insight-item-title">{item.title}</div>
              {item.subtitle && (
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  marginBottom: '4px'
                }}>
                  {item.subtitle}
                </div>
              )}
              {item.meta && (
                <div className="insight-item-meta">
                  <Clock size={10} />
                  {item.meta}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// Pre-configured panels for specific use cases

interface Investigation {
  id: string;
  title: string;
  created_at: string;
  status?: string;
}

interface Entity {
  id: string;
  name: string;
  type: string;
  document_count?: number;
}

interface TimelineItem {
  id: string;
  description: string;
  date_str: string;
}

interface HealthAlert {
  id: string;
  title: string;
  severity: 'warning' | 'danger' | 'info';
  description?: string;
}

export function RecentInvestigationsPanel({
  investigations,
  onSelect
}: {
  investigations: Investigation[];
  onSelect: (id: string) => void;
}) {
  const items = investigations.slice(0, 8).map(inv => ({
    id: inv.id,
    title: inv.title,
    meta: new Date(inv.created_at).toLocaleDateString(),
    onClick: () => onSelect(inv.id)
  }));

  return (
    <InsightsPanel
      title="Recent Cases"
      icon={<Search size={16} />}
      items={items}
      emptyMessage="No investigations yet"
    />
  );
}

export function TopEntitiesPanel({
  entities,
  onSelect
}: {
  entities: Entity[];
  onSelect?: (entity: Entity) => void;
}) {
  const items = entities.slice(0, 10).map(entity => ({
    id: entity.id,
    title: entity.name,
    subtitle: entity.type,
    meta: entity.document_count ? `${entity.document_count} docs` : undefined,
    onClick: onSelect ? () => onSelect(entity) : undefined
  }));

  return (
    <InsightsPanel
      title="Top Entities"
      icon={<Users size={16} />}
      items={items}
      emptyMessage="No entities found"
      variant="right"
    />
  );
}

export function TimelineEventsPanel({
  events
}: {
  events: TimelineItem[];
}) {
  const items = events.slice(0, 8).map(event => ({
    id: event.id,
    title: event.description,
    meta: event.date_str
  }));

  return (
    <InsightsPanel
      title="Recent Events"
      icon={<Clock size={16} />}
      items={items}
      emptyMessage="No timeline events"
      variant="right"
    />
  );
}

export function HealthAlertsPanel({
  alerts
}: {
  alerts: HealthAlert[];
}) {
  const items = alerts.map(alert => ({
    id: alert.id,
    title: alert.title,
    subtitle: alert.description,
    type: alert.severity as 'warning' | 'danger' | 'default'
  }));

  return (
    <InsightsPanel
      title="Health Alerts"
      icon={<AlertTriangle size={16} />}
      items={items}
      emptyMessage="All systems healthy"
    />
  );
}

export function EvidenceInsightsPanel({
  evidenceCount,
  claimsCount,
  contradictions
}: {
  evidenceCount: number;
  claimsCount: number;
  contradictions: number;
}) {
  const items = [
    { id: '1', title: 'Evidence Files', subtitle: `${evidenceCount} uploaded` },
    { id: '2', title: 'Claims Extracted', subtitle: `${claimsCount} claims` },
    { id: '3', title: 'Contradictions', subtitle: `${contradictions} found`, type: contradictions > 0 ? 'warning' as const : 'default' as const }
  ];

  return (
    <InsightsPanel
      title="Evidence Insights"
      icon={<FileText size={16} />}
      items={items}
    />
  );
}

export function ImpactRankingsPanel({
  rankings
}: {
  rankings: { id: string; name: string; score: number }[];
}) {
  const items = rankings.slice(0, 6).map((item, idx) => ({
    id: item.id,
    title: `${idx + 1}. ${item.name}`,
    subtitle: `Impact: ${Math.round(item.score * 100)}%`
  }));

  return (
    <InsightsPanel
      title="Impact Rankings"
      icon={<TrendingUp size={16} />}
      items={items}
      emptyMessage="No rankings available"
      variant="right"
    />
  );
}

export default InsightsPanel;
