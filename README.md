# useWebsocket

React hook and provider to integrate WebSockets into your React Components.

**[Live Demo](https://daphnesmit.github.io/use-awesome-websocket/)**

Pull requests welcomed!

## Installation

```sh
npm install --save use-awesome-websocket
```

or

```sh
yarn add use-awesome-websocket
```

## Usage

### WebSocketProvider

`WebSocketProvider` is a React component that provides a WebSocket connection to your entire React application.
It wraps the child components with a context provider, allowing them to access the socket connection via the `useWebSocket` hook.
It takes two props in the interface:

```tsx
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
```

Here's an example of how to use it:

```tsx
import { WebSocketProvider } from 'use-awesome-websocket';

function App() {
  return (
    <WebSocketProvider url="wss://your-websocket-url">
      <YourComponent />
    </WebSocketProvider>
  );
}
```

Please replace `wss://your-websocket-url` with your actual ws url.
Please replace `<YourComponent />` with your actual component.

### useWebsocket

`useWebsocket` is a custom React hook that allows you to interact with the WebSocket connection provided by `WebSocketProvider`.
You can provide the following properties:

```tsx
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
```

And the hook returns the following interface:

```tsx
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
```

Here's an example of how to use it:

```jsx
import { useWebsocket, WEBSOCKET_READY_STATE } from 'use-awesome-websocket';

function YourComponent() {
  const { readyState, sendData, lastData } = useWebSocket<string, string>({
    url: 'wss://your-websocket-url',
  });
  const [messageHistory, setMessageHistory] = useState<string[]>([]);

  useEffect(() => {
    if (lastData) {
      setMessageHistory((prev) => [...prev, lastData]);
    }
  }, [lastData]);

  useEffect(() => {
    sendData('First Message on effect!', {
      shouldQueue: true,
      shouldResendOnReconnect: true,
    });
  }, []);

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          sendData('Hello', {
            shouldResendOnReconnect: true,
          })
        }
        disabled={readyState !== WEBSOCKET_READY_STATE.OPEN}
      >
        Click to send &apos;Hello&apos;
      </button>
      <button
        type="button"
        onClick={() => sendData('Bye')}
        disabled={readyState !== WEBSOCKET_READY_STATE.OPEN}
      >
        Click to send &apos;Bye&apos;
      </button>
      <p>
        The WebSocket ready state is:{' '}
        <strong>{connectionMap[readyState]}</strong>
      </p>
      <h3>Last data </h3>
      {lastData ? <p>Last message: {lastData}</p> : null}
      <h3>Message history</h3>
      <ul>
        {messageHistory.map((message, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={index}>{message || null}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Requirements

- React >=17
- Cannot be used within a class component (must be a functional component that supports React Hooks)
