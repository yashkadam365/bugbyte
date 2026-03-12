"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";

interface Entity {
    _id: string;
    name: string;
    type: string;
    documentCount: number;
    noveltyScore: number;
}

interface Relationship {
    _id: string;
    sourceEntityId: string;
    targetEntityId: string;
    sourceName: string;
    targetName: string;
    type: string;
    confidence: number;
}

interface Props {
    entities: Entity[];
    relationships: Relationship[];
}

const typeColors: Record<string, string> = {
    person: "#3b82f6",
    organization: "#8b5cf6",
    location: "#10b981",
    date: "#f59e0b",
    event: "#ec4899",
    unknown: "#64748b",
};

// Glow colors for each type (slightly brighter/more saturated)
const typeGlowColors: Record<string, string> = {
    person: "rgba(59, 130, 246, 0.6)",
    organization: "rgba(139, 92, 246, 0.6)",
    location: "rgba(16, 185, 129, 0.6)",
    date: "rgba(245, 158, 11, 0.6)",
    event: "rgba(236, 72, 153, 0.6)",
    unknown: "rgba(100, 116, 139, 0.4)",
};

// Edge colors based on source type
const edgeColors: Record<string, string> = {
    person: "rgba(59, 130, 246, 0.5)",
    organization: "rgba(139, 92, 246, 0.5)",
    location: "rgba(16, 185, 129, 0.5)",
    event: "rgba(236, 72, 153, 0.5)",
    default: "rgba(59, 130, 246, 0.4)",
};

export default function EntityGraph({ entities, relationships }: Props) {
    const cyRef = useRef<any>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    const elements = useMemo(() => {
        // 1. Remove date-type entities
        const filtered = entities.filter((e) => e.type !== "date");

        // 2. Deduplicate by normalized name — first occurrence wins
        const seen = new Set<string>();
        const deduped = filtered.filter((e) => {
            const key = e.name.toLowerCase().trim();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // 3. Keep top 15 by documentCount
        const top = deduped
            .sort((a, b) => b.documentCount - a.documentCount)
            .slice(0, 15);

        const nodeIds = new Set(top.map((e) => e._id));
        const nodeTypeMap = new Map(top.map((e) => [e._id, e.type]));

        const nodes = top.map((e) => ({
            data: {
                id: e._id,
                label: e.name,
                type: e.type,
                size: 44 + e.documentCount * 7,
                color: typeColors[e.type] || typeColors.unknown,
                glowColor: typeGlowColors[e.type] || typeGlowColors.unknown,
            },
        }));

        // 4. Only include edges where both endpoints survived filtering
        const edges = relationships
            .filter((r) => nodeIds.has(r.sourceEntityId) && nodeIds.has(r.targetEntityId))
            .map((r) => {
                const sourceType = nodeTypeMap.get(r.sourceEntityId) || "default";
                return {
                    data: {
                        id: r._id,
                        source: r.sourceEntityId,
                        target: r.targetEntityId,
                        label: r.type.replace(/_/g, " "),
                        width: Math.max(1.5, r.confidence * 4),
                        color: edgeColors[sourceType] || edgeColors.default,
                    },
                };
            });

        return [...nodes, ...edges];
    }, [entities, relationships]);

    // Apply glow effect using shadow
    useEffect(() => {
        if (cyRef.current) {
            const cy = cyRef.current;

            // Add hover animations
            cy.on("mouseover", "node", (e: any) => {
                const node = e.target;
                setHoveredNode(node.id());
                node.animate({
                    style: {
                        "border-width": 4,
                        "border-opacity": 1,
                    },
                    duration: 150,
                });
            });

            cy.on("mouseout", "node", (e: any) => {
                const node = e.target;
                setHoveredNode(null);
                node.animate({
                    style: {
                        "border-width": 3,
                        "border-opacity": 0.8,
                    },
                    duration: 150,
                });
            });
        }
    }, [elements]);

    const stylesheet: any[] = [
        {
            selector: "node",
            style: {
                "background-color": "data(color)" as any,
                "background-opacity": 0.9,
                label: "data(label)",
                width: "data(size)" as any,
                height: "data(size)" as any,
                color: "#e2e8f0",
                "font-size": "12px",
                "font-weight": 500,
                "font-family": "Inter, -apple-system, sans-serif",
                "text-valign": "bottom",
                "text-margin-y": 10,
                "border-width": 3,
                "border-color": "data(color)" as any,
                "border-opacity": 0.8,
                "text-outline-width": 3,
                "text-outline-color": "#060918",
                "text-outline-opacity": 1,
                "overlay-opacity": 0,
                // Glow effect via border
                "shadow-blur": 20,
                "shadow-color": "data(glowColor)" as any,
                "shadow-opacity": 0.8,
                "shadow-offset-x": 0,
                "shadow-offset-y": 0,
            } as any,
        },
        {
            selector: "edge",
            style: {
                width: "data(width)" as any,
                "line-color": "data(color)" as any,
                "line-opacity": 0.7,
                "target-arrow-color": "data(color)" as any,
                "target-arrow-shape": "triangle",
                "arrow-scale": 1.2,
                "curve-style": "bezier",
                label: "",
                color: "#94a3b8",
                "font-size": "10px",
                "text-rotation": "autorotate",
                "text-outline-width": 2,
                "text-outline-color": "#060918",
                "line-cap": "round",
            } as any,
        },
        {
            selector: "node:selected",
            style: {
                "border-width": 5,
                "border-color": "#ffffff",
                "shadow-blur": 30,
                "shadow-opacity": 1,
            } as any,
        },
        {
            selector: "edge:selected",
            style: {
                "line-opacity": 1,
                width: 4,
            } as any,
        },
    ];

    return (
        <div className="graph-container" style={{ position: "relative", width: "100%", height: "100%", minHeight: "500px" }}>
            {/* Ambient glow background */}
            <div style={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(ellipse at center, rgba(59, 130, 246, 0.08) 0%, transparent 60%)",
                pointerEvents: "none",
                zIndex: 0,
            }} />

            <CytoscapeComponent
                elements={elements}
                stylesheet={stylesheet}
                cy={(cy: any) => { cyRef.current = cy; }}
                layout={{
                    name: "cose",
                    animate: true,
                    animationDuration: 800,
                    animationEasing: "ease-out-cubic",
                    nodeRepulsion: 600000,
                    idealEdgeLength: 200,
                    gravity: 0.2,
                    padding: 60,
                    nodeDimensionsIncludeLabels: true,
                } as any}
                style={{
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(180deg, rgba(6, 9, 24, 0.95) 0%, rgba(12, 16, 41, 0.98) 100%)",
                    borderRadius: 16,
                    position: "relative",
                    zIndex: 1,
                }}
                userZoomingEnabled={true}
                userPanningEnabled={true}
                boxSelectionEnabled={true}
            />

            {/* Enhanced Legend */}
            <div style={{
                position: "absolute", bottom: 16, left: 16,
                display: "flex", gap: 14, flexWrap: "wrap",
                padding: "10px 16px", borderRadius: 12,
                background: "rgba(6, 9, 24, 0.9)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(59, 130, 246, 0.15)",
                fontSize: 11,
                fontWeight: 500,
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            }}>
                {Object.entries(typeColors).filter(([k]) => k !== "unknown" && k !== "date").map(([type, color]) => (
                    <span key={type} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: "var(--text-secondary)",
                        textTransform: "capitalize",
                    }}>
                        <span style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: color,
                            display: "inline-block",
                            boxShadow: `0 0 8px ${color}`,
                        }} />
                        {type}
                    </span>
                ))}
            </div>

            {/* Controls hint */}
            <div style={{
                position: "absolute", bottom: 16, right: 16,
                padding: "8px 12px",
                borderRadius: 8,
                background: "rgba(6, 9, 24, 0.85)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(59, 130, 246, 0.1)",
                fontSize: 10,
                color: "var(--text-muted)",
            }}>
                Scroll to zoom • Drag to pan
            </div>
        </div>
    );
}
