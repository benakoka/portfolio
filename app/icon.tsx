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
          background: "#05070d",
          borderRadius: 14,
          border: "2px solid #202847",
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
            background: "#22d3ee",
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
            background: "#5b9dff",
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
            background: "#5b9dff",
            display: "flex",
          }}
        />
      </div>
    ),
    size
  );
}
