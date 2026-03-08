import React from "react";
import { View } from "react-native";
import Svg, { Polygon, Circle, Line, Text as SvgText } from "react-native-svg";
import Colors from "@/constants/colors";

interface RadarChartProps {
  size?: number;
  data: { label: string; value: number; maxValue?: number }[];
  color?: string;
}

export function RadarChart({ size = 220, data, color }: RadarChartProps) {
  const C = Colors.dark;
  const accentColor = color || C.accent;
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size / 2) * 0.68;
  const levels = 4;
  const n = data.length;

  if (n < 3) return null;

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const getPoint = (i: number, r: number) => ({
    x: cx + r * Math.cos(angle(i)),
    y: cy + r * Math.sin(angle(i)),
  });

  // Gridlines
  const gridPolygons = Array.from({ length: levels }, (_, lvl) => {
    const r = (radius * (lvl + 1)) / levels;
    return Array.from({ length: n }, (_, i) => {
      const p = getPoint(i, r);
      return `${p.x},${p.y}`;
    }).join(" ");
  });

  // Spokes
  const spokes = Array.from({ length: n }, (_, i) => {
    const p = getPoint(i, radius);
    return { x1: cx, y1: cy, x2: p.x, y2: p.y };
  });

  // Data polygon
  const dataPoints = data.map((d, i) => {
    const maxVal = d.maxValue || 10;
    const r = (Math.min(d.value, maxVal) / maxVal) * radius;
    const p = getPoint(i, r);
    return `${p.x},${p.y}`;
  });

  // Labels
  const labelOffset = 18;
  const labels = data.map((d, i) => {
    const p = getPoint(i, radius + labelOffset);
    return { x: p.x, y: p.y, label: d.label, value: d.value };
  });

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size}>
        {/* Grid polygons */}
        {gridPolygons.map((pts, i) => (
          <Polygon
            key={`grid-${i}`}
            points={pts}
            fill="none"
            stroke={C.cardBorder}
            strokeWidth={1}
          />
        ))}

        {/* Spokes */}
        {spokes.map((s, i) => (
          <Line
            key={`spoke-${i}`}
            x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke={C.cardBorder}
            strokeWidth={1}
          />
        ))}

        {/* Data polygon */}
        <Polygon
          points={dataPoints.join(" ")}
          fill={accentColor + "33"}
          stroke={accentColor}
          strokeWidth={2}
        />

        {/* Data points */}
        {dataPoints.map((pt, i) => {
          const [px, py] = pt.split(",").map(Number);
          return (
            <Circle
              key={`dot-${i}`}
              cx={px} cy={py} r={4}
              fill={accentColor}
              stroke={C.background}
              strokeWidth={2}
            />
          );
        })}

        {/* Labels */}
        {labels.map((l, i) => (
          <SvgText
            key={`label-${i}`}
            x={l.x}
            y={l.y}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={9}
            fontFamily="Inter_500Medium"
            fill={C.textSecondary}
          >
            {l.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}
