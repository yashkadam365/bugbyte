"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    getCase, listEvidence, listClaims, listEntities,
    listRelationships, listTimelineEvents, getInvestigationHealth,
    uploadEvidence, deleteEvidence
} from "@/lib/api";
import type { EvidenceItem, Claim, Entity, Relationship, TimelineEvent as TimelineEventType, HealthSignal } from "@/lib/types";
import { useWebSocket } from "@/lib/useWebSocket";
import {
    ArrowLeft, FileText, GitGraph, Clock, AlertTriangle,
    Activity, BarChart3, Upload, Loader2, ChevronDown, ChevronUp,
    Shield, Eye, Trash2, X, Users, TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

// Dynamic imports for heavy libraries
const EntityGraph = dynamic(() => import("@/components/EntityGraph"), { ssr: false });
const TimelineView = dynamic(() => import("@/components/TimelineView"), { ssr: false });

type Tab = "evidence" | "graph" | "timeline" | "contradictions" | "health" | "rankings";

// All interfaces imported from @/lib/types

export default function CaseDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("evidence");
    const [caseData, setCaseData] = useState<any>(null);
    const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
    const [claims, setClaims] = useState<Claim[]>([]);
    const [entities, setEntities] = useState<Entity[]>([]);
    const [relationships, setRelationships] = useState<Relationship[]>([]);
    const [timelineEvents, setTimelineEvents] = useState<TimelineEventType[]>([]);
    const [healthSignals, setHealthSignals] = useState<HealthSignal[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadType, setUploadType] = useState<"note" | "url" | "pdf">("note");
    const [noteContent, setNoteContent] = useState("");
    const [noteTitle, setNoteTitle] = useState("");
    const [urlInput, setUrlInput] = useState("");
    const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const [pipelineStatus, setPipelineStatus] = useState<string | null>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);

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
            setPipelineStatus(lastMessage?.message || "Processing...");
        } else if (lastMessage.type === "contradictions_found") {
            setPipelineStatus(`⚠️ ${lastMessage?.count ?? 0} contradiction(s) detected!`);
            fetchAll();
        } else if (lastMessage.type === "health_updated" || lastMessage.type === "pipeline_error") {
            setPipelineStatus(lastMessage?.message || null);
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
                const fileInput = pdfInputRef.current;
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
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
            {/* Enhanced Top Bar with Navbar styling */}
            <div className="navbar" style={{
                padding: "14px 28px",
                borderBottom: "1px solid var(--border-subtle)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <motion.button
                        className="btn-ghost"
                        onClick={() => router.push("/")}
                        style={{ padding: "8px 12px" }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <ArrowLeft size={18} />
                    </motion.button>
                    <div style={{ borderLeft: "1px solid var(--border-subtle)", paddingLeft: 20 }}>
                        <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>{caseData.title}</h1>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{caseData.description}</p>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    {/* Quick Stats */}
                    <div style={{ display: "flex", gap: 16, marginRight: 8 }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-blue)" }}>{entities.length}</div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Entities</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-purple)" }}>{claims.length}</div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Claims</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: contradictions.length > 0 ? "var(--accent-red)" : "var(--accent-green)" }}>
                                {contradictions.length}
                            </div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Issues</div>
                        </div>
                    </div>
                    <div style={{ width: 1, height: 32, background: "var(--border-subtle)" }} />
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
                            style={{ fontSize: 11, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        >
                            <Loader2 size={10} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
                            {pipelineStatus}
                        </motion.span>
                    )}
                    <motion.button
                        className="btn-primary"
                        onClick={() => setShowUpload(!showUpload)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Upload size={16} /> Add Evidence
                    </motion.button>
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
                                    <input type="file" ref={pdfInputRef} accept=".pdf" style={{ display: "none" }} />
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

            {/* Enhanced Tabs */}
            <div style={{
                display: "flex", gap: 0, padding: "0 28px",
                borderBottom: "1px solid var(--border-subtle)",
                background: "rgba(15, 17, 21, 0.8)",
                backdropFilter: "blur(12px)",
                overflowX: "auto",
                position: "sticky",
                top: 0,
                zIndex: 40,
            }}>
                {tabs.map((tab) => (
                    <motion.div
                        key={tab.key}
                        className={`tab-item ${activeTab === tab.key ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.key)}
                        whileHover={{ backgroundColor: "rgba(247, 147, 26, 0.05)" }}
                        style={{ padding: "14px 24px" }}
                    >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <tab.icon size={15} />
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span style={{
                                    fontSize: 11,
                                    background: activeTab === tab.key ? "rgba(247, 147, 26, 0.15)" : "var(--bg-tertiary)",
                                    padding: "2px 8px",
                                    borderRadius: 10,
                                    fontWeight: 600,
                                    fontFamily: "var(--font-mono)",
                                    color: activeTab === tab.key ? "#F7931A" : "var(--text-muted)",
                                    minWidth: 20,
                                    textAlign: "center",
                                }}>
                                    {tab.count}
                                </span>
                            )}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* Tab Content with improved spacing */}
            <div style={{ padding: "28px 32px", maxWidth: 1600, margin: "0 auto" }}>
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
                            <div style={{ textAlign: "center", padding: 80 }}>
                                <GitGraph size={48} style={{ margin: "0 auto 16px", opacity: 0.3, color: "var(--accent-purple)" }} />
                                <p style={{ color: "var(--text-muted)", fontSize: 15 }}>No entities discovered yet. Upload evidence to build the graph.</p>
                            </div>
                        ) : (
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "280px 1fr 280px",
                                gap: 20,
                                minHeight: "calc(100vh - 240px)",
                            }}>
                                {/* Left Sidebar - Entities List */}
                                <div className="case-sidebar">
                                    <div className="section-header" style={{ marginBottom: 16 }}>
                                        <span className="section-title">
                                            <Users size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                                            Entities ({entities.length})
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {entities.slice(0, 20).map((entity, idx) => (
                                            <motion.div
                                                key={entity._id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.02 }}
                                                className="insight-item"
                                                style={{ padding: 12 }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <div style={{
                                                        width: 10,
                                                        height: 10,
                                                        borderRadius: "50%",
                                                        flexShrink: 0,
                                                        background: entity.type === "person" ? "var(--accent-blue)" :
                                                            entity.type === "organization" ? "var(--accent-purple)" :
                                                            entity.type === "location" ? "var(--accent-green)" :
                                                            entity.type === "event" ? "var(--accent-pink)" : "var(--accent-amber)",
                                                        boxShadow: `0 0 8px ${
                                                            entity.type === "person" ? "var(--accent-blue)" :
                                                            entity.type === "organization" ? "var(--accent-purple)" :
                                                            entity.type === "location" ? "var(--accent-green)" :
                                                            entity.type === "event" ? "var(--accent-pink)" : "var(--accent-amber)"
                                                        }`,
                                                    }} />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{
                                                            fontSize: 13,
                                                            fontWeight: 600,
                                                            color: "var(--text-primary)",
                                                            whiteSpace: "nowrap",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                        }}>
                                                            {entity.name}
                                                        </div>
                                                        <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "capitalize" }}>
                                                            {entity.type} • {entity.documentCount} docs
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                        {entities.length > 20 && (
                                            <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: 8 }}>
                                                +{entities.length - 20} more entities
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Center - Graph */}
                                <div style={{ height: "calc(100vh - 260px)", width: "100%", borderRadius: 16, overflow: "hidden" }}>
                                    <EntityGraph entities={entities} relationships={relationships} />
                                </div>

                                {/* Right Sidebar - Relationships */}
                                <div className="case-sidebar">
                                    <div className="section-header" style={{ marginBottom: 16 }}>
                                        <span className="section-title">
                                            <GitGraph size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                                            Relationships ({relationships.length})
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {relationships.slice(0, 15).map((rel, idx) => (
                                            <motion.div
                                                key={rel._id}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.02 }}
                                                style={{
                                                    padding: 12,
                                                    borderRadius: 10,
                                                    background: "rgba(17, 22, 56, 0.5)",
                                                    border: "1px solid transparent",
                                                    fontSize: 12,
                                                }}
                                            >
                                                <div style={{ color: "var(--text-primary)", fontWeight: 500, marginBottom: 4 }}>
                                                    {rel.sourceName}
                                                </div>
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                    color: "var(--accent-blue)",
                                                    fontSize: 11,
                                                    margin: "4px 0",
                                                }}>
                                                    <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
                                                    {rel.type.replace(/_/g, " ")}
                                                    <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
                                                </div>
                                                <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                                                    {rel.targetName}
                                                </div>
                                                <div style={{ marginTop: 6, fontSize: 10, color: "var(--text-muted)" }}>
                                                    Confidence: {(rel.confidence * 100).toFixed(0)}%
                                                </div>
                                            </motion.div>
                                        ))}
                                        {relationships.length > 15 && (
                                            <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: 8 }}>
                                                +{relationships.length - 15} more relationships
                                            </div>
                                        )}
                                        {relationships.length === 0 && (
                                            <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: 20 }}>
                                                No relationships detected yet
                                            </div>
                                        )}
                                    </div>
                                </div>
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
