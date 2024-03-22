import { Meta, StoryFn } from '@storybook/react';

import { useEffect, useState } from 'react';
import { WebSocketProvider, useWebSocket } from '..';
import { WEBSOCKET_READY_STATE } from '../UseWebSocket';

export default {
  title: 'useWebSocket Example',
  component: WebSocketProvider,
  argTypes: {},
} as Meta<typeof WebSocketProvider>;

const connectionMap = {
  [WEBSOCKET_READY_STATE.CONNECTING]: 'Connecting',
  [WEBSOCKET_READY_STATE.OPEN]: 'Open',
  [WEBSOCKET_READY_STATE.CLOSING]: 'Closing',
  [WEBSOCKET_READY_STATE.CLOSED]: 'Closed',
  [WEBSOCKET_READY_STATE.UNINSTANTIATED]: 'Uninstantiated',
};

const SimpleWebSocketExample = ({ url }: { url?: string }) => {
  const { readyState, sendData, lastData } = useWebSocket<string, string>({
    url,
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
};

const TemplateSimple: StoryFn<typeof WebSocketProvider> = (args) => (
  <WebSocketProvider {...args}>
    <SimpleWebSocketExample />
  </WebSocketProvider>
);

export const Default = TemplateSimple.bind({});

Default.args = {
  url: 'wss://echo.websocket.org',
};
interface BitvavoMessage {
  action: 'subscribe';
  channels: Array<{
    markets: string[];
    name: 'ticker24h';
  }>;
}
export interface Ticker24hData {
  ask: string;
  askSize: string;
  bid: string | null;
  bidSize: string | null;
  high: string | null;
  last: string | null;
  low: string | null;
  market: string;
  open: string | null;
  timestamp: number;
  volume: string | null;
  volumeQuote: string | null;
}

interface BitvavoResponse {
  data?: Ticker24hData[];
  event: 'subscribed' | 'ticker24h';
  subscriptions?: { ticker24h: string[] };
}
const BitvavoWebSocketExample = ({ url }: { url?: string }) => {
  const { readyState, sendData, lastData } = useWebSocket<
    BitvavoResponse,
    BitvavoMessage
  >({
    url,
  });
  const [messageHistory, setMessageHistory] = useState<BitvavoResponse[]>([]);

  useEffect(() => {
    if (lastData) {
      setMessageHistory((prev) => [...prev, lastData]);
    }
  }, [lastData]);

  useEffect(() => {
    sendData(
      {
        action: 'subscribe',
        channels: [
          {
            name: 'ticker24h',
            markets: ['BTC-EUR'],
          },
        ],
      },
      {
        shouldQueue: true,
        shouldResendOnReconnect: true,
      }
    );
  }, []);

  return (
    <div>
      <p>
        The WebSocket ready state is:{' '}
        <strong>{connectionMap[readyState]}</strong>
      </p>
      <h3>Last data </h3>
      {lastData ? (
        <>
          <p>Last message: </p>
          <ul>
            <li>
              <strong>Event:</strong> {lastData.event}
            </li>
            {lastData.subscriptions && (
              <li>
                <strong>Subscription:</strong>{' '}
                {lastData.subscriptions?.ticker24h.join(', ')}
              </li>
            )}
            {lastData.data && (
              <li>
                <strong>Data:</strong> {JSON.stringify(lastData.data)}
              </li>
            )}
          </ul>
        </>
      ) : null}
      <h3>Message history</h3>
      <ul>
        {messageHistory.map((message, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={index}>
            <strong>Event:</strong> {message.event}
            <br />
            {message.subscriptions && (
              <>
                <strong>Subscription:</strong>{' '}
                {message.subscriptions?.ticker24h.join(', ')}
                <br />
              </>
            )}
            {message.data && (
              <>
                <strong>Data:</strong> {JSON.stringify(message.data)}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
const MultipleWebSocketExample = () => (
  <div>
    <h2>Echo Websocket Example</h2>
    <SimpleWebSocketExample url="wss://echo.websocket.org" />
    <h2>Bitvavo Websocket Example</h2>
    <BitvavoWebSocketExample url="wss://ws.bitvavo.com/v2/" />
  </div>
);

const TemplateMultiple: StoryFn<typeof WebSocketProvider> = () => (
  <WebSocketProvider>
    <MultipleWebSocketExample />
  </WebSocketProvider>
);

export const MultipleHooks = TemplateMultiple.bind({});

MultipleHooks.args = {};
