import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "NEXUS — Investigation Intelligence Platform",
    description: "AI-powered collaborative investigation platform that transforms scattered evidence into structured investigative intelligence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
