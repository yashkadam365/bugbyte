"use client";

import { useEffect, useRef } from "react";

interface TimelineEventData {
    _id: string;
    date: string | null;
    approxDate: string | null;
    description: string;
    entitiesInvolved: string[];
}

interface Props {
    events: TimelineEventData[];
}

export default function TimelineView({ events }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<any>(null);

    useEffect(() => {
        // Dynamic import to avoid SSR issues
        let mounted = true;

        async function initTimeline() {
            if (!containerRef.current || !mounted) return;

            const visModule = await import("vis-timeline/standalone") as any;
            const Timeline = visModule.Timeline || visModule.default?.Timeline;
            const DataSet = visModule.DataSet || visModule.default?.DataSet;

            const items = new DataSet(
                events
                    .filter((e) => e.date || e.approxDate)
                    .map((e, idx) => ({
                        id: e._id || idx,
                        content: `<div style="max-width:280px">
              <div style="font-weight:600;font-size:12px;margin-bottom:2px">${e.description.slice(0, 80)}</div>
              <div style="font-size:10px;color:#94a3b8">${e.entitiesInvolved?.join(", ") || ""}</div>
            </div>`,
                        start: e.date || e.approxDate || "",
                        type: "box",
                    }))
            );

            if (timelineRef.current) {
                timelineRef.current.destroy();
            }

            const options = {
                height: "400px",
                min: new Date("2015-01-01"),
                max: new Date("2030-12-31"),
                zoomMin: 1000 * 60 * 60 * 24 * 7,    // 1 week
                zoomMax: 1000 * 60 * 60 * 24 * 365 * 5, // 5 years
                margin: { item: { horizontal: 10, vertical: 5 } },
                orientation: "top",
                stack: true,
                showCurrentTime: false,
                template: function (item: any) {
                    return item.content;
                },
            };

            // Custom CSS for dark theme
            const style = document.createElement("style");
            style.textContent = `
        .vis-timeline {
          background: transparent !important;
          border: none !important;
          font-family: Inter, sans-serif !important;
        }
        .vis-time-axis .vis-text {
          color: #94a3b8 !important;
          font-size: 11px !important;
        }
        .vis-time-axis .vis-grid.vis-minor {
          border-color: rgba(59, 130, 246, 0.08) !important;
        }
        .vis-time-axis .vis-grid.vis-major {
          border-color: rgba(59, 130, 246, 0.15) !important;
        }
        .vis-item {
          background: rgba(59, 130, 246, 0.15) !important;
          border: 1px solid rgba(59, 130, 246, 0.4) !important;
          border-radius: 8px !important;
          color: #e2e8f0 !important;
          padding: 6px 10px !important;
        }
        .vis-item.vis-selected {
          background: rgba(59, 130, 246, 0.3) !important;
          border-color: #3b82f6 !important;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.3) !important;
        }
        .vis-item .vis-item-content {
          padding: 0 !important;
        }
        .vis-panel.vis-center {
          border: none !important;
        }
        .vis-panel.vis-left {
          border: none !important;
        }
        .vis-panel.vis-bottom {
          border-top: 1px solid rgba(59, 130, 246, 0.15) !important;
        }
      `;
            containerRef.current?.appendChild(style);

            const timeline = new Timeline(containerRef.current!, items, options);
            timelineRef.current = timeline;

            // Fit to show all items
            setTimeout(() => {
                if (mounted) timeline.fit();
            }, 100);
        }

        initTimeline();

        return () => {
            mounted = false;
            if (timelineRef.current) {
                timelineRef.current.destroy();
            }
        };
    }, [events]);

    return (
        <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
                Investigation Timeline
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400, marginLeft: 8 }}>
                    {events.filter((e) => e.date || e.approxDate).length} events
                </span>
            </h3>
            <div ref={containerRef} style={{ borderRadius: 12, overflow: "hidden" }} />

            {/* Events without dates */}
            {events.filter((e) => !e.date && !e.approxDate).length > 0 && (
                <div style={{ marginTop: 20 }}>
                    <h4 style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>Undated Events</h4>
                    {events
                        .filter((e) => !e.date && !e.approxDate)
                        .map((e) => (
                            <div key={e._id} style={{
                                padding: "8px 12px", marginBottom: 6, borderRadius: 8,
                                background: "var(--bg-tertiary)", fontSize: 13,
                                borderLeft: "3px solid var(--accent-cyan)"
                            }}>
                                {e.description}
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}
