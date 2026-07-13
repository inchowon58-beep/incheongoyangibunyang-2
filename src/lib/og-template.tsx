import type { CSSProperties, ReactNode } from "react";

export const OG_SIZE = { width: 1200, height: 630 };

export const OG_COLORS = {
  dark: "#2c2622",
  orange: "#b08d6a",
  orangeLight: "#d4b896",
  white: "#ffffff",
  gray: "#a89f96",
  pearl: "#f7f3ef",
};

interface OgBrandedProps {
  brandName: string;
  title: string;
  subtitle?: string;
  badge?: string;
}

export function OgBrandedLayout({
  brandName,
  title,
  subtitle,
  badge,
}: OgBrandedProps): ReactNode {
  const containerStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "56px 64px",
    fontFamily: "Georgia, 'Times New Roman', serif",
    background: `linear-gradient(155deg, #2c2622 0%, #3d3530 42%, #b08d6a 155%)`,
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 999,
            background: "linear-gradient(160deg, #FFE8DC 0%, #F5E6D3 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: OG_COLORS.dark,
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          메종
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ color: OG_COLORS.white, fontSize: 36, fontWeight: 700 }}>
            {brandName}
          </div>
          <div style={{ color: OG_COLORS.orangeLight, fontSize: 20, letterSpacing: "0.12em" }}>
            Maison de Coton
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 960 }}>
        {badge && (
          <div
            style={{
              alignSelf: "flex-start",
              background: "rgba(255,255,255,0.12)",
              color: OG_COLORS.orangeLight,
              fontSize: 20,
              fontWeight: 600,
              padding: "10px 24px",
              borderRadius: 999,
              border: "1px solid rgba(212,184,150,0.35)",
            }}
          >
            {badge}
          </div>
        )}
        <div
          style={{
            color: OG_COLORS.white,
            fontSize: 48,
            fontWeight: 600,
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div style={{ color: "#d9d2cb", fontSize: 26, lineHeight: 1.45 }}>{subtitle}</div>
        )}
      </div>

      <div style={{ color: OG_COLORS.gray, fontSize: 20, letterSpacing: "0.08em" }}>
        Coton de Tuléar · Premium Companion
      </div>
    </div>
  );
}

/** 메종드꼬똥 — 귀여운 꼬똥(강아지) 파비콘 */
export function FaviconLayout({ size }: { size: number }): ReactNode {
  const r = size >= 48 ? Math.round(size * 0.22) : Math.max(6, Math.round(size * 0.2));
  const head = size * 0.52;
  const earW = size * 0.28;
  const earH = size * 0.34;
  const eye = Math.max(2, size * 0.08);
  const noseW = Math.max(3, size * 0.12);
  const noseH = Math.max(2.5, size * 0.09);
  const cheek = Math.max(3, size * 0.1);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        borderRadius: r,
        background: "linear-gradient(160deg, #FFE8DC 0%, #FFF6F0 48%, #F5E6D3 100%)",
      }}
    >
      {/* 왼쪽 귀 */}
      <div
        style={{
          position: "absolute",
          width: earW,
          height: earH,
          left: size * 0.14,
          top: size * 0.16,
          borderRadius: `${earW}px ${earW}px ${earW * 0.45}px ${earW * 0.45}px`,
          background: "linear-gradient(180deg, #FFFFFF 0%, #F7EFE6 100%)",
          transform: "rotate(-18deg)",
        }}
      />
      {/* 오른쪽 귀 */}
      <div
        style={{
          position: "absolute",
          width: earW,
          height: earH,
          right: size * 0.14,
          top: size * 0.16,
          borderRadius: `${earW}px ${earW}px ${earW * 0.45}px ${earW * 0.45}px`,
          background: "linear-gradient(180deg, #FFFFFF 0%, #F7EFE6 100%)",
          transform: "rotate(18deg)",
        }}
      />
      {/* 얼굴 */}
      <div
        style={{
          position: "absolute",
          width: head,
          height: head,
          top: size * 0.28,
          borderRadius: "50%",
          background: "linear-gradient(165deg, #FFFFFF 0%, #FFF9F4 55%, #F3E7DB 100%)",
          boxShadow: `0 ${Math.max(1, size * 0.03)}px ${Math.max(2, size * 0.08)}px rgba(176, 141, 106, 0.22)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
      {/* 볼터치 L */}
      <div
        style={{
          position: "absolute",
          width: cheek,
          height: cheek,
          left: size * 0.28,
          top: size * 0.58,
          borderRadius: "50%",
          background: "#F8B8C0",
          opacity: 0.55,
        }}
      />
      {/* 볼터치 R */}
      <div
        style={{
          position: "absolute",
          width: cheek,
          height: cheek,
          right: size * 0.28,
          top: size * 0.58,
          borderRadius: "50%",
          background: "#F8B8C0",
          opacity: 0.55,
        }}
      />
      {/* 눈 L */}
      <div
        style={{
          position: "absolute",
          width: eye,
          height: eye * 1.15,
          left: size * 0.38,
          top: size * 0.48,
          borderRadius: "50%",
          background: "#3D322C",
        }}
      />
      {/* 눈 R */}
      <div
        style={{
          position: "absolute",
          width: eye,
          height: eye * 1.15,
          right: size * 0.38,
          top: size * 0.48,
          borderRadius: "50%",
          background: "#3D322C",
        }}
      />
      {/* 코 */}
      <div
        style={{
          position: "absolute",
          width: noseW,
          height: noseH,
          top: size * 0.58,
          borderRadius: "50%",
          background: "#E8899A",
        }}
      />
      {/* 하이라이트 (귀여움) */}
      {size >= 48 ? (
        <div
          style={{
            position: "absolute",
            width: size * 0.12,
            height: size * 0.08,
            top: size * 0.34,
            left: size * 0.4,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.85)",
          }}
        />
      ) : null}
    </div>
  );
}
