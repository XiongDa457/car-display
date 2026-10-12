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
                double: true,
                key: "tps",
                label: "Rotation",
                units: " tps",
                maxVal: 100,
                color: colors.cyan,
              },
              {
                double: true,
                key: "wheelSpeed",
                label: "Speed",
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
                double: true,
                key: "voltage",
                label: "Voltage",
                units: " V",
                minVal: 9,
                maxVal: 12.7,
                decimals: 1,
                color: colors.yellow,
              },
              {
                double: true,
                key: "current",
                label: "Current",
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
                double: true,
                key: "temp",
                label: "Temp",
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
