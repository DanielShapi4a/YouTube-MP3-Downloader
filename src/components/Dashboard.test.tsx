import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Dashboard from './Dashboard';
import { Language, Quality, type AppSettings } from '../types';

const settings: AppSettings = {
  saveLocation: 'C:\\Users\\Admin\\Music\\CarTune',
  language: Language.EN,
  quality: Quality.KBPS_320,
  advancedLogging: true,
};

const renderDashboard = () => {
  const props = {
    settings,
    activeDownload: null,
    logs: [],
    onStartDownload: vi.fn(),
    onCancelDownload: vi.fn(),
    onClearLogs: vi.fn(),
  };

  render(<Dashboard {...props} />);
  return props;
};

describe('Dashboard', () => {
  it('starts with an empty URL input and preserves pasted text when switching modes', () => {
    renderDashboard();
    const input = screen.getByPlaceholderText('https://www.youtube.com/watch?v=...');

    expect(input).toHaveValue('');

    fireEvent.change(input, {
      target: { value: 'https://www.youtube.com/watch?v=real-song' },
    });
    fireEvent.click(screen.getByRole('button', { name: /playlist \(batch\)/i }));

    expect(screen.getByPlaceholderText('https://www.youtube.com/playlist?list=...')).toHaveValue(
      'https://www.youtube.com/watch?v=real-song',
    );
  });

  it('sends the preserved URL with the selected playlist mode', () => {
    const props = renderDashboard();
    const input = screen.getByPlaceholderText('https://www.youtube.com/watch?v=...');

    fireEvent.change(input, {
      target: { value: 'https://www.youtube.com/playlist?list=road' },
    });
    fireEvent.click(screen.getByRole('button', { name: /playlist \(batch\)/i }));
    fireEvent.click(screen.getByRole('button', { name: /start download/i }));

    expect(props.onStartDownload).toHaveBeenCalledWith(
      'https://www.youtube.com/playlist?list=road',
      true,
    );
  });
});
