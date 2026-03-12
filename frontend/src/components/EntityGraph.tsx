"use client";

import { useMemo } from "react";
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

export default function EntityGraph({ entities, relationships }: Props) {
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

        const nodes = top.map((e) => ({
            data: {
                id: e._id,
                label: e.name,
                type: e.type,
                size: 40 + e.documentCount * 6,
                color: typeColors[e.type] || typeColors.unknown,
            },
        }));

        // 4. Only include edges where both endpoints survived filtering
        const edges = relationships
            .filter((r) => nodeIds.has(r.sourceEntityId) && nodeIds.has(r.targetEntityId))
            .map((r) => ({
                data: {
                    id: r._id,
                    source: r.sourceEntityId,
                    target: r.targetEntityId,
                    label: r.type.replace(/_/g, " "),
                    width: Math.max(1, r.confidence * 3),
                },
            }));

        return [...nodes, ...edges];
    }, [entities, relationships]);

    const stylesheet: any[] = [
        {
            selector: "node",
            style: {
                "background-color": "data(color)" as any,
                label: "data(label)",
                width: "data(size)" as any,
                height: "data(size)" as any,
                color: "#e2e8f0",
                "font-size": "11px",
                "font-family": "Inter, sans-serif",
                "text-valign": "bottom",
                "text-margin-y": 8,
                "border-width": 2,
                "border-color": "#1e293b",
                "text-outline-width": 2,
                "text-outline-color": "#060918",
            } as any,
        },
        {
            selector: "edge",
            style: {
                width: "data(width)" as any,
                "line-color": "rgba(59, 130, 246, 0.3)",
                "target-arrow-color": "rgba(59, 130, 246, 0.4)",
                "target-arrow-shape": "triangle",
                "curve-style": "bezier",
                label: "",
                color: "#64748b",
                "text-rotation": "autorotate",
                "text-outline-width": 2,
                "text-outline-color": "#060918",
            } as any,
        },
        {
            selector: "node:hover",
            style: {
                "border-width": 3,
                "border-color": "#3b82f6",
            } as any,
        },
    ];

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "500px" }}>
            <CytoscapeComponent
                elements={elements}
                stylesheet={stylesheet}
                layout={{
                    name: "cose",
                    animate: true,
                    animationDuration: 500,
                    nodeRepulsion: 500000,
                    idealEdgeLength: 220,
                    gravity: 0.25,
                    padding: 50,
                } as any}
                style={{
                    width: "100%",
                    height: "100%",
                    background: "var(--bg-primary)",
                    borderRadius: 16,
                }}
                userZoomingEnabled={true}
                userPanningEnabled={true}
            />

            {/* Legend */}
            <div style={{
                position: "absolute", bottom: 16, left: 16,
                display: "flex", gap: 12, flexWrap: "wrap",
                padding: "8px 14px", borderRadius: 10,
                background: "rgba(6, 9, 24, 0.85)",
                backdropFilter: "blur(8px)",
                border: "1px solid var(--border-subtle)",
                fontSize: 11,
            }}>
                {Object.entries(typeColors).filter(([k]) => k !== "unknown" && k !== "date").map(([type, color]) => (
                    <span key={type} style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-secondary)" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
                        {type}
                    </span>
                ))}
            </div>
        </div>
    );
}
