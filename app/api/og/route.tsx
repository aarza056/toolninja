import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "ToolNinja";
  const desc =
    searchParams.get("desc") ??
    "Fast, free developer tools. No login, no tracking.";

  const shortDesc = desc.length > 90 ? desc.slice(0, 90) + "…" : desc;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Purple glow blob */}
        <div
          style={{
            position: "absolute",
            width: "600px",
            height: "600px",
            borderRadius: "9999px",
            background: "rgba(168,85,247,0.07)",
            top: "-150px",
            left: "-80px",
            display: "flex",
          }}
        />
        {/* Cyan glow blob */}
        <div
          style={{
            position: "absolute",
            width: "400px",
            height: "400px",
            borderRadius: "9999px",
            background: "rgba(6,182,212,0.05)",
            bottom: "-100px",
            right: "-60px",
            display: "flex",
          }}
        />

        {/* Bottom gradient bar */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: "4px",
            background: "linear-gradient(to right, #a855f7, #ec4899, #06b6d4)",
            display: "flex",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "0 80px",
          }}
        >
          {/* Brand row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginBottom: "40px",
            }}
          >
            <div style={{ fontSize: "44px", display: "flex" }}>🥷</div>
            <div
              style={{
                fontSize: "20px",
                color: "#a855f7",
                fontWeight: "700",
                letterSpacing: "0.18em",
                display: "flex",
              }}
            >
              TOOLNINJA
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: title.length > 32 ? "46px" : "60px",
              fontWeight: "800",
              color: "#f5f5f5",
              textAlign: "center",
              lineHeight: "1.15",
              marginBottom: "24px",
              display: "flex",
            }}
          >
            {title}
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: "22px",
              color: "#666666",
              textAlign: "center",
              lineHeight: "1.5",
              marginBottom: "44px",
              display: "flex",
            }}
          >
            {shortDesc}
          </div>

          {/* Pills */}
          <div style={{ display: "flex", gap: "12px" }}>
            {["Free", "No Login", "No Tracking", "Browser-First"].map(
              (tag) => (
                <div
                  key={tag}
                  style={{
                    display: "flex",
                    padding: "7px 18px",
                    background: "rgba(168,85,247,0.08)",
                    borderRadius: "99px",
                    border: "1px solid rgba(168,85,247,0.25)",
                    fontSize: "15px",
                    color: "#a855f7",
                  }}
                >
                  {tag}
                </div>
              )
            )}
          </div>
        </div>

        {/* Footer URL */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            display: "flex",
            fontSize: "14px",
            color: "#333333",
          }}
        >
          toolninja.io
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
