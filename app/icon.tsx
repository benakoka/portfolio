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
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0f16",
          borderRadius: 14,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            background: "#d4ff4a",
            display: "flex",
          }}
        />
      </div>
    ),
    size
  );
}
