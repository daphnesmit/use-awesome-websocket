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
const WebSocketExample = () => {
  const { readyState, sendData, lastData } = useWebSocket<string, string>();
  const [messageHistory, setMessageHistory] = useState<string[]>([]);

  useEffect(() => {
    if (lastData) {
      setMessageHistory((prev) => [...prev, lastData]);
    }
  }, [lastData]);

  useEffect(() => {
    sendData('test1', 'First Message on effect!');
  }, []);

  console.log('readyState', readyState);
  console.log('lastData', lastData);

  return (
    <div>
      <button
        type="button"
        onClick={() => sendData('test2', 'Hello')}
        disabled={readyState !== WEBSOCKET_READY_STATE.OPEN}
      >
        Click to send &apos;Hello&apos;
      </button>
      <button
        type="button"
        onClick={() => sendData('test3', 'Bye')}
        disabled={readyState !== WEBSOCKET_READY_STATE.OPEN}
      >
        Click to send &apos;Bye&apos;
      </button>
      <p>
        The WebSocket ready state is:{' '}
        <strong>{connectionMap[readyState]}</strong>
      </p>
      {lastData ? <p>Last message: {lastData}</p> : null}
      <ul>
        {messageHistory.map((message, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={index}>{message || null}</li>
        ))}
      </ul>
    </div>
  );
};
const Template: StoryFn<typeof WebSocketProvider> = (args) => (
  <WebSocketProvider {...args}>
    <WebSocketExample />
  </WebSocketProvider>
);

export const Default = Template.bind({});

Default.args = {
  url: 'wss://echo.websocket.org',
};
