/**
 * Campaign progress icon: segments around a grey circle, x/total in orange.
 * - N segments (N = total), starting at 12 o'clock, clockwise.
 * - Earned segments red, remaining grey. Segments extend slightly beyond grey circle.
 * - Centre: "x/total" in large orange, almost filling the circle.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '../constants/Colors';

const SEGMENT_RED = '#E53935';
const SEGMENT_UNFILLED = Colors.neutral[400];

function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = deg2rad(deg);
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
}

function ringSegmentPath(
  cx: number,
  cy: number,
  ri: number,
  ro: number,
  startDeg: number,
  endDeg: number
): string {
  const [x1, y1] = polar(cx, cy, ri, startDeg);
  const [x2, y2] = polar(cx, cy, ro, startDeg);
  const [x3, y3] = polar(cx, cy, ro, endDeg);
  const [x4, y4] = polar(cx, cy, ri, endDeg);
  return `M ${x1} ${y1} L ${x2} ${y2} A ${ro} ${ro} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${ri} ${ri} 0 0 0 ${x1} ${y1} Z`;
}

export interface CampaignProgressCircleProps {
  earned: number;
  total: number;
  size?: number;
  /** Centre circle colour. Campaign: #74A71C (business banner green); reward: grey (default). */
  circleColor?: string;
}

export default function CampaignProgressCircle({
  earned,
  total,
  size = 80,
  circleColor = Colors.grey,
}: CampaignProgressCircleProps) {
  const cx = size / 2;
  const cy = size / 2;
  const greyR = size / 2 - 10;
  const segmentInnerR = greyR;
  const segmentOuterR = greyR + 8;

  const N = Math.max(1, total);
  const gapDeg = 2;
  const segmentDeg = (360 - N * gapDeg) / N;

  const paths: { d: string; fill: string }[] = [];
  for (let i = 0; i < N; i++) {
    const startDeg = 90 - i * (segmentDeg + gapDeg);
    const endDeg = 90 - i * (segmentDeg + gapDeg) - segmentDeg;
    const filled = i < earned;
    paths.push({
      d: ringSegmentPath(cx, cy, segmentInnerR, segmentOuterR, startDeg, endDeg),
      fill: filled ? SEGMENT_RED : SEGMENT_UNFILLED,
    });
  }

  const fontSize = Math.max(16, Math.min(32, Math.floor(size * 0.4)));

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {paths.map((p, i) => (
          <Path key={i} d={p.d} fill={p.fill} />
        ))}
        <Circle cx={cx} cy={cy} r={greyR} fill={circleColor} />
      </Svg>
      <View style={[styles.labelWrap, { width: size, height: size }]} pointerEvents="none">
        <Text style={[styles.label, { fontSize }]}>
          {earned}/{total}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  labelWrap: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontWeight: '800',
    color: Colors.secondary,
  },
});
