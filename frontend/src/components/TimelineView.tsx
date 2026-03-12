"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Calendar, ZoomIn, ZoomOut, Move } from "lucide-react";

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
        let mounted = true;

        async function initTimeline() {
            if (!containerRef.current || !mounted) return;

            const visModule = await import("vis-timeline/standalone") as any;
            const Timeline = visModule.Timeline || visModule.default?.Timeline;
            const DataSet = visModule.DataSet || visModule.default?.DataSet;

            // Filter events with dates
            const datedEvents = events.filter((e) => e.date || e.approxDate);

            if (datedEvents.length === 0) return;

            // Create items - with duration for proper stacking
            const items = new DataSet(
                datedEvents.map((e, idx) => {
                    const dateStr = e.date || e.approxDate!;
                    const startDate = new Date(dateStr);
                    const endDate = new Date(startDate);
                    endDate.setDate(startDate.getDate() + 1); // 1 day duration

                    return {
                        id: e._id || idx,
                        start: startDate,
                        end: endDate,
                        type: "range",
                        content: `<div style="padding:6px 10px;">
                            <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:2px;">${e.description}</div>
                            <div style="font-size:10px;color:#94a3b8;">${e.entitiesInvolved?.slice(0, 3).join(", ") || ""}</div>
                        </div>`,
                        className: e.date ? "confirmed-date" : "approx-date",
                    };
                })
            );

            if (timelineRef.current) {
                timelineRef.current.destroy();
            }

            // Stacked timeline options
            const options = {
                height: "600px",
                min: new Date("2015-01-01"),
                max: new Date("2030-12-31"),
                zoomMin: 1000 * 60 * 60 * 24 * 7,
                zoomMax: 1000 * 60 * 60 * 24 * 365 * 5,
                zoomable: true,
                horizontalScroll: true,
                verticalScroll: true,
                zoomKey: "ctrlKey",
                stack: true,
                stackSubgroups: true,
                showCurrentTime: false,
                orientation: "top",
                margin: {
                    item: {
                        horizontal: 10,
                        vertical: 10,
                    },
                    axis: 40,
                },
                itemsAlwaysDraggable: false,
                editable: false,
                selectable: true,
                multiselect: false,
            };

            // Apply dark theme CSS
            const style = document.createElement("style");
            style.textContent = `
                /* Dark theme for vis-timeline */
                .vis-timeline {
                    background: transparent !important;
                    border: none !important;
                    font-family: Inter, -apple-system, sans-serif !important;
                }

                /* Time axis */
                .vis-time-axis .vis-text {
                    color: #94a3b8 !important;
                    font-size: 11px !important;
                    font-weight: 600 !important;
                }

                .vis-time-axis .vis-grid.vis-minor {
                    border-color: rgba(59, 130, 246, 0.08) !important;
                }

                .vis-time-axis .vis-grid.vis-major {
                    border-color: rgba(59, 130, 246, 0.15) !important;
                }

                /* Event items */
                .vis-item {
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3)) !important;
                    border: 1px solid rgba(59, 130, 246, 0.5) !important;
                    border-radius: 8px !important;
                    color: #e2e8f0 !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
                    transition: all 0.2s ease !important;
                }

                .vis-item.confirmed-date {
                    border: 1px solid rgba(59, 130, 246, 0.6) !important;
                }

                .vis-item.approx-date {
                    border: 1px dashed rgba(139, 92, 246, 0.6) !important;
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3)) !important;
                }

                .vis-item.vis-selected {
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.5), rgba(139, 92, 246, 0.5)) !important;
                    border-color: #3b82f6 !important;
                    box-shadow: 0 0 16px rgba(59, 130, 246, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3) !important;
                }

                .vis-item:hover {
                    filter: brightness(1.2) !important;
                    box-shadow: 0 0 12px rgba(59, 130, 246, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3) !important;
                }

                .vis-item .vis-item-content {
                    padding: 0 !important;
                }

                /* Panel backgrounds */
                .vis-panel.vis-center {
                    border: none !important;
                }

                .vis-panel.vis-bottom {
                    border-top: 1px solid rgba(59, 130, 246, 0.2) !important;
                    background: rgba(17, 22, 56, 0.6) !important;
                }

                .vis-panel.vis-top {
                    border-bottom: 1px solid rgba(59, 130, 246, 0.2) !important;
                }

                /* Scrollbar styling */
                .vis-timeline::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }

                .vis-timeline::-webkit-scrollbar-track {
                    background: rgba(17, 22, 56, 0.5);
                    border-radius: 4px;
                }

                .vis-timeline::-webkit-scrollbar-thumb {
                    background: rgba(59, 130, 246, 0.4);
                    border-radius: 4px;
                }

                .vis-timeline::-webkit-scrollbar-thumb:hover {
                    background: rgba(59, 130, 246, 0.6);
                }

                /* Custom tooltip */
                .vis-tooltip {
                    background: rgba(6, 9, 24, 0.95) !important;
                    border: 1px solid rgba(59, 130, 246, 0.3) !important;
                    border-radius: 10px !important;
                    padding: 12px !important;
                    color: #e2e8f0 !important;
                    font-family: Inter, -apple-system, sans-serif !important;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
                    backdrop-filter: blur(12px) !important;
                }

                /* Current time line */
                .vis-custom-time {
                    background-color: rgba(59, 130, 246, 0.4) !important;
                    width: 2px !important;
                }
            `;
            containerRef.current?.appendChild(style);

            const timeline = new Timeline(containerRef.current!, items, options);
            timelineRef.current = timeline;

            // Fit to show all items after initialization
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

    const undatedEvents = events.filter((e) => !e.date && !e.approxDate);
    const datedEvents = events.filter((e) => e.date || e.approxDate);

    if (datedEvents.length === 0 && undatedEvents.length === 0) {
        return (
            <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
                <Calendar size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                <p>No timeline events to display</p>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
            }}>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <Calendar size={18} />
                        Investigation Timeline
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 28 }}>
                        {datedEvents.length} events • Ctrl+Scroll to zoom • Drag to navigate
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        color: "var(--text-muted)",
                        padding: "4px 10px",
                        background: "rgba(17, 22, 56, 0.5)",
                        borderRadius: 8,
                    }}>
                        <ZoomIn size={12} />
                        Zoom
                    </div>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        color: "var(--text-muted)",
                        padding: "4px 10px",
                        background: "rgba(17, 22, 56, 0.5)",
                        borderRadius: 8,
                    }}>
                        <Move size={12} />
                        Drag
                    </div>
                </div>
            </div>

            {/* Timeline Container */}
            {datedEvents.length > 0 && (
                <div style={{
                    background: "linear-gradient(180deg, rgba(6, 9, 24, 0.95) 0%, rgba(12, 16, 41, 0.98) 100%)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 16,
                    padding: 20,
                    overflow: "hidden",
                }}>
                    <div ref={containerRef} style={{ borderRadius: 12 }} />

                    {/* Legend */}
                    <div style={{
                        marginTop: 20,
                        paddingTop: 16,
                        borderTop: "1px solid rgba(59, 130, 246, 0.1)",
                        display: "flex",
                        gap: 20,
                        fontSize: 11,
                        color: "var(--text-muted)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{
                                width: 20,
                                height: 8,
                                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3))",
                                border: "1px solid rgba(59, 130, 246, 0.5)",
                                borderRadius: 4,
                            }} />
                            Confirmed Date
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{
                                width: 20,
                                height: 8,
                                background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3))",
                                border: "1px dashed rgba(139, 92, 246, 0.5)",
                                borderRadius: 4,
                            }} />
                            Approximate Date
                        </div>
                    </div>
                </div>
            )}

            {/* Undated Events */}
            {undatedEvents.length > 0 && (
                <div style={{ marginTop: 24 }}>
                    <h4 style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        marginBottom: 12,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                    }}>
                        Undated Events ({undatedEvents.length})
                    </h4>
                    <div style={{ display: "grid", gap: 8 }}>
                        {undatedEvents.map((e, idx) => (
                            <motion.div
                                key={e._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                style={{
                                    padding: "12px 16px",
                                    borderRadius: 10,
                                    background: "rgba(17, 22, 56, 0.5)",
                                    border: "1px solid var(--border-subtle)",
                                    borderLeft: "3px solid var(--accent-cyan)",
                                    fontSize: 13,
                                    lineHeight: 1.5,
                                }}
                            >
                                <div style={{ color: "var(--text-primary)", marginBottom: 4 }}>
                                    {e.description}
                                </div>
                                {e.entitiesInvolved && e.entitiesInvolved.length > 0 && (
                                    <div style={{
                                        fontSize: 11,
                                        color: "var(--text-muted)",
                                        marginTop: 4,
                                    }}>
                                        👥 {e.entitiesInvolved.join(", ")}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
