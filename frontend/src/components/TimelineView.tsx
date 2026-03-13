"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Calendar, ZoomIn, Move } from "lucide-react";
import type { TimelineEventData } from "@/lib/types";

// TimelineEventData imported from @/lib/types

interface Props {
    events: TimelineEventData[];
}

export default function TimelineView({ events }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<any>(null);
    const styleRef = useRef<HTMLStyleElement | null>(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        // Guard: prevent double initialization
        if (initializedRef.current) return;

        let mounted = true;

        async function initTimeline() {
            if (!containerRef.current || !mounted) return;

            const visModule = await import("vis-timeline/standalone") as any;
            const Timeline = visModule.Timeline || visModule.default?.Timeline;
            const DataSet = visModule.DataSet || visModule.default?.DataSet;

            if (!mounted || !containerRef.current) return;

            // Filter events with dates
            const datedEvents = events.filter((e) => e.date || e.approxDate);

            if (datedEvents.length === 0) return;

            // Create items — pill-shaped bars with clipped text
            const items = new DataSet(
                datedEvents.map((e, idx) => {
                    const dateStr = e.date || e.approxDate!;
                    const startDate = new Date(dateStr);
                    const endDate = new Date(startDate);
                    endDate.setDate(startDate.getDate() + 1);

                    const entityTag = e.entitiesInvolved?.slice(0, 2).join(", ") || "";

                    return {
                        id: e._id || idx,
                        start: startDate,
                        end: endDate,
                        type: "range",
                        content: `<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;width:100%;">${e.description}</div>`,
                        title: `${e.description}\n${startDate.toLocaleDateString()}${entityTag ? `\n${entityTag}` : ""}`,
                        className: e.date ? "tl-confirmed" : "tl-approx",
                    };
                })
            );

            // Destroy previous instance if it exists
            if (timelineRef.current) {
                timelineRef.current.destroy();
                timelineRef.current = null;
            }

            // Timeline options — stacked, zoomable, draggable
            const options = {
                height: "500px",
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
                overflow: "hidden",
                maxHeight: 400,
                margin: {
                    item: {
                        horizontal: 10,
                        vertical: 8,
                    },
                    axis: 36,
                },
                itemsAlwaysDraggable: false,
                editable: false,
                selectable: true,
                multiselect: false,
                tooltip: {
                    followMouse: true,
                    overflowMethod: "cap",
                },
            };

            // Inject styled CSS — store reference for cleanup
            if (styleRef.current) {
                styleRef.current.remove();
                styleRef.current = null;
            }

            const style = document.createElement("style");
            style.textContent = `
                /* ═══ NEXUS Timeline — Bitcoin Fire Theme ═══ */

                .vis-timeline {
                    background: transparent !important;
                    border: none !important;
                    font-family: 'Inter', -apple-system, sans-serif !important;
                }

                /* ─── Time Axis ─── */
                .vis-time-axis .vis-text {
                    color: #94A3B8 !important;
                    font-size: 10px !important;
                    font-weight: 600 !important;
                    font-family: 'JetBrains Mono', monospace !important;
                    letter-spacing: 0.04em !important;
                }

                .vis-time-axis .vis-grid.vis-minor {
                    border-color: rgba(255, 255, 255, 0.04) !important;
                }

                .vis-time-axis .vis-grid.vis-major {
                    border-color: rgba(255, 255, 255, 0.08) !important;
                }

                /* ─── Event Items — Pill Bars ─── */
                /* DO NOT set height or overflow on .vis-item — it breaks stacking */
                .vis-item {
                    background: linear-gradient(135deg, #EA580C, #F7931A) !important;
                    border: none !important;
                    border-left: 2px solid #FFD600 !important;
                    border-radius: 14px !important;
                    color: #ffffff !important;
                    box-shadow: 0 2px 8px rgba(247, 147, 26, 0.15) !important;
                    overflow: hidden !important;
                    max-width: 100% !important;
                }

                .vis-item.tl-confirmed {
                    border-left: 2px solid #FFD600 !important;
                }

                .vis-item.tl-approx {
                    background: #1E293B !important;
                    border: 1px solid rgba(247, 147, 26, 0.3) !important;
                    border-left: 2px solid rgba(247, 147, 26, 0.5) !important;
                    color: #e2e8f0 !important;
                }

                .vis-item.vis-selected {
                    background: linear-gradient(135deg, #F7931A, #FFD600) !important;
                    box-shadow: 0 0 16px rgba(247, 147, 26, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3) !important;
                }

                .vis-item:hover {
                    filter: brightness(1.15) !important;
                    box-shadow: 0 0 12px rgba(247, 147, 26, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3) !important;
                }

                /* ─── Item Content ─── */
                .vis-item .vis-item-content {
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    white-space: nowrap !important;
                    max-width: 100% !important;
                    padding: 4px 8px !important;
                }

                .vis-item-overflow {
                    overflow: hidden !important;
                }

                .tl-bar-content {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .tl-bar-text {
                    font-size: 11px;
                    font-weight: 500;
                    font-family: 'Inter', sans-serif;
                    color: white;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .tl-approx .tl-bar-text {
                    color: #e2e8f0;
                }

                .tl-bar-entity {
                    font-size: 9px;
                    font-family: 'JetBrains Mono', monospace;
                    color: rgba(255, 255, 255, 0.5);
                    margin-left: 4px;
                }

                /* ─── Panels ─── */
                .vis-panel.vis-center {
                    border: none !important;
                }

                .vis-panel.vis-bottom {
                    border-top: 1px solid rgba(255, 255, 255, 0.06) !important;
                    background: rgba(3, 3, 4, 0.6) !important;
                }

                .vis-panel.vis-top {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
                }

                .vis-panel.vis-left,
                .vis-panel.vis-right {
                    border: none !important;
                }

                /* ─── Tooltip ─── */
                .vis-tooltip {
                    background: rgba(15, 17, 21, 0.95) !important;
                    border: 1px solid rgba(247, 147, 26, 0.3) !important;
                    border-radius: 10px !important;
                    padding: 10px 14px !important;
                    color: #e2e8f0 !important;
                    font-family: 'Inter', -apple-system, sans-serif !important;
                    font-size: 12px !important;
                    line-height: 1.5 !important;
                    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5), 0 0 20px rgba(247, 147, 26, 0.1) !important;
                    backdrop-filter: blur(16px) !important;
                    white-space: pre-line !important;
                    max-width: 300px !important;
                }

                /* ─── Current Time ─── */
                .vis-custom-time {
                    background-color: rgba(247, 147, 26, 0.4) !important;
                    width: 2px !important;
                }

                /* ─── Scrollbar ─── */
                .vis-timeline::-webkit-scrollbar {
                    width: 5px;
                    height: 5px;
                }
                .vis-timeline::-webkit-scrollbar-track {
                    background: rgba(15, 17, 21, 0.5);
                    border-radius: 3px;
                }
                .vis-timeline::-webkit-scrollbar-thumb {
                    background: rgba(247, 147, 26, 0.25);
                    border-radius: 3px;
                }
                .vis-timeline::-webkit-scrollbar-thumb:hover {
                    background: rgba(247, 147, 26, 0.45);
                }
            `;
            containerRef.current?.appendChild(style);
            styleRef.current = style;

            const timeline = new Timeline(containerRef.current!, items, options);
            timelineRef.current = timeline;
            initializedRef.current = true;

            // Fit to show all items
            setTimeout(() => {
                if (mounted && timeline) timeline.fit();
            }, 150);
        }

        initTimeline();

        return () => {
            mounted = false;
            if (timelineRef.current) {
                timelineRef.current.destroy();
                timelineRef.current = null;
            }
            if (styleRef.current) {
                styleRef.current.remove();
                styleRef.current = null;
            }
            initializedRef.current = false;
        };
    }, [events]);

    const undatedEvents = events.filter((e) => !e.date && !e.approxDate);
    const datedEvents = events.filter((e) => e.date || e.approxDate);

    if (datedEvents.length === 0 && undatedEvents.length === 0) {
        return (
            <div style={{
                textAlign: "center",
                padding: 60,
                color: "var(--text-muted)"
            }}>
                <Calendar size={40} style={{ margin: "0 auto 12px", opacity: 0.3, color: "var(--accent-orange)" }} />
                <p style={{ fontFamily: "var(--font-body)" }}>No timeline events to display</p>
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
                    <h3 style={{
                        fontSize: 16,
                        fontWeight: 700,
                        fontFamily: "var(--font-heading)",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 6,
                        color: "var(--text-primary)"
                    }}>
                        <Calendar size={18} color="var(--accent-orange)" />
                        Investigation Timeline
                        <span style={{
                            fontSize: 12,
                            fontFamily: "var(--font-mono)",
                            fontWeight: 600,
                            color: "var(--accent-orange)",
                            background: "rgba(247, 147, 26, 0.1)",
                            padding: "2px 10px",
                            borderRadius: 9999,
                            border: "1px solid rgba(247, 147, 26, 0.2)",
                        }}>
                            {datedEvents.length}
                        </span>
                    </h3>
                    <p style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginLeft: 28,
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.02em"
                    }}>
                        Ctrl+Scroll to zoom · Drag to navigate
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 11,
                        color: "var(--text-muted)",
                        padding: "5px 12px",
                        background: "transparent",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: 9999,
                        fontFamily: "var(--font-mono)",
                        cursor: "default",
                        transition: "all 0.2s ease",
                    }}>
                        <ZoomIn size={12} />
                        Zoom
                    </div>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 11,
                        color: "var(--text-muted)",
                        padding: "5px 12px",
                        background: "transparent",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: 9999,
                        fontFamily: "var(--font-mono)",
                        cursor: "default",
                        transition: "all 0.2s ease",
                    }}>
                        <Move size={12} />
                        Drag
                    </div>
                </div>
            </div>

            {/* Timeline Container */}
            {datedEvents.length > 0 && (
                <div style={{
                    background: "#0F1115",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 16,
                    padding: 20,
                    boxShadow: "0 0 40px -15px rgba(247, 147, 26, 0.15)",
                }}>
                    <div
                        ref={containerRef}
                        style={{
                            borderRadius: 12,
                            cursor: "grab",
                        }}
                    />

                    {/* Legend */}
                    <div style={{
                        marginTop: 16,
                        paddingTop: 14,
                        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                        display: "flex",
                        gap: 24,
                        fontSize: 11,
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-mono)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                                width: 24,
                                height: 8,
                                background: "linear-gradient(135deg, #EA580C, #F7931A)",
                                borderLeft: "2px solid #FFD600",
                                borderRadius: 9999,
                            }} />
                            Confirmed
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                                width: 24,
                                height: 8,
                                background: "#1E293B",
                                border: "1px solid rgba(247, 147, 26, 0.3)",
                                borderRadius: 9999,
                            }} />
                            Approximate
                        </div>
                    </div>
                </div>
            )}

            {/* Undated Events */}
            {undatedEvents.length > 0 && (
                <div style={{ marginTop: 24 }}>
                    <h4 style={{
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: "var(--font-heading)",
                        color: "var(--text-muted)",
                        marginBottom: 12,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
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
                                    background: "rgba(15, 17, 21, 0.6)",
                                    border: "1px solid rgba(255, 255, 255, 0.06)",
                                    borderLeft: "3px solid var(--accent-orange)",
                                    fontSize: 13,
                                    lineHeight: 1.5,
                                }}
                            >
                                <div style={{ color: "var(--text-primary)", marginBottom: 4 }}>
                                    {e.description}
                                </div>
                                {e.entitiesInvolved && e.entitiesInvolved.length > 0 && (
                                    <div style={{
                                        fontSize: 10,
                                        color: "var(--text-muted)",
                                        fontFamily: "var(--font-mono)",
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
