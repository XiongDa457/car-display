import { FlattenedTelemetry, TelemetryNumerics } from "@/hooks/useWebSocket";
import { colors } from "@/utils/colors";
import {
  Canvas,
  Group,
  matchFont,
  rect,
  RoundedRect,
  rrect,
  Text as SkiaText,
  SkSize,
} from "@shopify/react-native-skia";
import {
  clamp,
  DerivedValue,
  SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";

const sectionStyles = {
  gaps: 20,
  fontSize: 28,
};

const meterStyles = {
  firstGap: 14,
  gaps: 10,
  height: 40,
  border: 2,
  borderRadius: 6,
  padding: 8,
  fontSize: 22,
};

const sectionFont = matchFont({
  fontFamily: "System",
  fontSize: sectionStyles.fontSize,
  fontWeight: "500",
});
const sectionFontheight = -sectionFont.getMetrics().ascent;

const meterFont = matchFont({
  fontFamily: "System",
  fontSize: meterStyles.fontSize,
  fontWeight: "500",
});
const meterFontHeight = -meterFont.getMetrics().ascent;

interface MeterConfig {
  key: TelemetryNumerics;
  label: string;
  minVal: number;
  maxVal: number;
  color: string;
  units?: string;
  convert?: number;
}

export interface SectionConfig {
  label?: string;
  meters: MeterConfig[];
}

interface DashboardProps {
  data: SharedValue<FlattenedTelemetry>;
  sections: SectionConfig[];
}

export function Dashboard({ data, sections }: DashboardProps) {
  const throttledData = useSharedValue(data.value);
  const lastUpdateTime = useSharedValue(0);

  useAnimatedReaction(
    () => data.value,
    (currentVal) => {
      const now = Date.now();
      if (now - lastUpdateTime.value >= 100) {
        throttledData.value = currentVal;
        lastUpdateTime.value = now;
      }
    },
    [],
  );

  const size = useSharedValue<SkSize>({ width: 0, height: 0 });
  const width = useDerivedValue(() => {
    return size.value.width;
  });

  let currY = 0;
  return (
    <Canvas style={{ flex: 1, width: "100%" }} onSize={size}>
      {sections.map(({ label, meters }, index) => {
        if (index > 0) currY += sectionStyles.gaps;
        if (label) currY += sectionFontheight;
        return (
          <Group key={index}>
            {label ? (
              <SkiaText
                x={0}
                y={currY}
                text={label}
                font={sectionFont}
                color={colors.text}
              />
            ) : (
              <></>
            )}
            {meters.map((config, index) => {
              if (index == 0) {
                if (label) currY += meterStyles.firstGap;
              } else currY += meterStyles.gaps;
              currY += meterStyles.height;
              return (
                <MeterBar
                  key={index}
                  data={data}
                  throttledData={throttledData}
                  config={config}
                  width={width}
                  y={currY - meterStyles.height}
                />
              );
            })}
          </Group>
        );
      })}
    </Canvas>
  );
}

interface MeterBarProps {
  data: SharedValue<FlattenedTelemetry>;
  throttledData: SharedValue<FlattenedTelemetry>;
  config: MeterConfig;
  width: DerivedValue<number>;
  y: number;
}

export function MeterBar({
  data,
  throttledData,
  config,
  width,
  y,
}: MeterBarProps) {
  const { key, label, minVal, maxVal, color, units = "", convert = 1 } = config;
  const rectWidth = useDerivedValue(() => {
    return width.value - meterStyles.border;
  });

  const fillWidth = useDerivedValue(() => {
    const clamped = clamp(data.value[key], minVal, maxVal);
    const progress = (clamped - minVal) / (maxVal - minVal);
    return rectWidth.value * progress;
  });

  const formattedMetric = useDerivedValue(() => {
    return `${(throttledData.value[key] * convert).toFixed(0)}${units}`;
  });

  const labelTextX = meterStyles.border + meterStyles.padding;
  const metricTextX = useDerivedValue(() => {
    const glyphIds = meterFont.getGlyphIDs(formattedMetric.value);
    const glyphWidths = meterFont.getGlyphWidths(glyphIds);
    let textWidth = 0;
    for (const w of glyphWidths) textWidth += w;
    return width.value - textWidth - meterStyles.border - meterStyles.padding;
  });

  const clipBounds = useDerivedValue(() => {
    return rect(
      meterStyles.border / 2,
      y + meterStyles.border / 2,
      fillWidth.value,
      meterStyles.height - meterStyles.border,
    );
  });

  const roundedClip = useDerivedValue(() => {
    const baseRect = rect(
      meterStyles.border / 2,
      y + meterStyles.border / 2,
      rectWidth.value,
      meterStyles.height - meterStyles.border,
    );
    return rrect(baseRect, meterStyles.borderRadius, meterStyles.borderRadius);
  });

  const textY = y + meterFontHeight / 2.5 + meterStyles.height / 2;
  return (
    <Group>
      <SkiaText
        x={labelTextX}
        y={textY}
        text={label}
        font={meterFont}
        color={color}
      />
      <SkiaText
        x={metricTextX}
        y={textY}
        text={formattedMetric}
        font={meterFont}
        color={color}
      />

      <Group clip={roundedClip}>
        <RoundedRect
          x={meterStyles.border / 2}
          y={y + meterStyles.border / 2}
          width={fillWidth}
          height={meterStyles.height - meterStyles.border}
          color={color}
          r={meterStyles.borderRadius}
        />
      </Group>

      <Group clip={clipBounds}>
        <SkiaText
          x={labelTextX}
          y={textY}
          text={label}
          font={meterFont}
          color={colors.bg}
        />
        <SkiaText
          x={metricTextX}
          y={textY}
          text={formattedMetric}
          font={meterFont}
          color={colors.bg}
        />
      </Group>

      <RoundedRect
        x={meterStyles.border / 2}
        y={y + meterStyles.border / 2}
        width={rectWidth}
        height={meterStyles.height - meterStyles.border}
        r={meterStyles.borderRadius}
        color={color}
        style="stroke"
        strokeWidth={meterStyles.border}
      />
    </Group>
  );
}
