"use client";
import { useState } from "react";
import { ImageDown } from "lucide-react";

export type ChartPoint = { label: string; value: number; sub?: string };

/** Renders the chart data to a PNG on demand (no chart library needed). */
export function DownloadChart({
  title,
  points,
  unit,
  filename,
}: {
  title: string;
  points: ChartPoint[];
  unit: string;
  filename: string;
}) {
  const [busy, setBusy] = useState(false);
  const download = () => {
    setBusy(true);
    try {
      const horizontal = points.length > 16 || points.some((p) => p.label.length > 8);
      const W = 1400,
        pad = 70,
        rowH = 44,
        H = horizontal
          ? pad * 2 + 60 + points.length * rowH
          : 800;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#fcfbf8";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#494a55";
      ctx.font = "600 34px 'Source Serif 4', serif";
      ctx.fillText(title, pad, pad);
      ctx.font = "20px 'Outfit', sans-serif";
      ctx.fillStyle = "#6e6f76";
      ctx.fillText(
        `Brihat Mridanga · ${new Date().toLocaleDateString("en-GB")} · ${unit}`,
        pad,
        pad + 32,
      );
      const max = Math.max(...points.map((p) => p.value), 1),
        fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);
      if (horizontal) {
        const labelW = 360,
          top = pad + 70,
          trackW = W - pad * 2 - labelW - 140;
        points.forEach((p, i) => {
          const y = top + i * rowH;
          ctx.fillStyle = "#494a55";
          ctx.font = "20px 'Outfit', sans-serif";
          ctx.fillText(truncate(ctx, p.label, labelW - 20), pad, y + 26);
          ctx.fillStyle = "#e8e5df";
          ctx.fillRect(pad + labelW, y + 8, trackW, 24);
          ctx.fillStyle = i === 0 ? "#eb5b19" : "#494a55";
          ctx.fillRect(pad + labelW, y + 8, (p.value / max) * trackW, 24);
          ctx.fillStyle = "#494a55";
          ctx.font = "600 20px 'Outfit', sans-serif";
          ctx.fillText(fmt(p.value), pad + labelW + trackW + 16, y + 26);
        });
      } else {
        const top = pad + 90,
          bottom = H - pad - 40,
          plotH = bottom - top,
          plotW = W - pad * 2,
          slot = plotW / points.length,
          barW = Math.min(90, slot * 0.62);
        ctx.strokeStyle = "#e8e5df";
        ctx.lineWidth = 2;
        for (let g = 0; g <= 4; g++) {
          const y = top + (plotH * g) / 4;
          ctx.beginPath();
          ctx.moveTo(pad, y);
          ctx.lineTo(W - pad, y);
          ctx.stroke();
          ctx.fillStyle = "#6e6f76";
          ctx.font = "16px 'Outfit', sans-serif";
          ctx.fillText(fmt(Math.round(max - (max * g) / 4)), pad, y - 6);
        }
        points.forEach((p, i) => {
          const h = (p.value / max) * plotH,
            x = pad + slot * i + (slot - barW) / 2;
          ctx.fillStyle = "#eb5b19";
          ctx.fillRect(x, bottom - h, barW, h);
          ctx.fillStyle = "#494a55";
          ctx.font = "600 18px 'Outfit', sans-serif";
          ctx.textAlign = "center";
          if (p.value) ctx.fillText(fmt(p.value), x + barW / 2, bottom - h - 10);
          ctx.font = "18px 'Outfit', sans-serif";
          ctx.fillText(p.label, x + barW / 2, bottom + 30);
          ctx.textAlign = "left";
        });
      }
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={download}
      disabled={busy}
      title="Download image"
      aria-label={`Download ${title} as image`}
    >
      <ImageDown size={18} strokeWidth={1.7} />
    </button>
  );
}

function truncate(ctx: CanvasRenderingContext2D, text: string, width: number) {
  if (ctx.measureText(text).width <= width) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > width) t = t.slice(0, -1);
  return t + "…";
}
