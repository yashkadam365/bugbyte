"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { listCases, createCase, deleteCase } from "@/lib/api";
import {
    Search, Plus, Shield, FileText, Clock, X, ChevronRight,
    Briefcase, AlertTriangle, BarChart3, Zap, Target, Eye,
    TrendingUp, Activity, Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { InsightsPanel } from "@/components/ui/InsightsPanel";
import { CreateCaseButton } from "@/components/ui/CreateCaseButton";
import { StatCard, StatGrid } from "@/components/ui/StatCard";

// Dynamic import for 3D sphere (fallback to CSS version if Three.js not available)
const HeroSphere = dynamic(
    () => import("@/components/ui/HeroSphere").then(mod => mod.HeroSphere).catch(() =>
        import("@/components/ui/HeroSphere").then(mod => mod.HeroSphereFallback)
    ),
    { ssr: false, loading: () => <HeroSpherePlaceholder /> }
);

function HeroSpherePlaceholder() {
    return (
        <div className="sphere-container" style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)"
        }}>
            <div style={{
                width: 200,
                height: 200,
                borderRadius: "50%",
                background: "radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.2))",
                animation: "pulse 2s ease-in-out infinite"
            }} />
        </div>
    );
}

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
    const [showLeftPanel, setShowLeftPanel] = useState(true);
    const [showRightPanel, setShowRightPanel] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchCases();
        // Check viewport for responsive panels
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 1200) {
                setShowLeftPanel(false);
                setShowRightPanel(false);
            } else {
                setShowLeftPanel(true);
                setShowRightPanel(true);
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
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

    // Generate insight items from cases
    const recentCases = [...cases]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6)
        .map(c => ({
            id: c._id,
            title: c.title,
            meta: new Date(c.createdAt).toLocaleDateString(),
            onClick: () => router.push(`/cases/${c._id}`)
        }));

    const activeCases = cases.filter(c => c.status === "active").slice(0, 4).map(c => ({
        id: c._id,
        title: c.title,
        subtitle: `${c.evidenceCount || 0} evidence files`,
        onClick: () => router.push(`/cases/${c._id}`)
    }));

    const evidenceToday = cases
        .filter(c => {
            const today = new Date().toDateString();
            return new Date(c.updatedAt).toDateString() === today;
        })
        .slice(0, 4)
        .map(c => ({
            id: c._id,
            title: c.title,
            meta: "Updated today"
        }));

    // Right panel insights (simulated for demo)
    const topEntities = cases.slice(0, 5).map((c, i) => ({
        id: `entity-${i}`,
        title: c.title.split(" ")[0] || "Entity",
        subtitle: ["Person", "Organization", "Location"][i % 3],
        meta: `${Math.floor(Math.random() * 10) + 1} connections`
    }));

    const healthAlerts = cases
        .filter(c => (c.evidenceCount || 0) === 0)
        .slice(0, 3)
        .map(c => ({
            id: c._id,
            title: `${c.title} needs evidence`,
            type: "warning" as const
        }));

    return (
        <div style={{ minHeight: "100vh" }}>
            {/* Navbar */}
            <Navbar>
                <div style={{ position: "relative" }}>
                    <Search size={16} style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)"
                    }} />
                    <input
                        className="input-field"
                        placeholder="Search investigations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: 280,
                            paddingLeft: 38,
                            background: "rgba(17, 22, 56, 0.6)"
                        }}
                    />
                </div>
            </Navbar>

            {/* Hero Section with 3D Sphere */}
            <section className="hero-section">
                {/* Left Panel - Investigation Insights */}
                <AnimatePresence>
                    {showLeftPanel && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="insights-panel"
                        >
                            <div className="panel-header">
                                <div className="panel-icon"><Search size={16} /></div>
                                <span className="panel-title">Investigation Insights</span>
                            </div>

                            {/* Recent Investigations */}
                            <div className="section-header">
                                <span className="section-title">Recent Cases</span>
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                {recentCases.length === 0 ? (
                                    <div style={{ color: "var(--text-muted)", fontSize: 13, padding: 16 }}>
                                        No cases yet
                                    </div>
                                ) : (
                                    recentCases.map((item, idx) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="insight-item"
                                            onClick={item.onClick}
                                        >
                                            <div className="insight-item-title">{item.title}</div>
                                            <div className="insight-item-meta">
                                                <Clock size={10} />
                                                {item.meta}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {/* Active Leads */}
                            <div className="section-header">
                                <span className="section-title">Active Leads</span>
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                {activeCases.length === 0 ? (
                                    <div style={{ color: "var(--text-muted)", fontSize: 13, padding: 16 }}>
                                        No active cases
                                    </div>
                                ) : (
                                    activeCases.map((item, idx) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 + 0.2 }}
                                            className="insight-item"
                                            onClick={item.onClick}
                                        >
                                            <div className="insight-item-title">{item.title}</div>
                                            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                                                {item.subtitle}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {/* Health Alerts */}
                            {healthAlerts.length > 0 && (
                                <>
                                    <div className="section-header">
                                        <span className="section-title">Alerts</span>
                                    </div>
                                    {healthAlerts.map((alert, idx) => (
                                        <div key={alert.id} className="alert-item warning">
                                            <AlertTriangle size={14} color="var(--accent-amber)" />
                                            <span style={{ fontSize: 12 }}>{alert.title}</span>
                                        </div>
                                    ))}
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Center - 3D Intelligence Sphere */}
                <div className="hero-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        style={{ width: "100%", height: "100%" }}
                    >
                        <HeroSphere />
                    </motion.div>

                    {/* Floating Create Button */}
                    <CreateCaseButton
                        onClick={() => setShowModal(true)}
                        variant="floating"
                        label="Create New Investigation"
                    />
                </div>

                {/* Right Panel - AI Insights */}
                <AnimatePresence>
                    {showRightPanel && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="insights-panel"
                        >
                            <div className="panel-header">
                                <div className="panel-icon"><Activity size={16} /></div>
                                <span className="panel-title">AI Insights</span>
                            </div>

                            {/* Top Entities */}
                            <div className="section-header">
                                <span className="section-title">Top Entities</span>
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                {topEntities.map((item, idx) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="insight-item"
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: "50%",
                                                background: item.subtitle === "Person" ? "var(--accent-blue)" :
                                                    item.subtitle === "Organization" ? "var(--accent-purple)" : "var(--accent-green)"
                                            }} />
                                            <div className="insight-item-title">{item.title}</div>
                                        </div>
                                        <div className="insight-item-meta">
                                            <Users size={10} />
                                            {item.subtitle} • {item.meta}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Impact Rankings */}
                            <div className="section-header">
                                <span className="section-title">Impact Rankings</span>
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                {cases.slice(0, 4).map((c, idx) => {
                                    const score = Math.max(0.2, 1 - idx * 0.2);
                                    return (
                                        <div key={c._id} style={{ marginBottom: 12 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                                <span style={{ fontSize: 12, color: "var(--text-primary)" }}>
                                                    {idx + 1}. {c.title.slice(0, 20)}
                                                </span>
                                                <span style={{ fontSize: 11, color: "var(--accent-blue)" }}>
                                                    {Math.round(score * 100)}%
                                                </span>
                                            </div>
                                            <div className="impact-bar">
                                                <motion.div
                                                    className="impact-bar-fill"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${score * 100}%` }}
                                                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                                                    style={{ background: "var(--gradient-primary)" }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Updated Today */}
                            <div className="section-header">
                                <span className="section-title">Activity Today</span>
                            </div>
                            <div>
                                {evidenceToday.length === 0 ? (
                                    <div style={{ color: "var(--text-muted)", fontSize: 13, padding: 16 }}>
                                        No activity today
                                    </div>
                                ) : (
                                    evidenceToday.map((item) => (
                                        <div key={item.id} className="insight-item">
                                            <div className="insight-item-title">{item.title}</div>
                                            <div className="insight-item-meta">
                                                <Eye size={10} />
                                                {item.meta}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* Divider */}
            <div className="divider" />

            {/* Main Content Area */}
            <div style={{ padding: "0 40px 40px" }}>
                {/* Stats Row */}
                <div style={{ marginBottom: 32 }}>
                    <StatGrid columns={4}>
                        <StatCard
                            value={stats.total}
                            label="Total Cases"
                            icon={<Briefcase size={24} />}
                            variant="primary"
                        />
                        <StatCard
                            value={stats.active}
                            label="Active"
                            icon={<Zap size={24} />}
                            variant="success"
                        />
                        <StatCard
                            value={stats.evidence}
                            label="Evidence Files"
                            icon={<FileText size={24} />}
                            variant="default"
                        />
                        <StatCard
                            value={stats.evidence}
                            label="AI Analyses"
                            icon={<BarChart3 size={24} />}
                            variant="default"
                        />
                    </StatGrid>
                </div>

                {/* Section Header */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20
                }}>
                    <h2 style={{ fontSize: 18, fontWeight: 600 }}>
                        All Investigations
                    </h2>
                    <button className="btn-ghost" onClick={() => setShowModal(true)}>
                        <Plus size={16} /> New Case
                    </button>
                </div>

                {/* Cases Grid - Original functionality preserved */}
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
            </div>

            {/* Create Modal - Original functionality preserved */}
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
