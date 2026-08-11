import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#0a0c11",
          borderRadius: 14,
          border: "2px solid #262e3f",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 15,
            top: 34,
            width: 9,
            height: 16,
            borderRadius: 2,
            background: "#5fd8c4",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 28,
            top: 24,
            width: 9,
            height: 26,
            borderRadius: 2,
            background: "#f2a63d",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 41,
            top: 14,
            width: 9,
            height: 36,
            borderRadius: 2,
            background: "#f2a63d",
            display: "flex",
          }}
        />
      </div>
    ),
    size
  );
}
