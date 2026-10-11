import { FlattenedTelemetry, TelemetryNumerics } from '@/hooks/useWebSocket';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  SharedValue,
  clamp,
} from 'react-native-reanimated';

interface MeterBarProps {
  data: SharedValue<FlattenedTelemetry>;
  valueKey: TelemetryNumerics;
  minVal: number;
  maxVal: number;
}

export function MeterBar({ data, valueKey, minVal, maxVal }: MeterBarProps) {
  const animatedStyle = useAnimatedStyle(() => {
    let interpol01 = (clamp(data.value[valueKey], minVal, maxVal) - minVal) / (maxVal - minVal);
    return {
      width: `${interpol01 * 100}%`,
    };
  });

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 32,
    width: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 6,
  },
  fill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
});
