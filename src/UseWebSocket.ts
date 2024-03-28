import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWebSocketContext } from './WebSocketContext';

export enum WEBSOCKET_READY_STATE {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
  UNINSTANTIATED = 4,
}
declare type WebSocketJSONType = Record<never, never> | string;

/** Event types */
export declare type WebSocketOnOpenFunc = (
  data: WebSocketEventMap['open']
) => void;
export declare type WebSocketOnCloseFunc = (
  data: WebSocketEventMap['close']
) => void;
export declare type WebSocketOnErrorFunc = (
  event: WebSocketEventMap['error']
) => void;
export declare type WebSocketOnMessageFunc<T extends WebSocketJSONType> = (
  data: WebSocketEventMap['message'],
  json: T
) => void;
export declare type OnTabLeaveFunc = (
  readyState: WEBSOCKET_READY_STATE
) => void;
export declare type OnTabEnterFunc = (
  readyState: WEBSOCKET_READY_STATE
) => void;

interface WebSocketEvents<T extends WebSocketJSONType> {
  onClose?: WebSocketOnCloseFunc;
  onError?: WebSocketOnErrorFunc;
  onMessage?: WebSocketOnMessageFunc<T>;
  onOpen?: WebSocketOnOpenFunc;
  onTabEnter?: OnTabEnterFunc;
  onTabLeave?: OnTabLeaveFunc;
}

interface WebSocketState<T extends WebSocketJSONType> {
  lastData?: T;
  readyState: WEBSOCKET_READY_STATE;
}

export interface UseWebSocketReturn<
  ReturnedMessageType extends WebSocketJSONType,
  SendMessageType extends WebSocketJSONType,
> extends WebSocketState<ReturnedMessageType> {
  connect: () => WebSocket;
  /**
   * Send data to the websocket server:
   * - If the connection is open, send the data directly
   * - If the connection is not open yet, add the data to the messages queue when shouldQueue is true and send the data when the connection is opened.
   * - If the connection is closed, resend the data when the connection is reopened when shouldResendOnReconnect is true
   */
  sendData: (
    data: SendMessageType,
    options?: { shouldQueue?: boolean; shouldResendOnReconnect?: boolean }
  ) => void;

  websocket: WebSocket;
}

export interface UseWebSocketProps<
  ReturnedMessageType extends WebSocketJSONType,
> extends WebSocketEvents<ReturnedMessageType> {
  /**
   * Disconnect the websocket connection on unmount
   * @default true
   */
  disconnectOnUnmount?: boolean;
  /**
   * The endpoint to connect to, comes after the url. eg: wss://example.com/endpoint
   */
  endpoint?: string;
  /**
   * Maximum number of retries to connect
   * @default 5
   */
  maxRetries?: number;
  /**
   * Interval to reconnect in milliseconds
   * @default 1000
   */
  reconnectInterval?: number;
  /**
   * Determine if it should connect to the websocket server on mount
   * @default true
   */
  shouldConnect?: boolean;
  /**
   * Determine if it should reconnect on close events, such as server shutting down
   * @default () => true
   */
  shouldReconnectOnClose?: (closeEvent: WebSocketEventMap['close']) => boolean;
  /**
   * Retry connecting on error
   * @default false
   */
  shouldRetryOnError?: boolean;
  /**
   * URL to connect to
   */
  url?: string;
}

const useWebSocket: <
  ReturnedMessageType extends WebSocketJSONType,
  SendMessageType extends WebSocketJSONType,
>(
  params?: UseWebSocketProps<ReturnedMessageType>
) => UseWebSocketReturn<ReturnedMessageType, SendMessageType> = <
  T extends WebSocketJSONType,
  J extends WebSocketJSONType,
>(
  params?: UseWebSocketProps<T>
) => {
  const {
    url: propUrl,
    endpoint,
    shouldConnect = true,
    reconnectInterval = 1000,
    maxRetries = 5,
    shouldRetryOnError = false,
    shouldReconnectOnClose = () => true,
    disconnectOnUnmount: propDisconnectOnUnmount = true,
    onClose,
    onError,
    onMessage,
    onOpen,
    onTabEnter,
    onTabLeave,
  } = params || {};

  const {
    connect: contextConnect,
    url: contextUrl,
    disconnectOnUnmount: contextDisconnectOnUnmount,
  } = useWebSocketContext();

  const websocket = useRef<WebSocket>();
  const shouldReconnect = useRef<boolean>(false);
  const retryCount = useRef<number>(0);
  const reconnectTimer = useRef<number>(reconnectInterval);
  const disconnectOnUnmount = useRef<boolean | undefined>(
    propDisconnectOnUnmount || contextDisconnectOnUnmount
  );

  const onCloseRef = useRef<WebSocket['onclose']>();
  const onMessageRef = useRef<WebSocket['onmessage']>();
  const onErrorRef = useRef<WebSocket['onerror']>();
  const onOpenRef = useRef<WebSocket['onopen']>();
  const subscriptions = useRef<string[]>([]);
  const messageQueue = useRef<string[]>([]);

  const [webSocketState, setWebSocketState] = useState<WebSocketState<T>>({
    readyState: WEBSOCKET_READY_STATE.CLOSED,
    lastData: undefined,
  });

  const connect: () => WebSocket = useCallback(() => {
    const url = propUrl || contextUrl;

    if (!url) {
      throw new Error('Websocket `url` not provided');
    }

    const path = `${url}${endpoint || ''}`;
    const newWebsocket = contextConnect({ path });

    newWebsocket.onclose = onCloseRef.current || null;
    newWebsocket.onopen = onOpenRef.current || null;
    newWebsocket.onerror = onErrorRef.current || null;
    newWebsocket.onmessage = onMessageRef.current || null;

    shouldReconnect.current = true;
    websocket.current = newWebsocket;

    setWebSocketState((old) => ({
      ...old,
      readyState: newWebsocket.readyState,
    }));

    return newWebsocket;
  }, [propUrl, contextUrl, endpoint, contextConnect]);

  const subscribe = useCallback((data: J) => {
    subscriptions.current.push(JSON.stringify(data));
  }, []);

  const resetRetryCount = useCallback(() => {
    retryCount.current = 0;
  }, []);

  const sendSubscriptions = useCallback(() => {
    subscriptions.current.forEach((value) => {
      websocket.current?.send(value);
    });
  }, []);

  const sendMessages = useCallback(() => {
    messageQueue.current.splice(0).forEach((message) => {
      websocket.current?.send(message);
    });
  }, []);

  const onopen: WebSocket['onopen'] = useCallback(
    (event: WebSocketEventMap['open']) => {
      resetRetryCount();
      setWebSocketState((old) => ({ ...old, readyState: WebSocket.OPEN }));
      // Send the subscriptions on reopening the connection only
      if (!messageQueue.current.length) sendSubscriptions();
      // Send the messages in the queue
      sendMessages();

      return onOpen?.(event);
    },
    [onOpen, resetRetryCount, sendSubscriptions]
  );

  const onmessage: WebSocket['onmessage'] = useCallback(
    (event: WebSocketEventMap['message']) => {
      let { data } = event;
      try {
        data = JSON.parse(data);
      } catch (e) {
        // do nothing and keep the original data
      }
      setWebSocketState((old) => ({ ...old, lastData: data }));
      onMessage?.(event, data);
    },
    [onMessage]
  );

  const retry = useCallback(() => {
    setTimeout(() => {
      retryCount.current += 1;

      connect();
    }, reconnectTimer.current * retryCount.current);
  }, [connect, maxRetries]);

  const onclose: WebSocket['onclose'] = useCallback(
    (event: WebSocketEventMap['close']) => {
      setWebSocketState((old) => ({ ...old, readyState: WebSocket.CLOSED }));
      onClose?.(event);

      /**
       * Connection Closed; try to connect again when shouldReconnectOnClose is true and shouldReconnect is set to true
       * A manual close will set shouldReconnect to false, it will not reconnect.
       */
      if (shouldReconnectOnClose?.(event)) {
        if (retryCount.current >= maxRetries || !shouldReconnect.current) {
          return;
        }
        retry();
      }
    },
    [maxRetries, onClose, retry]
  );

  const onerror: WebSocket['onerror'] = useCallback(
    (event: WebSocketEventMap['error']) => {
      setWebSocketState((old) => ({ ...old, readyState: WebSocket.CLOSING }));

      // Retry connecting on error
      if (shouldRetryOnError) {
        if (retryCount.current >= maxRetries || !shouldReconnect.current) {
          return;
        }
        retry();
      }
      onError?.(event);
    },
    [onError]
  );

  const sendData = useCallback(
    (
      message: J,
      props?: { shouldQueue?: boolean; shouldResendOnReconnect?: boolean }
    ) => {
      const { shouldQueue, shouldResendOnReconnect } = props || {};
      // Add the subscription to the list
      if (shouldResendOnReconnect) subscribe(message);

      // Send the message directly if the connection is already open
      if (websocket.current?.readyState === WebSocket.OPEN) {
        websocket.current.send(JSON.stringify(message));
      } else if (shouldQueue) {
        // Add the message to the queue if the connection is not open yet
        messageQueue.current.push(JSON.stringify(message));
      }
    },
    [subscribe]
  );

  /**
   * Close the websocket connection; do not reconnect
   */
  const close = useCallback((code?: number, reason?: string) => {
    shouldReconnect.current = false;
    websocket.current?.close(code, reason);
  }, []);

  /**
   * When the tab is not focussed, close the connection.
   * When the tab is focussed, try to reconnect.
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!websocket.current) return;

      if (document.visibilityState === 'hidden') {
        close(1000);
        onTabLeave?.(websocket.current?.readyState);
      } else {
        // Connection Closing but not closed yet; just set shouldReconnect to true so it will reconnect on close.
        if (websocket.current?.readyState === WebSocket.CLOSING) {
          shouldReconnect.current = true;
          setWebSocketState((old) => ({
            ...old,
            readyState: WebSocket.CLOSING,
          }));
          onTabEnter?.(WebSocket.CLOSING);
        }
        // Connection Closed; try to reconnect directly
        if (websocket.current?.readyState === WebSocket.CLOSED) {
          setWebSocketState((old) => ({
            ...old,
            readyState: WebSocket.CLOSED,
          }));
          connect();
          onTabEnter?.(WebSocket.CLOSED);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [close, connect, onTabEnter, onTabLeave]);

  /**
   * Because onclose calls connect() again. we get a cirular dependency.
   * With using refs this way, the functions can reference each other without causing a circular dependency issue.
   */
  onCloseRef.current = onclose;
  onErrorRef.current = onerror;
  onOpenRef.current = onopen;
  onMessageRef.current = onmessage;

  /**
   * Check if the socket is we should connect to the socket
   * Close the websocket connection on unmount
   */
  useEffect(() => {
    if (shouldConnect) {
      connect();
    }
    return () => {
      if (disconnectOnUnmount.current) {
        close(1000, 'Disconnecting Socket on unmount!');
      }
    };
  }, [close, connect, shouldConnect]);

  return useMemo(
    () =>
      ({
        connect,
        websocket: websocket.current,
        sendData,
        ...webSocketState,
      }) as UseWebSocketReturn<T, J>,
    [connect, sendData, webSocketState]
  );
};

export { useWebSocket };
