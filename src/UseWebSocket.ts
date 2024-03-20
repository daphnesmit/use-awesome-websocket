import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWebSocketContext } from './WebSocketContext';

export enum WEBSOCKET_READY_STATE {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
  UNINSTANTIATED = 4,
}
declare type WebSocketJSONType = Record<never, never>;

/** Event types */
export declare type WebSocketOnOpenFunc = (data: any) => void;
export declare type WebSocketOnCloseFunc = (data: any) => void;
export declare type WebSocketOnErrorFunc = (data: any) => void;
export declare type WebSocketOnMessageFunc<T extends WebSocketJSONType> = (
  data: any,
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
  T extends WebSocketJSONType,
  J extends WebSocketJSONType,
> extends WebSocketState<T> {
  connect: () => WebSocket;
  sendData: (name: string, data: J) => void;
  websocket: WebSocket;
}

export interface UseWebSocketProps<T extends WebSocketJSONType>
  extends WebSocketEvents<T> {
  endpoint?: string;
  maxRetries?: number;
  reconnectInterval?: number;
  shouldConnect?: boolean;
  url?: string;
}

const useWebSocket: <T extends WebSocketJSONType, J extends WebSocketJSONType>(
  params?: UseWebSocketProps<T>
) => UseWebSocketReturn<T, J> = <
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
    onClose,
    onError,
    onMessage,
    onOpen,
    onTabEnter,
    onTabLeave,
  } = params || {};

  const { connect: contextConnect, url: contextUrl } = useWebSocketContext();

  const websocket = useRef<WebSocket>();
  const reconnect = useRef<boolean>(false);
  const retryCount = useRef<number>(0);
  const reconnectTimer = useRef<number>(reconnectInterval);

  const onCloseRef = useRef<WebSocket['onclose']>();
  const onMessageRef = useRef<WebSocket['onmessage']>();
  const onErrorRef = useRef<WebSocket['onerror']>();
  const onOpenRef = useRef<WebSocket['onopen']>();
  const subscriptions = useRef<Map<string, any>>(new Map());

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

    reconnect.current = true;
    websocket.current = newWebsocket;

    setWebSocketState((old) => ({
      ...old,
      readyState: newWebsocket.readyState,
    }));

    return newWebsocket;
  }, [propUrl, contextUrl, endpoint, contextConnect]);

  const subscribe = useCallback((name: string, data: any) => {
    subscriptions.current.set(name, data);
  }, []);

  const resetRetryCount = useCallback(() => {
    retryCount.current = 0;
  }, []);

  const sendSubscriptions = useCallback(() => {
    subscriptions.current.forEach((value) => {
      websocket.current?.send(JSON.stringify(value));
    });
  }, []);

  const onopen: WebSocket['onopen'] = useCallback(
    (event: Event) => {
      resetRetryCount();
      setWebSocketState((old) => ({ ...old, readyState: WebSocket.OPEN }));
      sendSubscriptions();

      return onOpen?.(event);
    },
    [onOpen, resetRetryCount, sendSubscriptions]
  );

  const onmessage: WebSocket['onmessage'] = useCallback(
    (event: MessageEvent) => {
      setWebSocketState((old) => ({ ...old, lastData: event.data }));
      console.log('useWebSocket - onmessage - event', event);
      let { data } = event;
      try {
        if (typeof data !== 'string') {
          data = JSON.parse(data);
        }
      } catch (e) {
        console.error('useWebSocket - onmessage - JSON PARSE error', e);
      }
      onMessage?.(event, data);
    },
    [onMessage]
  );

  const retry = useCallback(() => {
    setTimeout(() => {
      console.warn('Reconnecting...', {
        maxRetries,
        retryCount: retryCount.current,
      });
      retryCount.current += 1;

      connect();
    }, reconnectTimer.current * retryCount.current);
  }, [connect, maxRetries]);

  const onclose: WebSocket['onclose'] = useCallback(
    (event: CloseEvent) => {
      setWebSocketState((old) => ({ ...old, readyState: WebSocket.CLOSED }));
      onClose?.(event);

      /**
       * Connection Closed; try to reconnect when reconnect is true
       *
       * 1000: Normal Closure. This means that the connection was closed, or is being closed, without any error.
       * 1005: No Status Received: also sometimes gets send back
       *
       * I dont feel like we can rely on status codes here so we just check if we should reconnect manually.
       *
       * @see https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
       */

      if (retryCount.current >= maxRetries || !reconnect.current) {
        return;
      }
      retry();
      onClose?.(event);
    },
    [maxRetries, onClose, retry]
  );

  const onerror: WebSocket['onerror'] = useCallback(
    (event: Event) => {
      setWebSocketState((old) => ({ ...old, readyState: WebSocket.CLOSING }));
      onError?.(event);
    },
    [onError]
  );

  const sendData = useCallback(
    (name: string, message: J) => {
      // Add the subscription to the list
      subscribe(name, message);
      console.log('subscribe', name, message);

      // Send the message directly if the connection is already open
      if (websocket.current?.readyState === WebSocket.OPEN) {
        websocket.current.send(JSON.stringify(message));
        console.log('sendData - open ', name, message);
      } else {
        console.log('sendData - not open yet', name, message);
        // JSON.stringify(message);
      }
    },
    [subscribe]
  );

  /**
   * Close the websocket connection; do not reconnect
   */
  const close = useCallback((code?: number, reason?: string) => {
    reconnect.current = false;
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
        // Connection Closing but not closed yet; just set reconect to true so it will reconnect on close.
        if (websocket.current?.readyState === WebSocket.CLOSING) {
          reconnect.current = true;
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

      return () => {
        close(1000, 'Disconnecting Socket on unmount!');
      };
    }
    return undefined;
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
