import { useEffect, useRef, useState } from "react";
import { SharedValue, useSharedValue } from "react-native-reanimated";
import ReconnectingWebSocket from "reconnecting-websocket";

type MotorData = {
  temp: number;
  voltage: number;
  current: number;
  tps: number;
  wheelSpeed: number;
};

export type TelemetryData = {
  safeToRun: boolean;
  throttle: number;
  targetTps: number;

  motor1: MotorData;
  motor2: MotorData;
};

type NumericKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

export type TelemetryNumerics = NumericKeys<TelemetryData>;
export type MotorNumerics = NumericKeys<MotorData>;

const defaultMotorData: MotorData = {
  temp: 0,
  voltage: 0,
  current: 0,
  tps: 0,
  wheelSpeed: 0,
};

const defaultTelemetry: TelemetryData = {
  safeToRun: false,
  throttle: 0,
  targetTps: 0,
  motor1: defaultMotorData,
  motor2: defaultMotorData,
};

const url: string = "ws://woodsauto.local:8080";

class WebSocketClient {
  private rws: ReconnectingWebSocket = new ReconnectingWebSocket(url, [], {
    minReconnectionDelay: 1000,
    maxReconnectionDelay: 8000,
    reconnectionDelayGrowFactor: 1.3,
    connectionTimeout: 4000,
    maxRetries: Infinity,
  });

  private pingTimout: number | null = null;
  private pongTimeout: number | null = null;

  private lastPing = 0;

  private sendPing() {
    this.pongTimeout = setTimeout(() => {
      this.rws.reconnect();
    }, 5000);
    this.lastPing = performance.now();
    this.rws.send("ping");
  }

  constructor(
    setConnected: (connected: boolean) => void,
    setPing: (ping: number) => void,
    data: SharedValue<TelemetryData>,
  ) {
    this.rws.onopen = () => setConnected(true);
    this.rws.onclose = () => {
      data.value = defaultTelemetry;
      setConnected(false);
    };

    this.rws.onmessage = (event) => {
      if (event.data == "pong") {
        setPing(performance.now() - this.lastPing);
        if (this.pongTimeout) clearTimeout(this.pongTimeout);
        this.pingTimout = setTimeout(() => this.sendPing(), 1000);
        return;
      }
      data.value = JSON.parse(event.data);
    };

    this.sendPing();
  }

  public close() {
    if (this.pingTimout) clearTimeout(this.pingTimout);
    if (this.pongTimeout) clearTimeout(this.pongTimeout);
    this.rws.close();
  }
}

export function useWebSocket() {
  const clientRef = useRef<WebSocketClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [ping, setPing] = useState(0);
  const data = useSharedValue<TelemetryData>(defaultTelemetry);

  useEffect(() => {
    let client = new WebSocketClient(setConnected, setPing, data);
    clientRef.current = client;

    return () => {
      client.close();
    };
  }, []);

  return { connected, data, ping };
}
