import { FlattenedTelemetry, TelemetryNumerics } from "@/hooks/useWebSocket";
import { colors } from "@/utils/colors";
import {
  Canvas,
  Group,
  matchFont,
  RoundedRect,
  Text as SkiaText,
  SkSize,
} from "@shopify/react-native-skia";
import {
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
  firstGap: 16,
  gaps: 12,
  height: 40,
  border: 2,
  borderRadius: 6,
  padding: 6,
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
        currY += sectionFontheight;
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
  return (
    <Group>
      <RoundedRect
        x={0}
        y={y}
        width={width}
        height={meterStyles.height}
        r={meterStyles.borderRadius}
        color={config.color}
      />
    </Group>
  );
}
