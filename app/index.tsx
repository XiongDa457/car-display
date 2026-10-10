import { MeterBar } from '@/components/meterBar';
import { useWebSocket } from '@/hooks/useWebSocket';
import { StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const { connected, data, error } = useWebSocket();

  return (
    <View style={styles.container}>
      <View style={{
        alignSelf: "center",
        position: "absolute",
        top: 50,
        backgroundColor: "#333",
        paddingHorizontal: 16,
        height: 40,
        justifyContent: "center",
        borderRadius: 20,
      }}>
        <Text style={{ color: "white", fontSize: 18 }}>{connected ? "Connected" : "Disconnected"}</Text>
      </View>
      <MeterBar data={data} valueKey='throttle' minVal={0} maxVal={1} />
      <MeterBar data={data} valueKey='targetTps' minVal={0} maxVal={100} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
  },
});
