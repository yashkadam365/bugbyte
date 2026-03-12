"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    getCase, listEvidence, listClaims, listEntities,
    listRelationships, listTimelineEvents, getInvestigationHealth,
    uploadEvidence, deleteEvidence
} from "@/lib/api";
import { useWebSocket } from "@/lib/useWebSocket";
import {
    ArrowLeft, FileText, GitGraph, Clock, AlertTriangle,
    Activity, BarChart3, Upload, Loader2, ChevronDown, ChevronUp,
    Shield, BookOpen, Eye, Trash2, ExternalLink, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

// Dynamic imports for heavy libraries
const EntityGraph = dynamic(() => import("@/components/EntityGraph"), { ssr: false });
const TimelineView = dynamic(() => import("@/components/TimelineView"), { ssr: false });

type Tab = "evidence" | "graph" | "timeline" | "contradictions" | "health" | "rankings";

interface EvidenceItem {
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

interface Claim {
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

interface Entity {
    _id: string;
    name: string;
    type: string;
    aliases: string[];
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

interface TimelineEvent {
    _id: string;
    date: string | null;
    approxDate: string | null;
    description: string;
    entitiesInvolved: string[];
}

interface HealthSignal {
    _id: string;
    status: string;
    description: string;
    docsAdded: number;
    newFactsRecent: number;
}

export default function CaseDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("evidence");
    const [caseData, setCaseData] = useState<any>(null);
    const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
    const [claims, setClaims] = useState<Claim[]>([]);
    const [entities, setEntities] = useState<Entity[]>([]);
    const [relationships, setRelationships] = useState<Relationship[]>([]);
    const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
    const [healthSignals, setHealthSignals] = useState<HealthSignal[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadType, setUploadType] = useState<"note" | "url" | "pdf">("note");
    const [noteContent, setNoteContent] = useState("");
    const [noteTitle, setNoteTitle] = useState("");
    const [urlInput, setUrlInput] = useState("");
    const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const [pipelineStatus, setPipelineStatus] = useState<string | null>(null);

    const { lastMessage, isConnected } = useWebSocket(id);

    // Fetch all data
    const fetchAll = useCallback(async () => {
        if (!id) return;
        try {
            const [c, ev, cl, en, rel, tl, h] = await Promise.all([
                getCase(id), listEvidence(id), listClaims(id),
                listEntities(id), listRelationships(id),
                listTimelineEvents(id), getInvestigationHealth(id)
            ]);
            setCaseData(c);
            setEvidence(ev);
            setClaims(cl);
            setEntities(en);
            setRelationships(rel);
            setTimelineEvents(tl);
            setHealthSignals(h);
        } catch (err) {
            console.error("Fetch error:", err);
        }
    }, [id]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // Handle WebSocket messages
    useEffect(() => {
        if (!lastMessage) return;
        if (lastMessage.type === "pipeline_complete") {
            setPipelineStatus(null);
            fetchAll();
        } else if (lastMessage.type === "pipeline_progress") {
            setPipelineStatus(lastMessage.message || "Processing...");
        } else if (lastMessage.type === "contradictions_found") {
            setPipelineStatus(`⚠️ ${lastMessage.count} contradiction(s) detected!`);
            fetchAll();
        } else if (lastMessage.type === "health_updated" || lastMessage.type === "pipeline_error") {
            setPipelineStatus(lastMessage.message || null);
            fetchAll();
        }
    }, [lastMessage, fetchAll]);

    const handleUpload = async () => {
        if (uploading) return;
        setUploading(true);
        setPipelineStatus("Uploading evidence...");

        try {
            const formData = new FormData();
            formData.append("type", uploadType);

            if (uploadType === "note") {
                formData.append("content", noteContent);
                formData.append("title", noteTitle || "Investigation Note");
            } else if (uploadType === "url") {
                formData.append("type", "url");
                formData.append("url", urlInput);
                formData.append("content", urlInput);
                formData.append("title", urlInput.slice(0, 80));
            } else if (uploadType === "pdf") {
                const fileInput = document.getElementById("pdf-input") as HTMLInputElement;
                if (fileInput?.files?.[0]) {
                    formData.append("file", fileInput.files[0]);
                    formData.append("type", "pdf");
                }
            }

            await uploadEvidence(id, formData);
            setNoteContent("");
            setNoteTitle("");
            setUrlInput("");
            setShowUpload(false);
            setPipelineStatus("AI pipeline started — analyzing document...");
            fetchAll();
        } catch (err) {
            console.error("Upload error:", err);
            setPipelineStatus("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteEvidence = async (evId: string) => {
        if (confirm("Delete this evidence?")) {
            await deleteEvidence(evId);
            fetchAll();
        }
    };

    const contradictions = claims.filter((c) => c.contradictedBy.length > 0);
    const sortedByImpact = [...evidence].sort((a, b) => b.impactScore - a.impactScore);

    const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
        { key: "evidence", label: "Evidence", icon: FileText, count: evidence.length },
        { key: "graph", label: "Entity Graph", icon: GitGraph, count: entities.length },
        { key: "timeline", label: "Timeline", icon: Clock, count: timelineEvents.length },
        { key: "contradictions", label: "Contradictions", icon: AlertTriangle, count: contradictions.length },
        { key: "health", label: "Health", icon: Activity, count: healthSignals.length },
        { key: "rankings", label: "Impact", icon: BarChart3 },
    ];

    if (!caseData) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Loader2 size={32} className="pulse-glow" style={{ color: "var(--accent-blue)" }} />
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh" }}>
            {/* Top Bar */}
            <div style={{
                padding: "16px 32px",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "var(--bg-secondary)"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button className="btn-ghost" onClick={() => router.push("/")} style={{ padding: "6px 10px" }}>
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 700 }}>{caseData.title}</h1>
                        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{caseData.description}</p>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {isConnected && (
                        <span className="badge badge-success" style={{ fontSize: 11 }}>
                            ● Live
                        </span>
                    )}
                    {pipelineStatus && (
                        <motion.span
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="badge badge-primary"
                            style={{ fontSize: 11, maxWidth: 300 }}
                        >
                            <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />
                            {pipelineStatus}
                        </motion.span>
                    )}
                    <button className="btn-primary" onClick={() => setShowUpload(!showUpload)}>
                        <Upload size={16} /> Add Evidence
                    </button>
                </div>
            </div>

            {/* Upload Panel */}
            <AnimatePresence>
                {showUpload && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: "hidden", borderBottom: "1px solid var(--border-subtle)" }}
                    >
                        <div style={{ padding: "24px 32px", background: "rgba(17,22,56,0.5)" }}>
                            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                                {(["note", "url", "pdf"] as const).map((t) => (
                                    <button
                                        key={t}
                                        className={`btn-ghost ${uploadType === t ? "active" : ""}`}
                                        onClick={() => setUploadType(t)}
                                        style={{
                                            background: uploadType === t ? "var(--bg-tertiary)" : undefined,
                                            borderColor: uploadType === t ? "var(--accent-blue)" : undefined,
                                            color: uploadType === t ? "var(--accent-blue)" : undefined,
                                        }}
                                    >
                                        {t === "note" ? "📝 Note" : t === "url" ? "🔗 URL" : "📄 PDF"}
                                    </button>
                                ))}
                            </div>
                            {uploadType === "note" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    <input
                                        className="input-field"
                                        placeholder="Evidence title"
                                        value={noteTitle}
                                        onChange={(e) => setNoteTitle(e.target.value)}
                                    />
                                    <textarea
                                        className="input-field"
                                        placeholder="Paste investigation notes, interview transcripts, memo text..."
                                        rows={5}
                                        value={noteContent}
                                        onChange={(e) => setNoteContent(e.target.value)}
                                        style={{ resize: "vertical" }}
                                    />
                                </div>
                            )}
                            {uploadType === "url" && (
                                <input
                                    className="input-field"
                                    placeholder="https://..."
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                />
                            )}
                            {uploadType === "pdf" && (
                                <div className="dropzone">
                                    <input type="file" id="pdf-input" accept=".pdf" style={{ display: "none" }} />
                                    <label htmlFor="pdf-input" style={{ cursor: "pointer", display: "block" }}>
                                        <Upload size={32} style={{ margin: "0 auto 12px", color: "var(--accent-blue)" }} />
                                        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Click to select a PDF file</p>
                                    </label>
                                </div>
                            )}
                            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                                <button className="btn-ghost" onClick={() => setShowUpload(false)}>Cancel</button>
                                <button className="btn-primary" onClick={handleUpload} disabled={uploading}>
                                    {uploading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={16} />}
                                    {uploading ? "Processing..." : "Upload & Analyze"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tabs */}
            <div style={{
                display: "flex", gap: 0, padding: "0 32px",
                borderBottom: "1px solid var(--border-subtle)",
                background: "var(--bg-secondary)", overflowX: "auto"
            }}>
                {tabs.map((tab) => (
                    <div
                        key={tab.key}
                        className={`tab-item ${activeTab === tab.key ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <tab.icon size={14} />
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span style={{
                                    fontSize: 11, background: activeTab === tab.key ? "rgba(59,130,246,0.2)" : "var(--bg-tertiary)",
                                    padding: "1px 7px", borderRadius: 8, fontWeight: 600,
                                    color: activeTab === tab.key ? "var(--accent-blue)" : "var(--text-muted)"
                                }}>
                                    {tab.count}
                                </span>
                            )}
                        </span>
                    </div>
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ padding: "24px 32px" }}>
                {/* ─── EVIDENCE TAB ─── */}
                {activeTab === "evidence" && (
                    <div>
                        {evidence.length === 0 ? (
                            <div style={{ textAlign: "center", padding: 60 }}>
                                <FileText size={40} style={{ margin: "0 auto 12px", opacity: 0.3, color: "var(--accent-blue)" }} />
                                <p style={{ color: "var(--text-muted)" }}>No evidence yet. Upload documents to begin analysis.</p>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                {evidence.map((ev) => (
                                    <motion.div
                                        key={ev._id}
                                        className="glass-card"
                                        style={{ padding: 20, cursor: "pointer" }}
                                        onClick={() => setSelectedEvidence(selectedEvidence === ev._id ? null : ev._id)}
                                        layout
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                                    <h4 style={{ fontSize: 15, fontWeight: 600 }}>{ev.title}</h4>
                                                    <span className={`badge badge-${ev.credibility === "primary" ? "success" : ev.credibility === "secondary" ? "secondary" : "unverified"}`}>
                                                        {ev.credibility}
                                                    </span>
                                                </div>
                                                {ev.status === "processing" && (
                                                    <span className="badge badge-primary" style={{ fontSize: 11 }}>
                                                        <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> Processing...
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteEvidence(ev._id); }}
                                                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        {/* Impact Score Bar */}
                                        <div style={{ marginBottom: 8 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                                                <span>Impact Score</span>
                                                <span style={{ fontWeight: 700, color: ev.impactScore > 70 ? "var(--accent-green)" : ev.impactScore > 40 ? "var(--accent-amber)" : "var(--text-muted)" }}>
                                                    {ev.impactScore.toFixed(0)}
                                                </span>
                                            </div>
                                            <div className="impact-bar">
                                                <div
                                                    className="impact-bar-fill"
                                                    style={{
                                                        width: `${ev.impactScore}%`,
                                                        background: ev.impactScore > 70
                                                            ? "var(--gradient-success)"
                                                            : ev.impactScore > 40
                                                                ? "var(--gradient-warning)"
                                                                : "var(--gradient-primary)",
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {ev.summary && (
                                            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 8 }}>
                                                {ev.summary}
                                            </p>
                                        )}

                                        {/* Expanded detail */}
                                        <AnimatePresence>
                                            {selectedEvidence === ev._id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    style={{ overflow: "hidden", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}
                                                >
                                                    <h5 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>
                                                        Claims ({ev.claims?.length || 0})
                                                    </h5>
                                                    {claims
                                                        .filter((c) => c.evidenceId === ev._id)
                                                        .map((claim) => (
                                                            <div key={claim._id} style={{
                                                                padding: "8px 12px", marginBottom: 6, borderRadius: 8,
                                                                background: "var(--bg-tertiary)", fontSize: 13, lineHeight: 1.5,
                                                                borderLeft: claim.contradictedBy.length > 0
                                                                    ? "3px solid var(--accent-red)"
                                                                    : "3px solid var(--accent-blue)"
                                                            }}>
                                                                <p>{claim.statement}</p>
                                                                <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                                                                    {claim.date && <span className="badge badge-primary" style={{ fontSize: 10 }}>{claim.date}</span>}
                                                                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                                                                        Confidence: {(claim.confidence * 100).toFixed(0)}%
                                                                    </span>
                                                                    {claim.contradictedBy.length > 0 && (
                                                                        <span className="badge badge-danger" style={{ fontSize: 10 }}>
                                                                            ⚠️ Contradicted
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, fontSize: 11, color: "var(--text-muted)" }}>
                                            <span>{new Date(ev.createdAt).toLocaleDateString()}</span>
                                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                {selectedEvidence === ev._id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                {ev.claims?.length || 0} claims
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── ENTITY GRAPH TAB ─── */}
                {activeTab === "graph" && (
                    <div>
                        {entities.length === 0 ? (
                            <div style={{ textAlign: "center", padding: 60 }}>
                                <GitGraph size={40} style={{ margin: "0 auto 12px", opacity: 0.3, color: "var(--accent-purple)" }} />
                                <p style={{ color: "var(--text-muted)" }}>No entities discovered yet. Upload evidence to build the graph.</p>
                            </div>
                        ) : (
                            <div className="glass-card" style={{ padding: 0, overflow: "hidden", borderRadius: 16 }}>
                                <EntityGraph entities={entities} relationships={relationships} />
                            </div>
                        )}
                    </div>
                )}

                {/* ─── TIMELINE TAB ─── */}
                {activeTab === "timeline" && (
                    <div>
                        {timelineEvents.length === 0 ? (
                            <div style={{ textAlign: "center", padding: 60 }}>
                                <Clock size={40} style={{ margin: "0 auto 12px", opacity: 0.3, color: "var(--accent-cyan)" }} />
                                <p style={{ color: "var(--text-muted)" }}>No timeline events extracted yet.</p>
                            </div>
                        ) : (
                            <div className="glass-card" style={{ padding: 24 }}>
                                <TimelineView events={timelineEvents} />
                            </div>
                        )}
                    </div>
                )}

                {/* ─── CONTRADICTIONS TAB ─── */}
                {activeTab === "contradictions" && (
                    <div>
                        {contradictions.length === 0 ? (
                            <div style={{ textAlign: "center", padding: 60 }}>
                                <AlertTriangle size={40} style={{ margin: "0 auto 12px", opacity: 0.3, color: "var(--accent-amber)" }} />
                                <p style={{ color: "var(--text-muted)" }}>No contradictions detected. Add more evidence to enable cross-referencing.</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {contradictions.map((claim) => {
                                    const contradicting = claims.filter((c) => claim.contradictedBy.includes(c._id));
                                    return (
                                        <motion.div
                                            key={claim._id}
                                            className="glass-card"
                                            style={{ padding: 24, borderLeft: "4px solid var(--accent-red)" }}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                                <AlertTriangle size={18} color="var(--accent-red)" />
                                                <span style={{ fontWeight: 700, fontSize: 14, color: "var(--accent-red)" }}>CONTRADICTION DETECTED</span>
                                            </div>
                                            <div style={{
                                                padding: 12, borderRadius: 10, background: "var(--bg-tertiary)", marginBottom: 12,
                                                borderLeft: "3px solid var(--accent-blue)"
                                            }}>
                                                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Claim A</p>
                                                <p style={{ fontSize: 14 }}>{claim.statement}</p>
                                            </div>
                                            {contradicting.map((cc) => (
                                                <div key={cc._id} style={{
                                                    padding: 12, borderRadius: 10, background: "var(--bg-tertiary)", marginBottom: 8,
                                                    borderLeft: "3px solid var(--accent-red)"
                                                }}>
                                                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Claim B (Contradicting)</p>
                                                    <p style={{ fontSize: 14 }}>{cc.statement}</p>
                                                </div>
                                            ))}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── HEALTH TAB ─── */}
                {activeTab === "health" && (
                    <div>
                        {healthSignals.length === 0 ? (
                            <div style={{ textAlign: "center", padding: 60 }}>
                                <Activity size={40} style={{ margin: "0 auto 12px", opacity: 0.3, color: "var(--accent-green)" }} />
                                <p style={{ color: "var(--text-muted)" }}>Investigation health looks good. No signals detected.</p>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                {healthSignals.map((signal) => (
                                    <motion.div
                                        key={signal._id}
                                        className="glass-card"
                                        style={{
                                            padding: 20,
                                            borderLeft: `4px solid ${signal.status === "exhausted_lead" ? "var(--accent-amber)"
                                                    : signal.status === "blind_spot" ? "var(--accent-purple)"
                                                        : "var(--accent-red)"
                                                }`,
                                        }}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                            <span className={`badge ${signal.status === "exhausted_lead" ? "badge-secondary"
                                                    : signal.status === "blind_spot" ? "badge-primary"
                                                        : "badge-danger"
                                                }`}>
                                                {signal.status === "exhausted_lead" ? "🔄 Exhausted Lead"
                                                    : signal.status === "blind_spot" ? "🔍 Blind Spot"
                                                        : "🔁 Circular Investigation"}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)" }}>
                                            {signal.description}
                                        </p>
                                        <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
                                            Docs tracked: {signal.docsAdded}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── IMPACT RANKINGS TAB ─── */}
                {activeTab === "rankings" && (
                    <div>
                        {evidence.length === 0 ? (
                            <div style={{ textAlign: "center", padding: 60 }}>
                                <BarChart3 size={40} style={{ margin: "0 auto 12px", opacity: 0.3, color: "var(--accent-purple)" }} />
                                <p style={{ color: "var(--text-muted)" }}>No evidence to rank yet.</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {sortedByImpact.map((ev, idx) => (
                                    <motion.div
                                        key={ev._id}
                                        className="glass-card"
                                        style={{ padding: 20, display: "flex", alignItems: "center", gap: 20 }}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <div style={{
                                            width: 44, height: 44, borderRadius: 12, display: "flex",
                                            alignItems: "center", justifyContent: "center", fontWeight: 800,
                                            fontSize: 18, color: "white", flexShrink: 0,
                                            background: idx === 0 ? "linear-gradient(135deg, #f59e0b, #ef4444)"
                                                : idx === 1 ? "linear-gradient(135deg, #94a3b8, #64748b)"
                                                    : idx === 2 ? "linear-gradient(135deg, #b45309, #92400e)"
                                                        : "var(--bg-tertiary)"
                                        }}>
                                            #{idx + 1}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{ev.title}</h4>
                                            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
                                                {ev.summary?.slice(0, 100) || "No summary"}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                                            <div style={{
                                                fontSize: 28, fontWeight: 800,
                                                color: ev.impactScore > 70 ? "var(--accent-green)"
                                                    : ev.impactScore > 40 ? "var(--accent-amber)"
                                                        : "var(--text-muted)"
                                            }}>
                                                {ev.impactScore.toFixed(0)}
                                            </div>
                                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>impact</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Spin animation keyframe */}
            <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
