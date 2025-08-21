import { useEffect, useState } from 'react';

interface ConsoleMessage {
  type: 'log' | 'warn' | 'error';
  message: string;
  timestamp: number;
}

// Get game engine from window for dev controls
declare global {
  interface Window {
    gameEngine?: {
      spawnBoid?: (x?: number, y?: number) => void;
      spawnBoss?: () => void;
      spawnShredder?: () => void;
      spawnStarBase?: () => void;
      enableAutopilot?: () => void;
      disableAutopilot?: () => void;
    };
  }
}

export function DevConsole() {
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [showConsole, setShowConsole] = useState(true);
  
  useEffect(() => {
    // Override console methods to capture messages
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.log = (...args) => {
      originalLog(...args);
      setMessages(prev => {
        const newMessages = [...prev, {
          type: 'log' as const,
          message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '),
          timestamp: Date.now()
        }];
        return newMessages.slice(-5); // Keep only last 5
      });
    };
    
    console.warn = (...args) => {
      originalWarn(...args);
      setMessages(prev => {
        const newMessages = [...prev, {
          type: 'warn' as const,
          message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '),
          timestamp: Date.now()
        }];
        return newMessages.slice(-5);
      });
    };
    
    console.error = (...args) => {
      originalError(...args);
      setMessages(prev => {
        const newMessages = [...prev, {
          type: 'error' as const,
          message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '),
          timestamp: Date.now()
        }];
        return newMessages.slice(-5);
      });
    };
    
    // Cleanup
    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);
  
  // Enemy spawn functions
  const spawnEnemy = (type: string) => {
    const engine = window.gameEngine;
    if (!engine) {
      console.error('[DEV] Game engine not available');
      return;
    }
    
    switch(type) {
      case 'bird':
        engine.spawnBoid?.();
        console.log('[DEV] Spawned regular bird');
        break;
      case 'boss':
        engine.spawnBoss?.();
        console.log('[DEV] Spawned boss bird');
        break;
      case 'shredder':
        engine.spawnShredder?.();
        console.log('[DEV] Spawned shredder');
        break;
      case 'starbase':
        engine.spawnStarBase?.();
        console.log('[DEV] Spawned StarBase');
        break;
      case 'autopilot':
        if (window.gameEngine) {
          engine.enableAutopilot?.();
          console.log('[DEV] Autopilot enabled');
        }
        break;
    }
  };
  
  return (
    <>
      {/* Enemy spawn buttons on the left side */}
      <div className="fixed left-2 top-1/2 -translate-y-1/2 z-50 space-y-2">
        <div className="bg-black/90 border border-cyan-500 rounded p-2">
          <div className="text-cyan-400 text-xs font-bold mb-2">SPAWN</div>
          <div className="space-y-1">
            <button
              onClick={() => spawnEnemy('bird')}
              className="block w-full bg-cyan-900/50 hover:bg-cyan-800/50 text-cyan-300 text-xs px-2 py-1 rounded border border-cyan-500/50"
            >
              Bird
            </button>
            <button
              onClick={() => spawnEnemy('boss')}
              className="block w-full bg-magenta-900/50 hover:bg-magenta-800/50 text-magenta-300 text-xs px-2 py-1 rounded border border-magenta-500/50"
            >
              Boss
            </button>
            <button
              onClick={() => spawnEnemy('shredder')}
              className="block w-full bg-red-900/50 hover:bg-red-800/50 text-red-300 text-xs px-2 py-1 rounded border border-red-500/50"
            >
              Shredder
            </button>
            <button
              onClick={() => spawnEnemy('starbase')}
              className="block w-full bg-yellow-900/50 hover:bg-yellow-800/50 text-yellow-300 text-xs px-2 py-1 rounded border border-yellow-500/50"
            >
              StarBase
            </button>
            <hr className="border-cyan-500/30 my-2" />
            <button
              onClick={() => spawnEnemy('autopilot')}
              className="block w-full bg-green-900/50 hover:bg-green-800/50 text-green-300 text-xs px-2 py-1 rounded border border-green-500/50"
            >
              Autopilot
            </button>
          </div>
        </div>
      </div>
      
      {/* Console messages at the top */}
      <div className="fixed top-0 left-0 w-full p-2 z-50 pointer-events-none">
        <div className="bg-black/80 border border-yellow-500/50 rounded p-2 max-w-4xl mx-auto">
          <div 
            className="text-yellow-400 text-xs font-bold mb-1 cursor-pointer pointer-events-auto"
            onClick={() => setShowConsole(!showConsole)}
          >
            DEV CONSOLE (Last 5 messages) [{showConsole ? '-' : '+'}]
          </div>
          {showConsole && (
            <div className="space-y-1 font-mono text-xs">
              {messages.length === 0 && (
                <div className="text-gray-500">No console messages yet...</div>
              )}
              {messages.map((msg, i) => (
                <div 
                  key={`${msg.timestamp}-${i}`}
                  className={`break-all ${
                    msg.type === 'error' ? 'text-red-400' :
                    msg.type === 'warn' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}
                >
                  <span className="text-gray-500">
                    [{new Date(msg.timestamp).toLocaleTimeString()}]
                  </span>{' '}
                  <span className="font-bold">
                    {msg.type.toUpperCase()}:
                  </span>{' '}
                  {msg.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}