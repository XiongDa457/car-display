import { useState, useEffect, useRef } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import axios from 'axios';


const { width } = Dimensions.get('window');
const GAP = 12;
const NUM_COLUMNS = 2;

const ITEM_WIDTH = (width - (GAP * (NUM_COLUMNS + 1))) / NUM_COLUMNS;

const api = axios.create({
  baseURL: 'http://172.20.10.5:8080',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

export default function Index() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const poll = async () => {
      try {
        const response = await api.get('/get');
        if (isMounted) {
          setData(response.data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted)
          setError(err.message || 'Something went wrong.');
      } finally {
        if (isMounted)
          timeoutRef.current = setTimeout(poll, 250);
      }
    };

    poll();

    return () => {
      isMounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        console.log('Poller safely unmounted and stopped.');
      }
    };
  }, []);


  const gridItems = [
    { title: 'Voltage (V)', num: data?.voltage ?? 0, color: '#f5fe40' },
    { title: 'Current (A)', num: data?.current ?? 0, color: '#40b5fe' },
    { title: 'Speed (km/h)', num: data?.speed ?? 0, color: '#40fe8F' },
    { title: 'Delay (ms)', num: (data?.delay ?? 0) / 1000, color: '#c540fe' },
    { title: 'Temp 1 (C°)', num: data?.temp1 ?? 0, color: '#fe4040' },
    { title: 'Temp 2 (C°)', num: data?.temp2 ?? 0, color: '#fe4040' },
  ];

  return (
    <View style={styles.container}>
      {error &&
        <View style={{
          alignSelf: "center",
          position: "absolute",
          top: 50,
          backgroundColor: "red",
          padding: 10,
          paddingHorizontal: 15,
          borderRadius: 12
        }}>
          <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>{error}</Text>
        </View>
      }

      <View style={styles.grid}>
        {gridItems.map((item, ind) => (
          <View
            key={ind}
            style={styles.gridItem}
          >
            <Text style={{ fontSize: 24, fontWeight: "400", color: item.color }}>{item.title}</Text>
            <Text style={{ marginTop: 6, fontSize: 52, fontWeight: "600", color: item.color }}>{item.num.toFixed(1)}</Text>
          </View>
        ))}
      </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: GAP,
    paddingHorizontal: GAP,
  },
  gridItem: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#0A0A0A",
  },
});
