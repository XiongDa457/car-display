import { useEffect, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import ReconnectingWebSocket from 'reconnecting-websocket';

type MotorData = {
  temp: number;
  voltage: number;
  current: number;
  tps: number;
  wheelSpeed: number;
}

type TelemetryData = {
  safeToRun: boolean;
  throttle: number;
  targetTps: number;

  motor1: MotorData;
  motor2: MotorData;
};

type Primitive = string | number | boolean | bigint | symbol | null | undefined | Date | RegExp | Function | Array<any>;

type Flatten<T> = T extends Primitive ? T : {
  [K in keyof T & (string | number) as
  T[K] extends Primitive ? K :
  `${K}.${keyof Flatten<T[K]> & (string | number)}`]:
  T[K] extends Primitive ? T[K] :
  Flatten<T[K]>[keyof Flatten<T[K]>];
};

type FilterKeysByValue<T, ValueType> = {
  [K in keyof T]: T[K] extends ValueType ? K : never;
}[keyof T];

export type FlattenedTelemetry = Flatten<TelemetryData>;
export type TelemetryNumerics = FilterKeysByValue<FlattenedTelemetry, number>;

function flattenObject<T extends Record<string, any>>(obj: T, prefix = ''): Flatten<T> {
  return Object.keys(obj).reduce((acc, key) => {
    const pre = prefix.length ? `${prefix}.` : '';
    const value = obj[key];

    if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      !(value instanceof RegExp)
    ) {
      Object.assign(acc, flattenObject(value, pre + key));
    } else {
      (acc as any)[pre + key] = value;
    }

    return acc;
  }, {} as Flatten<T>);
}

const defaultMotorData: MotorData = {
  temp: 0,
  voltage: 0,
  current: 0,
  tps: 0,
  wheelSpeed: 0,
}

const defaultTelemetry: FlattenedTelemetry = flattenObject({
  safeToRun: false,
  throttle: 0,
  targetTps: 0,
  motor1: defaultMotorData,
  motor2: defaultMotorData,
});

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
    setData: (data: FlattenedTelemetry) => void,
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
      setData(flattenObject(JSON.parse(event.data) as TelemetryData));
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
  const data = useSharedValue<FlattenedTelemetry>(defaultTelemetry);
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
