import { FC, PropsWithChildren, useCallback, useMemo, useRef } from 'react';
import { WebSocketContext } from './WebSocketContext';

export interface WebSocketProviderProps {
  /**
   * If you want disconnect all sockets on unmount you can set it via the provider
   * @default true
   */
  disconnectOnUnmount?: boolean;
  /**
   * If you want to set a default url for the websocket connection you can set it via the provider
   */
  url?: string;
}
const WebSocketProvider: FC<PropsWithChildren<WebSocketProviderProps>> = ({
  children,
  url,
  disconnectOnUnmount = true,
}) => {
  const websockets = useRef<Record<string, WebSocket>>({});

  /**
   * Provides a socket connection for the application.
   *
   * @remarks
   * This component is responsible for establishing and managing a socket connection
   * to a server. It wraps the child components with a context provider, allowing them
   * to access the socket connection via the `useWebSocket` hook.
   *
   * @example
   * ```tsx
   * import { WebSocketProvider } from 'use-awesome-websocket';
   *
   * function App() {
   *   return (
   *     <WebSocketProvider>
   *      // app content
   *     </WebSocketProvider>
   *   );
   * }
   */
  const connect: ({ path }: { path: string }) => WebSocket = useCallback(
    ({ path }) => {
      const websocket = websockets.current[path];
      if (websocket) {
        const { readyState } = websocket;
        // If the socket is already open or connecting, return it.
        if (
          readyState === WebSocket.OPEN ||
          readyState === WebSocket.CONNECTING
        )
          return websocket;
      }
      // Otherwise, create a new socket and return it.
      const newWebsocket = new WebSocket(path);
      websockets.current[path] = newWebsocket;
      return newWebsocket;
    },
    []
  );

  const contextValue = useMemo(
    () => ({ connect, url, disconnectOnUnmount }),
    [connect, url, disconnectOnUnmount]
  );

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export { WebSocketProvider };
