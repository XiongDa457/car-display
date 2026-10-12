import { Dashboard } from "@/components/dashboard";
import { useWebSocket } from "@/hooks/useWebSocket";
import { colors } from "@/utils/colors";
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  const { connected, data, ping } = useWebSocket();

  return (
    <View style={styles.container}>
      <View style={styles.connectionContainer}>
        <View
          style={[
            styles.connectionDot,
            { backgroundColor: connected ? colors.green : colors.red },
          ]}
        />
        <Text style={styles.connectionText}>
          {connected ? `ping - ${ping.toFixed(0)}ms` : "Disconnected"}
        </Text>
      </View>

      <Dashboard
        data={data}
        sections={[
          {
            label: "Motion",
            meters: [
              {
                key: "throttle",
                label: "Throttle",
                units: "%",
                maxVal: 1,
                color: colors.purple,
                convert: 100,
              },
              {
                key: "targetTps",
                label: "Target",
                units: "%",
                maxVal: 100,
                color: colors.pink,
              },
              {
                key: "motor1.tps",
                label: "Rotation 1",
                units: " tps",
                maxVal: 100,
                color: colors.cyan,
              },
              {
                key: "motor2.tps",
                label: "Rotation 2",
                units: " tps",
                maxVal: 100,
                color: colors.cyan,
              },
              {
                key: "motor1.wheelSpeed",
                label: "Speed 1",
                units: " km/h",
                maxVal: 40,
                decimals: 1,
                color: colors.green,
              },
              {
                key: "motor2.wheelSpeed",
                label: "Speed 2",
                units: " km/h",
                maxVal: 40,
                decimals: 1,
                color: colors.green,
              },
            ],
          },
          {
            label: "Electrical",
            meters: [
              {
                key: "motor1.voltage",
                label: "Voltage 1",
                units: " V",
                minVal: 9,
                maxVal: 12.7,
                decimals: 1,
                color: colors.yellow,
              },
              {
                key: "motor2.voltage",
                label: "Voltage 2",
                units: " V",
                minVal: 9,
                maxVal: 12.7,
                decimals: 1,
                color: colors.yellow,
              },
              {
                key: "motor1.current",
                label: "Current 1",
                units: " A",
                maxVal: 120,
                color: colors.blue,
              },
              {
                key: "motor2.current",
                label: "Current 2",
                units: " A",
                maxVal: 120,
                color: colors.blue,
              },
            ],
          },
          {
            label: "Temperature",
            meters: [
              {
                key: "motor1.temp",
                label: "Temp 1",
                units: " C°",
                maxVal: 90,
                color: colors.red,
              },
              {
                key: "motor2.temp",
                label: "Temp 2",
                units: " C°",
                maxVal: 90,
                color: colors.red,
              },
            ],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 110,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  connectionContainer: {
    alignSelf: "center",
    position: "absolute",
    top: 50,
    backgroundColor: colors.grey,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    gap: 8,
  },
  connectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  connectionText: {
    color: colors.text,
    fontSize: 18,
  },
});
