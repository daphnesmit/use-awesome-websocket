import { renderHook, waitFor } from '@testing-library/react';
import WS from 'vitest-websocket-mock';
import { ComponentType, PropsWithChildren } from 'react';
import { it, expect, vi } from 'vitest';
import { WebSocketProvider, useWebSocket } from '../src';

const createWrapper = (Wrapper: ComponentType, props: any = {}) => {
  const WrapperWithDisplayName = ({ children }: PropsWithChildren) => (
    <Wrapper {...props}>{children}</Wrapper>
  );

  WrapperWithDisplayName.displayName = `Wrapper(${Wrapper.displayName || Wrapper.name || 'Component'})`;

  return WrapperWithDisplayName;
};

it('should return the correct values', async () => {
  const server = new WS('wss://example.com');

  const onOpen = vi.fn();
  const onClose = vi.fn();
  const onMessage = vi.fn();

  const { result } = renderHook(
    () =>
      useWebSocket({
        url: 'wss://example.com',
        onOpen,
        onClose,
        onMessage,
        shouldConnect: true,
      }),
    { wrapper: createWrapper(WebSocketProvider) }
  );

  await server.connected;
  expect(onOpen).toHaveBeenCalled();
  expect(result.current.websocket.readyState).toBe(WebSocket.OPEN);

  await waitFor(() => {
    expect(result.current.readyState).toBe(1); // 1 is for OPEN state
  });

  result.current.sendData('test message', {
    shouldQueue: true,
    shouldResendOnReconnect: true,
  });

  await expect(server).toReceiveMessage('"test message"');
  expect(server).toHaveReceivedMessages(['"test message"']);

  // close the connection
  server.close();

  await server.closed;

  expect(result.current.websocket.readyState).toBe(WebSocket.CLOSED);
  await waitFor(() => {
    expect(result.current.readyState).toBe(WebSocket.CLOSED); // 3 is for CLOSED state
  });

  WS.clean();
});
