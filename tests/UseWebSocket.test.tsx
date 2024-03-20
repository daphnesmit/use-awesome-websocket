import { expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ComponentType, PropsWithChildren } from 'react';
import { WebSocketProvider, useWebSocket } from '../src';

const createWrapper =
  (Wrapper: ComponentType, props: any) =>
  ({ children }: PropsWithChildren) => <Wrapper {...props}>{children}</Wrapper>;

/**
 * TODO: tests
 */
it('should return the correct values', async () => {
  const onOpen = vi.fn();
  const { result } = renderHook(
    () => useWebSocket({ url: 'wss://example.com', onOpen }),
    { wrapper: createWrapper(WebSocketProvider, { value: 'foo' }) }
  );

  // Assert initial values
  expect(result.current.readyState).toBe(0);
});
