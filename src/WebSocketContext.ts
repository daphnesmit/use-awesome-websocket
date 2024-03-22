import { createContext, useContext } from 'react';

export interface WebSocketContextProps {
  /**
   * Connect to a websocket
   */
  connect: (params: { path: string }) => WebSocket;
  /**
   * If you want disconnect all sockets on unmount
   * @default true
   */
  disconnectOnUnmount?: boolean;
  /**
   * Default url for the websocket connection
   */
  url?: string;
}
const WebSocketContext = createContext({} as WebSocketContextProps);

const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error(
      'useWebSocketContext must be used within an WebSocketContext.Provider'
    );
  }
  return context;
};

export { WebSocketContext, useWebSocketContext };
