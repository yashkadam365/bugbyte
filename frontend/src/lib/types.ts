// ═══ NEXUS Shared Type Definitions ═══

export interface CaseData {
    _id: string;
    title: string;
    description: string;
    status: string;
    tags: string[];
    evidenceCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface EvidenceItem {
    _id: string;
    title: string;
    type: string;
    content: string;
    summary: string;
    credibility: string;
    impactScore: number;
    status: string;
    claims: string[];
    createdAt: string;
}

export interface Claim {
    _id: string;
    statement: string;
    entities: string[];
    date: string | null;
    confidence: number;
    credibility: string;
    contradictedBy: string[];
    corroboratedBy: string[];
    evidenceId: string;
}

export interface Entity {
    _id: string;
    name: string;
    type: string;
    aliases: string[];
    documentCount: number;
    noveltyScore: number;
}

export interface Relationship {
    _id: string;
    sourceEntityId: string;
    targetEntityId: string;
    sourceName: string;
    targetName: string;
    type: string;
    confidence: number;
}

export interface TimelineEvent {
    _id: string;
    date: string | null;
    approxDate: string | null;
    description: string;
    entitiesInvolved: string[];
}

// Alias for TimelineView component props
export type TimelineEventData = TimelineEvent;

export interface HealthSignal {
    _id: string;
    status: string;
    description: string;
    docsAdded: number;
    newFactsRecent: number;
}
