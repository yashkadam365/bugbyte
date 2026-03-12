"use client";

import { useEffect, useRef, useCallback, useState } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

interface WSMessage {
    type: string;
    evidenceId?: string;
    step?: string;
    message?: string;
    count?: number;
    contradictions?: unknown[];
    signals?: number;
}

export function useWebSocket(caseId: string | null) {
    const wsRef = useRef<WebSocket | null>(null);
    const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!caseId) return;

        const ws = new WebSocket(`${WS_URL}/ws/${caseId}`);
        wsRef.current = ws;

        ws.onopen = () => setIsConnected(true);

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setLastMessage(data);
            } catch {
                // ignore malformed messages
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
        };

        ws.onerror = () => {
            setIsConnected(false);
        };

        return () => {
            ws.close();
        };
    }, [caseId]);

    return { lastMessage, isConnected };
}
