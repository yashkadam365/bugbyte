"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { listCases, createCase, deleteCase } from "@/lib/api";
import {
    Search, Plus, Shield, FileText, Clock, X, ChevronRight,
    Briefcase, AlertTriangle, BarChart3, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CaseData {
    _id: string;
    title: string;
    description: string;
    status: string;
    tags: string[];
    evidenceCount: number;
    createdAt: string;
    updatedAt: string;
}

export default function Dashboard() {
    const [cases, setCases] = useState<CaseData[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newTags, setNewTags] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        try {
            const data = await listCases();
            setCases(data);
        } catch (err) {
            console.error("Failed to fetch cases:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        try {
            await createCase({
                title: newTitle,
                description: newDesc,
                tags: newTags.split(",").map((t) => t.trim()).filter(Boolean),
            });
            setNewTitle("");
            setNewDesc("");
            setNewTags("");
            setShowModal(false);
            fetchCases();
        } catch (err) {
            console.error("Create case failed:", err);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Delete this case and all related evidence?")) {
            await deleteCase(id);
            fetchCases();
        }
    };

    const filteredCases = cases.filter(
        (c) =>
            c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: cases.length,
        active: cases.filter((c) => c.status === "active").length,
        evidence: cases.reduce((acc, c) => acc + (c.evidenceCount || 0), 0),
    };

    return (
        <div style={{ minHeight: "100vh", padding: "40px" }}>
            {/* Header */}
            <div style={{ marginBottom: 40 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: "var(--gradient-primary)",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <Shield size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>
                            <span className="gradient-text">NEXUS</span>
                        </h1>
                        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                            Investigation Intelligence Platform
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
                {[
                    { label: "Total Cases", value: stats.total, icon: Briefcase, color: "var(--accent-blue)" },
                    { label: "Active", value: stats.active, icon: Zap, color: "var(--accent-green)" },
                    { label: "Evidence Files", value: stats.evidence, icon: FileText, color: "var(--accent-cyan)" },
                    { label: "AI Analyses", value: stats.evidence, icon: BarChart3, color: "var(--accent-purple)" },
                ].map((stat) => (
                    <div key={stat.label} className="glass-card" style={{ padding: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div>
                                <p style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                                    {stat.label}
                                </p>
                                <p style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</p>
                            </div>
                            <stat.icon size={28} color={stat.color} style={{ opacity: 0.6 }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center" }}>
                <div style={{ flex: 1, position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input
                        className="input-field"
                        placeholder="Search cases..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: 40 }}
                    />
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> New Case
                </button>
            </div>

            {/* Cases Grid */}
            {loading ? (
                <div style={{ textAlign: "center", padding: 80, color: "var(--text-muted)" }}>
                    <div className="pulse-glow" style={{ width: 48, height: 48, borderRadius: 12, background: "var(--bg-tertiary)", margin: "0 auto 16px" }} />
                    Loading cases...
                </div>
            ) : filteredCases.length === 0 ? (
                <div style={{ textAlign: "center", padding: 80 }}>
                    <Shield size={48} style={{ margin: "0 auto 16px", opacity: 0.3, color: "var(--accent-blue)" }} />
                    <p style={{ color: "var(--text-muted)", fontSize: 15 }}>
                        {searchQuery ? "No cases match your search." : "No cases yet. Create your first investigation."}
                    </p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                    <AnimatePresence>
                        {filteredCases.map((c, i) => (
                            <motion.div
                                key={c._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass-card"
                                style={{ padding: 24, cursor: "pointer", position: "relative" }}
                                onClick={() => router.push(`/cases/${c._id}`)}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                    <h3 style={{ fontSize: 17, fontWeight: 600, flex: 1, marginRight: 8 }}>{c.title}</h3>
                                    <button
                                        onClick={(e) => handleDelete(c._id, e)}
                                        style={{
                                            background: "transparent", border: "none", cursor: "pointer",
                                            color: "var(--text-muted)", padding: 4
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 16, minHeight: 38 }}>
                                    {c.description || "No description"}
                                </p>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                                    {c.tags?.map((tag) => (
                                        <span key={tag} className="badge badge-primary">{tag}</span>
                                    ))}
                                    <span className={`badge ${c.status === "active" ? "badge-success" : "badge-secondary"}`}>
                                        {c.status}
                                    </span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
                                    <div style={{ display: "flex", gap: 16 }}>
                                        <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                                            <FileText size={12} /> {c.evidenceCount || 0} evidence
                                        </span>
                                        <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                                            <Clock size={12} /> {new Date(c.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <ChevronRight size={16} color="var(--accent-blue)" />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
                                <span className="gradient-text">New Investigation</span>
                            </h2>
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Case Title</label>
                                    <input
                                        className="input-field"
                                        placeholder="e.g. Operation Goldfish"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Description</label>
                                    <textarea
                                        className="input-field"
                                        placeholder="Describe the investigation..."
                                        rows={3}
                                        value={newDesc}
                                        onChange={(e) => setNewDesc(e.target.value)}
                                        style={{ resize: "vertical" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Tags (comma separated)</label>
                                    <input
                                        className="input-field"
                                        placeholder="e.g. fraud, financial, corporate"
                                        value={newTags}
                                        onChange={(e) => setNewTags(e.target.value)}
                                    />
                                </div>
                                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                                    <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                                    <button className="btn-primary" onClick={handleCreate} style={{ flex: 1, justifyContent: "center" }}>
                                        <Plus size={16} /> Create Case
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
