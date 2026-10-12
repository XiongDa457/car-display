import {
  MotorNumerics,
  TelemetryData,
  TelemetryNumerics,
} from "@/hooks/useWebSocket";
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

interface MeterConfigShared {
  label: string;
  minVal?: number;
  maxVal: number;
  color: string;
  units?: string;
  convert?: number;
  decimals?: number;
}

type MeterConfig = (
  | {
      double?: false;
      key: TelemetryNumerics;
    }
  | {
      double: true;
      key: MotorNumerics;
    }
) &
  MeterConfigShared;

export interface SectionConfig {
  label?: string;
  meters: MeterConfig[];
}

interface DashboardProps {
  data: SharedValue<TelemetryData>;
  sections: SectionConfig[];
}

function getTextWidth(text: string) {
  "worklet";
  const glyphIds = meterFont.getGlyphIDs(text);
  const glyphWidths = meterFont.getGlyphWidths(glyphIds);
  let textWidth = 0;
  for (const w of glyphWidths) textWidth += w;
  return textWidth;
}

export function Dashboard({ data, sections }: DashboardProps) {
  const throttledData = useSharedValue(data.value);
  const lastUpdateTime = useSharedValue(0);

  useAnimatedReaction(
    () => data.value,
    (currentVal) => {
      const now = performance.now();
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

  const safeColour = useDerivedValue(() => {
    return data.value.safeToRun ? colors.green : colors.red;
  });

  const safeText = useDerivedValue(() => {
    return data.value.safeToRun ? "SAFE" : "NOT SAFE";
  });

  const safeTextX = useDerivedValue(() => {
    const textWidth = getTextWidth(safeText.value);
    return (width.value - textWidth) / 2;
  });

  let currY = 50;
  return (
    <Canvas style={{ flex: 1, width: "100%" }} onSize={size}>
      <RoundedRect
        x={0}
        y={0}
        width={width}
        height={meterStyles.height}
        r={meterStyles.borderRadius}
        color={safeColour}
      />
      <SkiaText
        x={safeTextX}
        y={meterTextOffset}
        font={meterFont}
        text={safeText}
        color={colors.bg}
      />
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

              if (config.double) {
                currY += meterStyles.gaps + meterStyles.height;
                return (
                  <Group key={index}>
                    <MeterBar
                      data={data}
                      throttledData={throttledData}
                      config={{ motorID: "motor1" as "motor1", ...config }}
                      width={width}
                      y={currY - meterStyles.height * 2 - meterStyles.gaps}
                    />
                    <MeterBar
                      data={data}
                      throttledData={throttledData}
                      config={{ motorID: "motor2" as "motor2", ...config }}
                      width={width}
                      y={currY - meterStyles.height}
                    />
                  </Group>
                );
              }

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

type MeterBarProps = {
  data: SharedValue<TelemetryData>;
  throttledData: DerivedValue<TelemetryData>;
  config: (
    | {
        double?: false;
        key: TelemetryNumerics;
      }
    | {
        double: true;
        motorID: "motor1" | "motor2";
        key: MotorNumerics;
      }
  ) &
    MeterConfigShared;
  width: DerivedValue<number>;
  y: number;
};

const meterLabelTextX = meterStyles.border + meterStyles.padding;
const meterTextOffset = meterFontHeight / 2.5 + meterStyles.height / 2;

function MeterBar({ data, throttledData, config, width, y }: MeterBarProps) {
  let {
    label,
    minVal = 0,
    maxVal,
    color,
    units = "",
    convert = 1,
    decimals = 0,
  } = config;

  if (config.double) label = `${label} ${config.motorID.at(-1)}`;

  const rectWidth = useDerivedValue(() => {
    return width.value - meterStyles.border;
  });

  const fillWidth = useDerivedValue(() => {
    const rawValue = config.double
      ? data.value[config.motorID][config.key]
      : data.value[config.key];
    const clamped = clamp(rawValue, minVal, maxVal);
    const progress = (clamped - minVal) / (maxVal - minVal);
    return rectWidth.value * progress;
  });

  const formattedMetric = useDerivedValue(() => {
    const rawValue = config.double
      ? throttledData.value[config.motorID][config.key]
      : throttledData.value[config.key];
    return `${(rawValue * convert).toFixed(decimals)}${units}`;
  });

  const metricTextX = useDerivedValue(() => {
    const textWidth = getTextWidth(formattedMetric.value);
    return width.value - textWidth - meterStyles.border - meterStyles.padding;
  });

  const dynamicClip = useDerivedValue(() => {
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

  const textY = y + meterTextOffset;
  return (
    <Group>
      <SkiaText
        x={meterLabelTextX}
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

      <Group clip={dynamicClip}>
        <SkiaText
          x={meterLabelTextX}
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
