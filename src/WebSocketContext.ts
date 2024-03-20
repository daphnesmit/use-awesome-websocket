import { createContext, useContext } from 'react';

export interface WebSocketContextProps {
  connect: (params: { path: string }) => WebSocket;
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
