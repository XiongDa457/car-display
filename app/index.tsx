import { Dashboard } from "@/components/dashboard";
import { useWebSocket } from "@/hooks/useWebSocket";
import { colors } from "@/utils/colors";
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  const { connected, data, error } = useWebSocket();

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
          {connected ? "Connected" : "Disconnected"}
        </Text>
      </View>

      <Dashboard
        data={data}
        sections={[
          {
            label: "General Metrics",
            meters: [
              {
                key: "throttle",
                label: "Throttle",
                units: "%",
                minVal: 0,
                maxVal: 1,
                color: colors.red,
                convert: 100,
              },
              {
                key: "targetTps",
                label: "Target",
                units: "%",
                minVal: 0,
                maxVal: 100,
                color: colors.orange,
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
