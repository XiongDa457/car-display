import { useEffect, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import ReconnectingWebSocket from 'reconnecting-websocket';

export type TelemetryData = {
  safeToRun: boolean;
  throttle: number;
  targetTps: number;

  temp1: number;
  voltage1: number;
  current1: number;
  tps1: number;
  wheelSpeed1: number;

  temp2: number;
  voltage2: number;
  current2: number;
  tps2: number;
  wheelSpeed2: number;
};

const defaultData: TelemetryData = {
  safeToRun: false,
  throttle: 0,
  targetTps: 0,

  temp1: 0,
  voltage1: 0,
  current1: 0,
  tps1: 0,
  wheelSpeed1: 0,

  temp2: 0,
  voltage2: 0,
  current2: 0,
  tps2: 0,
  wheelSpeed2: 0,
};

type FilterKeysByValue<T, ValueType> = {
  [K in keyof T]: T[K] extends ValueType ? K : never;
}[keyof T];

export type TelemetryDataNumerics = FilterKeysByValue<TelemetryData, number>;

const url: string = "ws://woodsauto.local:8080"

class WebSocketClient {
  private rws: ReconnectingWebSocket = new ReconnectingWebSocket(url, [], {
    minReconnectionDelay: 1000,
    maxReconnectionDelay: 8000,
    reconnectionDelayGrowFactor: 1.3,
    connectionTimeout: 4000,
    maxRetries: Infinity,
  });

  private pingInterval: number | null = null;
  private pongTimeout: number | null = null;

  constructor(
    setConnected: (connected: boolean) => void,
    setData: (data: TelemetryData) => void,
    setError: (error: string) => void,
  ) {
    this.rws.onopen = () => setConnected(true);
    this.rws.onclose = () => setConnected(false);
    this.rws.onerror = (event) => setError(event.message);
    this.rws.onmessage = (event) => {
      if (event.data == "pong") {
        if (this.pongTimeout) clearTimeout(this.pongTimeout);
        return;
      }
      setData(JSON.parse(event.data));
    }

    this.pingInterval = setInterval(() => {
      this.pongTimeout = setTimeout(() => {
        this.rws.reconnect();
      }, 5000);
      this.rws.send("ping");
    }, 8000);
  }

  public close() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.pongTimeout) clearTimeout(this.pongTimeout);
    this.rws.close();
  }
}

export function useWebSocket() {
  const clientRef = useRef<WebSocketClient | null>(null);
  const [connected, setConnected] = useState(false);
  const data = useSharedValue<TelemetryData>(defaultData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let client = new WebSocketClient(setConnected, d => data.value = d, setError);
    clientRef.current = client;
    return () => {
      client.close();
    };
  }, []);

  return { connected, data, error };
}
