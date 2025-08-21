import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DevConsole } from '../DevConsole';

describe('DevConsole', () => {
  let originalConsole: {
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
    info: typeof console.info;
  };

  beforeEach(() => {
    // Save original console methods
    originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };

    // Mock window.gameEngine
    window.gameEngine = {
      spawnBoid: vi.fn(),
      spawnBoss: vi.fn(),
      spawnShredder: vi.fn(),
      spawnStarBase: vi.fn(),
      enableAutopilot: vi.fn(),
      disableAutopilot: vi.fn(),
      isAutopilotEnabled: vi.fn().mockReturnValue(false)
    };
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.info = originalConsole.info;
    
    // Clean up window.gameEngine
    delete window.gameEngine;
  });

  describe('UI Elements', () => {
    it('should render spawn panel by default', () => {
      render(<DevConsole />);
      expect(screen.getByText('Dev Spawn')).toBeInTheDocument();
    });

    it('should render console header', () => {
      render(<DevConsole />);
      expect(screen.getByText('Dev Console')).toBeInTheDocument();
    });

    it('should show all spawn buttons', () => {
      render(<DevConsole />);
      expect(screen.getByText('🐦 Bird')).toBeInTheDocument();
      expect(screen.getByText('👹 Boss')).toBeInTheDocument();
      expect(screen.getByText('⚡ Shredder')).toBeInTheDocument();
      expect(screen.getByText('🛸 StarBase')).toBeInTheDocument();
      expect(screen.getByText('🤖 Auto OFF')).toBeInTheDocument();
    });

    it('should toggle spawn panel visibility', () => {
      render(<DevConsole />);
      
      const toggleButton = screen.getByLabelText('Toggle spawn panel');
      expect(screen.getByText('Dev Spawn')).toBeVisible();
      
      fireEvent.click(toggleButton);
      
      // The panel should slide out of view but still be in DOM
      const panel = screen.getByText('Dev Spawn').closest('div')?.parentElement?.parentElement;
      expect(panel).toHaveClass('-translate-x-full');
    });

    it('should toggle console visibility', () => {
      render(<DevConsole />);
      
      const consoleHeader = screen.getByText('Dev Console').closest('div')?.parentElement;
      expect(screen.queryByText('No console messages yet...')).not.toBeInTheDocument();
      
      fireEvent.click(consoleHeader!);
      expect(screen.getByText('No console messages yet...')).toBeInTheDocument();
    });

    it('should move console between top and bottom', () => {
      render(<DevConsole />);
      
      // Open console first
      const consoleHeader = screen.getByText('Dev Console').closest('div')?.parentElement;
      fireEvent.click(consoleHeader!);
      
      const moveButton = screen.getByText('Move Down');
      fireEvent.click(moveButton);
      
      expect(screen.getByText('Move Up')).toBeInTheDocument();
    });
  });

  describe('Spawn Functionality', () => {
    it('should spawn regular bird when clicking Bird button', () => {
      render(<DevConsole />);
      
      const birdButton = screen.getByText('🐦 Bird');
      fireEvent.click(birdButton);
      
      expect(window.gameEngine?.spawnBoid).toHaveBeenCalledTimes(1);
    });

    it('should spawn boss when clicking Boss button', () => {
      render(<DevConsole />);
      
      const bossButton = screen.getByText('👹 Boss');
      fireEvent.click(bossButton);
      
      expect(window.gameEngine?.spawnBoss).toHaveBeenCalledTimes(1);
    });

    it('should spawn shredder when clicking Shredder button', () => {
      render(<DevConsole />);
      
      const shredderButton = screen.getByText('⚡ Shredder');
      fireEvent.click(shredderButton);
      
      expect(window.gameEngine?.spawnShredder).toHaveBeenCalledTimes(1);
    });

    it('should spawn StarBase when clicking StarBase button', () => {
      render(<DevConsole />);
      
      const starbaseButton = screen.getByText('🛸 StarBase');
      fireEvent.click(starbaseButton);
      
      expect(window.gameEngine?.spawnStarBase).toHaveBeenCalledTimes(1);
    });

    it('should toggle autopilot', () => {
      render(<DevConsole />);
      
      const autopilotButton = screen.getByText('🤖 Auto OFF');
      fireEvent.click(autopilotButton);
      
      expect(window.gameEngine?.enableAutopilot).toHaveBeenCalledTimes(1);
    });

    it('should handle missing game engine gracefully', () => {
      delete window.gameEngine;
      render(<DevConsole />);
      
      const birdButton = screen.getByText('🐦 Bird');
      
      // Should not throw when clicking
      expect(() => fireEvent.click(birdButton)).not.toThrow();
    });
  });

  describe('Console Logging', () => {
    it('should capture console.log messages', async () => {
      render(<DevConsole />);
      
      // Open console
      const consoleHeader = screen.getByText('Dev Console').closest('div')?.parentElement;
      fireEvent.click(consoleHeader!);
      
      // Log a message
      console.log('Test log message');
      
      await waitFor(() => {
        expect(screen.getByText(/Test log message/)).toBeInTheDocument();
      });
    });

    it('should capture console.warn messages', async () => {
      render(<DevConsole />);
      
      // Open console
      const consoleHeader = screen.getByText('Dev Console').closest('div')?.parentElement;
      fireEvent.click(consoleHeader!);
      
      // Log a warning
      console.warn('Test warning message');
      
      await waitFor(() => {
        expect(screen.getByText(/Test warning message/)).toBeInTheDocument();
      });
    });

    it('should capture console.error messages', async () => {
      render(<DevConsole />);
      
      // Open console
      const consoleHeader = screen.getByText('Dev Console').closest('div')?.parentElement;
      fireEvent.click(consoleHeader!);
      
      // Log an error
      console.error('Test error message');
      
      await waitFor(() => {
        expect(screen.getByText(/Test error message/)).toBeInTheDocument();
      });
    });

    it('should capture console.info messages', async () => {
      render(<DevConsole />);
      
      // Open console
      const consoleHeader = screen.getByText('Dev Console').closest('div')?.parentElement;
      fireEvent.click(consoleHeader!);
      
      // Log info
      console.info('Test info message');
      
      await waitFor(() => {
        expect(screen.getByText(/Test info message/)).toBeInTheDocument();
      });
    });

    it('should filter out PIXI and Vite messages', async () => {
      render(<DevConsole />);
      
      // Open console
      const consoleHeader = screen.getByText('Dev Console').closest('div')?.parentElement;
      fireEvent.click(consoleHeader!);
      
      // Log filtered messages
      console.log('[PIXI] This should be filtered');
      console.log('[Vite] This should also be filtered');
      console.log('This should appear');
      
      await waitFor(() => {
        expect(screen.queryByText(/PIXI/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Vite/)).not.toBeInTheDocument();
        expect(screen.getByText(/This should appear/)).toBeInTheDocument();
      });
    });

    it('should limit messages to last 10', async () => {
      render(<DevConsole />);
      
      // Open console
      const consoleHeader = screen.getByText('Dev Console').closest('div')?.parentElement;
      fireEvent.click(consoleHeader!);
      
      // Log more than 10 messages
      for (let i = 1; i <= 15; i++) {
        console.log(`Message ${i}`);
      }
      
      await waitFor(() => {
        // Should not see message 1-5
        expect(screen.queryByText(/Message 1$/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Message 5$/)).not.toBeInTheDocument();
        
        // Should see message 6-15
        expect(screen.getByText(/Message 6/)).toBeInTheDocument();
        expect(screen.getByText(/Message 15/)).toBeInTheDocument();
      });
    });

    it('should clear console messages', async () => {
      render(<DevConsole />);
      
      // Open console
      const consoleHeader = screen.getByText('Dev Console').closest('div')?.parentElement;
      fireEvent.click(consoleHeader!);
      
      // Log some messages
      console.log('Message to clear');
      
      await waitFor(() => {
        expect(screen.getByText(/Message to clear/)).toBeInTheDocument();
      });
      
      // Clear console
      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        expect(screen.queryByText(/Message to clear/)).not.toBeInTheDocument();
        expect(screen.getByText('No console messages yet...')).toBeInTheDocument();
      });
    });
  });

  describe('Message Formatting', () => {
    it('should show appropriate icons for message types', async () => {
      render(<DevConsole />);
      
      // Open console
      const consoleHeader = screen.getByText('Dev Console').closest('div')?.parentElement;
      fireEvent.click(consoleHeader!);
      
      console.log('Log message');
      console.warn('Warn message');
      console.error('Error message');
      console.info('Info message');
      
      await waitFor(() => {
        expect(screen.getByText('✓')).toBeInTheDocument(); // Log
        expect(screen.getByText('⚠️')).toBeInTheDocument(); // Warn
        expect(screen.getByText('❌')).toBeInTheDocument(); // Error
        expect(screen.getByText('ℹ️')).toBeInTheDocument(); // Info
      });
    });

    it('should show timestamps for messages', async () => {
      render(<DevConsole />);
      
      // Open console
      const consoleHeader = screen.getByText('Dev Console').closest('div')?.parentElement;
      fireEvent.click(consoleHeader!);
      
      console.log('Timestamped message');
      
      await waitFor(() => {
        // Should have a timestamp in format [HH:MM:SS AM/PM]
        const timestamps = screen.getAllByText(/\[\d{1,2}:\d{2}:\d{2}/);
        expect(timestamps.length).toBeGreaterThan(0);
      });
    });

    it('should apply correct colors to message types', async () => {
      render(<DevConsole />);
      
      // Open console
      const consoleHeader = screen.getByText('Dev Console').closest('div')?.parentElement;
      fireEvent.click(consoleHeader!);
      
      console.error('Error message');
      console.warn('Warn message');
      console.info('Info message');
      console.log('Log message');
      
      await waitFor(() => {
        const errorMsg = screen.getByText(/Error message/).closest('div');
        const warnMsg = screen.getByText(/Warn message/).closest('div');
        const infoMsg = screen.getByText(/Info message/).closest('div');
        const logMsg = screen.getByText(/Log message/).closest('div');
        
        expect(errorMsg).toHaveClass('text-red-400');
        expect(warnMsg).toHaveClass('text-yellow-400');
        expect(infoMsg).toHaveClass('text-cyan-400');
        expect(logMsg).toHaveClass('text-green-400');
      });
    });
  });

  describe('Autopilot Integration', () => {
    it('should update autopilot button state', async () => {
      const mockIsAutopilotEnabled = vi.fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);
      
      window.gameEngine!.isAutopilotEnabled = mockIsAutopilotEnabled;
      
      render(<DevConsole />);
      
      expect(screen.getByText('🤖 Auto OFF')).toBeInTheDocument();
      
      // Wait for interval to check autopilot status
      await waitFor(() => {
        expect(screen.getByText('🤖 Auto ON')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should toggle autopilot correctly', () => {
      window.gameEngine!.isAutopilotEnabled = vi.fn().mockReturnValue(false);
      
      render(<DevConsole />);
      
      const autopilotButton = screen.getByText('🤖 Auto OFF');
      fireEvent.click(autopilotButton);
      
      expect(window.gameEngine?.enableAutopilot).toHaveBeenCalledTimes(1);
      expect(window.gameEngine?.disableAutopilot).not.toHaveBeenCalled();
    });
  });

  describe('Responsive Behavior', () => {
    it('should maintain console message count', async () => {
      render(<DevConsole />);
      
      expect(screen.getByText('(0 messages)')).toBeInTheDocument();
      
      console.log('Message 1');
      console.log('Message 2');
      
      await waitFor(() => {
        expect(screen.getByText('(2 messages)')).toBeInTheDocument();
      });
    });

    it('should handle object serialization in logs', async () => {
      render(<DevConsole />);
      
      // Open console
      const consoleHeader = screen.getByText('Dev Console').closest('div')?.parentElement;
      fireEvent.click(consoleHeader!);
      
      const testObject = { key: 'value', nested: { prop: 123 } };
      console.log(testObject);
      
      await waitFor(() => {
        expect(screen.getByText(/"key":/)).toBeInTheDocument();
        expect(screen.getByText(/"value"/)).toBeInTheDocument();
      });
    });
  });
});