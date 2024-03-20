import { FC, PropsWithChildren, useCallback, useMemo, useRef } from 'react';
import { WebSocketContext } from './WebSocketContext';

export interface WebSocketProviderProps {
  url?: string;
}
const WebSocketProvider: FC<PropsWithChildren<WebSocketProviderProps>> = ({
  children,
  url,
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
   * import { WebSocketProvider } from '@daphnesmit/use-websocket';
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

  const contextValue = useMemo(() => ({ connect, url }), [connect, url]);

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export { WebSocketProvider };
