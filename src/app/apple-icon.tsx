import { ImageResponse } from "next/og";

// iOS home-screen icon (PNG generated at the edge). 180x180 is Apple's touch size.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#19350C",
          color: "#357836",
          fontSize: 104,
          fontWeight: 800,
        }}
      >
        <div style={{ display: "flex", transform: "rotate(-45deg)" }}>🏋️</div>
      </div>
    ),
    { ...size },
  );
}
