"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { listCases, createCase, deleteCase } from "@/lib/api";
import type { CaseData } from "@/lib/types";
import {
    Search, Plus, Shield, FileText, Clock, X, ChevronRight,
    ChevronDown, Briefcase, AlertTriangle, BarChart3, Zap,
    Eye, Activity
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";

// Dynamic import for 3D sphere
const HeroSphere = dynamic(
    () => import("@/components/ui/HeroSphere").then(mod => mod.HeroSphere).catch(() =>
        import("@/components/ui/HeroSphere").then(mod => mod.HeroSphereFallback)
    ),
    { ssr: false, loading: () => <HeroSpherePlaceholder /> }
);

function HeroSpherePlaceholder() {
    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background: "radial-gradient(circle, rgba(247, 147, 26, 0.08) 0%, transparent 70%)"
        }}>
            <div style={{
                width: 220,
                height: 220,
                borderRadius: "50%",
                background: "radial-gradient(circle at 30% 30%, rgba(247, 147, 26, 0.3), rgba(234, 88, 12, 0.2))",
                animation: "pulseGlow 2s ease-in-out infinite"
            }} />
        </div>
    );
}

// CaseData imported from @/lib/types

export default function Dashboard() {
    const [cases, setCases] = useState<CaseData[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newTags, setNewTags] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Scroll-driven animation refs
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: scrollContainerRef,
        offset: ["start start", "end start"],
    });

    // Globe transforms: scale 1→1.6, opacity 1→0.3, blur 0→8
    const globeScale = useTransform(scrollYProgress, [0, 1], [1, 1.6]);
    const globeOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);
    const globeBlur = useTransform(scrollYProgress, [0, 1], [0, 8]);
    const globeFilterBlur = useTransform(globeBlur, (v: number) => `blur(${v}px)`);

    // Panel reveals: staggered translateY + opacity
    const panel1Y = useTransform(scrollYProgress, [0.2, 0.7], [100, 0]);
    const panel1Opacity = useTransform(scrollYProgress, [0.2, 0.7], [0, 1]);
    const panel2Y = useTransform(scrollYProgress, [0.3, 0.8], [100, 0]);
    const panel2Opacity = useTransform(scrollYProgress, [0.3, 0.8], [0, 1]);
    const statY = useTransform(scrollYProgress, [0.4, 0.9], [60, 0]);
    const statOpacity = useTransform(scrollYProgress, [0.4, 0.9], [0, 1]);

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

    // AI Insights data
    const healthAlerts = cases
        .filter(c => (c.evidenceCount || 0) === 0)
        .slice(0, 5);

    // Activity Today data
    const today = new Date().toDateString();
    const todaysCases = cases
        .filter(c => new Date(c.updatedAt).toDateString() === today)
        .slice(0, 5);

    return (
        <div style={{ minHeight: "100vh", background: "#030304" }}>
            {/* ═══ Background Layer ═══ */}
            <div style={{
                position: "fixed",
                inset: 0,
                zIndex: 0,
                background: `
                    radial-gradient(ellipse 60% 40% at 20% 30%, rgba(247, 147, 26, 0.04) 0%, transparent 70%),
                    radial-gradient(ellipse 50% 50% at 80% 70%, rgba(234, 88, 12, 0.03) 0%, transparent 70%)
                `,
                backgroundSize: "100% 100%, 100% 100%",
                pointerEvents: "none",
            }}>
                {/* Grid pattern */}
                <div style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
                    `,
                    backgroundSize: "50px 50px",
                }} />
            </div>

            {/* ═══ Navbar ═══ */}
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100 }}>
                <Navbar>
                    <div style={{ position: "relative" }}>
                        <Search size={15} style={{
                            position: "absolute",
                            left: 10,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "var(--text-muted)"
                        }} />
                        <input
                            className="search-input"
                            placeholder="Search investigations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: 34 }}
                        />
                    </div>
                </Navbar>
            </div>

            {/* ═══ HERO SECTION — 100vh Globe ═══ */}
            <div ref={scrollContainerRef} style={{ height: "200vh", position: "relative" }}>
                <div style={{
                    position: "sticky",
                    top: 0,
                    height: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    zIndex: 1,
                }}>
                    {/* Label above globe */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        style={{
                            fontSize: 11,
                            fontFamily: "var(--font-mono)",
                            letterSpacing: "0.2em",
                            color: "#94A3B8",
                            textTransform: "uppercase",
                            marginBottom: 24,
                            zIndex: 2,
                        }}
                    >
                        Investigation Network
                    </motion.div>

                    {/* Globe — scroll-driven transforms */}
                    <motion.div
                        style={{
                            width: "60vmin",
                            height: "60vmin",
                            maxWidth: 600,
                            maxHeight: 600,
                            scale: globeScale,
                            opacity: globeOpacity,
                            willChange: "transform, opacity, filter",
                            zIndex: 1,
                            position: "relative",
                        }}
                    >
                        {/* Orange glow behind globe */}
                        <div style={{
                            position: "absolute",
                            inset: "-20%",
                            background: "radial-gradient(circle, rgba(247, 147, 26, 0.12) 0%, rgba(234, 88, 12, 0.05) 40%, transparent 70%)",
                            borderRadius: "50%",
                            pointerEvents: "none",
                        }} />
                        <motion.div
                            style={{ width: "100%", height: "100%", filter: globeFilterBlur }}
                            className="animate-float"
                        >
                            <HeroSphere />
                        </motion.div>
                    </motion.div>

                    {/* CTA below globe */}
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.7 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowModal(true)}
                        style={{
                            marginTop: 36,
                            padding: "14px 36px",
                            background: "linear-gradient(135deg, #EA580C, #F7931A)",
                            border: "none",
                            borderRadius: 9999,
                            color: "white",
                            fontSize: 14,
                            fontWeight: 600,
                            fontFamily: "var(--font-heading)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            boxShadow: "0 0 30px rgba(247, 147, 26, 0.3), 0 4px 16px rgba(0, 0, 0, 0.3)",
                            zIndex: 2,
                            letterSpacing: "0.02em",
                        }}
                    >
                        <Plus size={18} />
                        Create New Investigation
                    </motion.button>

                    {/* Scroll hint */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        style={{
                            position: "absolute",
                            bottom: 40,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 8,
                            zIndex: 2,
                        }}
                    >
                        <span style={{
                            fontSize: 10,
                            fontFamily: "var(--font-mono)",
                            letterSpacing: "0.15em",
                            color: "rgba(247, 147, 26, 0.5)",
                            textTransform: "uppercase",
                        }}>
                            Scroll to explore
                        </span>
                        <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <ChevronDown size={20} color="rgba(247, 147, 26, 0.5)" />
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* ═══ REVEAL SECTION — Panels slide up over faded globe ═══ */}
            <div style={{
                position: "relative",
                zIndex: 10,
                padding: "0 32px 60px",
                maxWidth: 1200,
                margin: "0 auto",
                marginTop: -80,
            }}>
                {/* Two-panel grid */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 20,
                    marginBottom: 32,
                }}>
                    {/* Panel 1: AI Insights */}
                    <motion.div
                        style={{
                            y: panel1Y,
                            opacity: panel1Opacity,
                            willChange: "transform, opacity",
                            background: "#0F1115",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: 16,
                            padding: 28,
                        }}
                    >
                        <div style={{
                            fontSize: 10,
                            fontFamily: "var(--font-mono)",
                            letterSpacing: "0.15em",
                            color: "#F7931A",
                            textTransform: "uppercase",
                            marginBottom: 20,
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}>
                            <Activity size={14} />
                            AI Insights
                        </div>

                        {healthAlerts.length > 0 ? (
                            <div style={{ display: "grid", gap: 10 }}>
                                {healthAlerts.map((c) => (
                                    <div
                                        key={c._id}
                                        onClick={() => router.push(`/cases/${c._id}`)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            padding: "12px 14px",
                                            borderRadius: 10,
                                            background: "rgba(255, 255, 255, 0.02)",
                                            border: "1px solid rgba(255, 255, 255, 0.04)",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                            borderLeft: "3px solid transparent",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderLeftColor = "#F7931A";
                                            e.currentTarget.style.background = "rgba(247, 147, 26, 0.04)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderLeftColor = "transparent";
                                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                                        }}
                                    >
                                        <AlertTriangle size={14} color="#F7931A" style={{ flexShrink: 0 }} />
                                        <span style={{
                                            fontSize: 13,
                                            color: "var(--text-primary)",
                                            fontFamily: "var(--font-body)",
                                        }}>
                                            <strong>{c.title}</strong> needs evidence
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                textAlign: "center",
                                padding: "32px 0",
                                color: "#94A3B8",
                                fontSize: 13,
                            }}>
                                <Shield size={28} style={{ margin: "0 auto 10px", opacity: 0.3 }} />
                                <div>All investigations have evidence</div>
                            </div>
                        )}
                    </motion.div>

                    {/* Panel 2: Activity Today */}
                    <motion.div
                        style={{
                            y: panel2Y,
                            opacity: panel2Opacity,
                            willChange: "transform, opacity",
                            background: "#0F1115",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: 16,
                            padding: 28,
                        }}
                    >
                        <div style={{
                            fontSize: 10,
                            fontFamily: "var(--font-mono)",
                            letterSpacing: "0.15em",
                            color: "#F7931A",
                            textTransform: "uppercase",
                            marginBottom: 20,
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}>
                            <Clock size={14} />
                            Activity Today
                        </div>

                        {todaysCases.length > 0 ? (
                            <div style={{ display: "grid", gap: 10 }}>
                                {todaysCases.map((c) => (
                                    <div
                                        key={c._id}
                                        onClick={() => router.push(`/cases/${c._id}`)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            padding: "12px 14px",
                                            borderRadius: 10,
                                            background: "rgba(255, 255, 255, 0.02)",
                                            border: "1px solid rgba(255, 255, 255, 0.04)",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                        }}
                                    >
                                        <div style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            background: "#F7931A",
                                            boxShadow: "0 0 8px rgba(247, 147, 26, 0.5)",
                                            animation: "pulseGlow 2s ease-in-out infinite",
                                            flexShrink: 0,
                                        }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontSize: 13,
                                                color: "var(--text-primary)",
                                                fontWeight: 500,
                                            }}>{c.title}</div>
                                            <div style={{
                                                fontSize: 11,
                                                color: "#94A3B8",
                                                fontFamily: "var(--font-mono)",
                                                marginTop: 2,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 4,
                                            }}>
                                                <Eye size={10} />
                                                Updated today · {c.evidenceCount || 0} evidence
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                textAlign: "center",
                                padding: "32px 0",
                                color: "#94A3B8",
                                fontSize: 13,
                            }}>
                                <Clock size={28} style={{ margin: "0 auto 10px", opacity: 0.3 }} />
                                <div>No activity today</div>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* ─── Stat Strip ─── */}
                <motion.div
                    style={{
                        y: statY,
                        opacity: statOpacity,
                        willChange: "transform, opacity",
                        display: "flex",
                        justifyContent: "center",
                        gap: 0,
                        marginBottom: 60,
                    }}
                >
                    {[
                        { value: stats.total, label: "Total Cases", icon: Briefcase },
                        { value: stats.active, label: "Active", icon: Zap },
                        { value: stats.evidence, label: "Evidence Files", icon: FileText },
                        { value: cases.filter(c => c.evidenceCount > 0).length, label: "AI Analyses", icon: BarChart3 },
                    ].map((stat, idx) => (
                        <div
                            key={stat.label}
                            style={{
                                padding: "20px 40px",
                                textAlign: "center",
                                borderRight: idx < 3 ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
                            }}
                        >
                            <div style={{
                                fontSize: 28,
                                fontWeight: 700,
                                fontFamily: "var(--font-mono)",
                                color: "var(--text-primary)",
                                lineHeight: 1,
                                marginBottom: 6,
                            }}>
                                {stat.value}
                            </div>
                            <div style={{
                                fontSize: 10,
                                fontFamily: "var(--font-mono)",
                                color: "#94A3B8",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 5,
                            }}>
                                <stat.icon size={11} />
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* ═══ Divider ═══ */}
                <div style={{
                    height: 1,
                    background: "linear-gradient(90deg, transparent, rgba(247, 147, 26, 0.15), transparent)",
                    marginBottom: 40,
                }} />

                {/* ═══ All Investigations Grid ═══ */}
                <div style={{ marginBottom: 40 }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 24,
                    }}>
                        <h2 style={{
                            fontSize: 18,
                            fontWeight: 700,
                            fontFamily: "var(--font-heading)",
                            color: "var(--text-primary)",
                        }}>
                            All Investigations
                        </h2>
                        <button className="btn-ghost" onClick={() => setShowModal(true)}>
                            <Plus size={16} /> New Case
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: 80, color: "var(--text-muted)" }}>
                            <div className="pulse-glow" style={{
                                width: 48, height: 48, borderRadius: 12,
                                background: "var(--bg-tertiary)", margin: "0 auto 16px"
                            }} />
                            Loading cases...
                        </div>
                    ) : filteredCases.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 80 }}>
                            <Shield size={48} style={{ margin: "0 auto 16px", opacity: 0.3, color: "#F7931A" }} />
                            <p style={{ color: "var(--text-muted)", fontSize: 15 }}>
                                {searchQuery ? "No cases match your search." : "No cases yet. Create your first investigation."}
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                            gap: 16,
                        }}>
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
                                        <div style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            marginBottom: 12,
                                        }}>
                                            <h3 style={{
                                                fontSize: 16,
                                                fontWeight: 600,
                                                fontFamily: "var(--font-heading)",
                                                flex: 1,
                                                marginRight: 8,
                                            }}>{c.title}</h3>
                                            <button
                                                onClick={(e) => handleDelete(c._id, e)}
                                                style={{
                                                    background: "transparent",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    color: "var(--text-muted)",
                                                    padding: 4,
                                                }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <p style={{
                                            fontSize: 13,
                                            color: "var(--text-secondary)",
                                            lineHeight: 1.5,
                                            marginBottom: 16,
                                            minHeight: 38,
                                        }}>
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
                                        <div style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            paddingTop: 12,
                                            borderTop: "1px solid var(--border-subtle)",
                                        }}>
                                            <div style={{ display: "flex", gap: 16 }}>
                                                <span style={{
                                                    fontSize: 12,
                                                    color: "var(--text-muted)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 4,
                                                    fontFamily: "var(--font-mono)",
                                                }}>
                                                    <FileText size={12} /> {c.evidenceCount || 0} evidence
                                                </span>
                                                <span style={{
                                                    fontSize: 12,
                                                    color: "var(--text-muted)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 4,
                                                    fontFamily: "var(--font-mono)",
                                                }}>
                                                    <Clock size={12} /> {new Date(c.updatedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <ChevronRight size={16} color="#F7931A" />
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ Create Modal ═══ */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowModal(false)}
                        style={{ zIndex: 200 }}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 style={{
                                fontSize: 20,
                                fontWeight: 700,
                                marginBottom: 24,
                                fontFamily: "var(--font-heading)",
                            }}>
                                <span className="gradient-text">New Investigation</span>
                            </h2>
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div>
                                    <label style={{
                                        fontSize: 12,
                                        color: "var(--text-secondary)",
                                        marginBottom: 6,
                                        display: "block",
                                        fontFamily: "var(--font-heading)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                    }}>Case Title</label>
                                    <input
                                        className="input-field"
                                        placeholder="e.g. Operation Goldfish"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        fontSize: 12,
                                        color: "var(--text-secondary)",
                                        marginBottom: 6,
                                        display: "block",
                                        fontFamily: "var(--font-heading)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                    }}>Description</label>
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
                                    <label style={{
                                        fontSize: 12,
                                        color: "var(--text-secondary)",
                                        marginBottom: 6,
                                        display: "block",
                                        fontFamily: "var(--font-heading)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                    }}>Tags (comma separated)</label>
                                    <input
                                        className="input-field"
                                        placeholder="e.g. fraud, financial, corporate"
                                        value={newTags}
                                        onChange={(e) => setNewTags(e.target.value)}
                                    />
                                </div>
                                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                                    <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
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
