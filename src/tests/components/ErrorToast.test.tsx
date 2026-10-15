import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorToast } from '../../components/feedback/ErrorToast';

describe('ErrorToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the message as an assertive alert', () => {
    render(<ErrorToast message="Algo deu errado." onDismiss={vi.fn()} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Algo deu errado.');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('dismisses itself after 5 seconds', () => {
    const onDismiss = vi.fn();
    render(<ErrorToast message="Erro" onDismiss={onDismiss} />);

    act(() => vi.advanceTimersByTime(4999));
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('cancels the auto-dismiss timer when unmounted', () => {
    const onDismiss = vi.fn();
    const { unmount } = render(
      <ErrorToast message="Erro" onDismiss={onDismiss} />
    );

    unmount();
    act(() => vi.advanceTimersByTime(5000));

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('restarts the timer with the latest onDismiss when it changes', () => {
    const firstDismiss = vi.fn();
    const secondDismiss = vi.fn();
    const { rerender } = render(
      <ErrorToast message="Erro" onDismiss={firstDismiss} />
    );

    act(() => vi.advanceTimersByTime(3000));
    rerender(<ErrorToast message="Erro" onDismiss={secondDismiss} />);
    act(() => vi.advanceTimersByTime(5000));

    expect(firstDismiss).not.toHaveBeenCalled();
    expect(secondDismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses when the close button is clicked', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<ErrorToast message="Erro" onDismiss={onDismiss} />);

    await user.click(
      screen.getByRole('button', { name: /fechar notificação/i })
    );

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
