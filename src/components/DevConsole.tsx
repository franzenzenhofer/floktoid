import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Terminal, Bug } from 'lucide-react';

interface ConsoleMessage {
  type: 'log' | 'warn' | 'error' | 'info';
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
      isAutopilotEnabled?: () => boolean;
    };
  }
}

export function DevConsole() {
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [showSpawnPanel, setShowSpawnPanel] = useState(true);
  const [consolePosition, setConsolePosition] = useState<'top' | 'bottom'>('top');
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);
  
  useEffect(() => {
    // Override console methods to capture messages
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;
    
    const addMessage = (type: ConsoleMessage['type'], args: unknown[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      // Filter out noise
      if (message.includes('[PIXI]') || 
          message.includes('[Vite]') || 
          message.includes('Download the React DevTools')) {
        return;
      }
      
      setMessages(prev => {
        const newMessages = [...prev, {
          type,
          message,
          timestamp: Date.now()
        }];
        return newMessages.slice(-10); // Keep last 10 messages
      });
    };
    
    console.log = (...args) => {
      originalLog(...args);
      addMessage('log', args);
    };
    
    console.warn = (...args) => {
      originalWarn(...args);
      addMessage('warn', args);
    };
    
    console.error = (...args) => {
      originalError(...args);
      addMessage('error', args);
    };
    
    console.info = (...args) => {
      originalInfo(...args);
      addMessage('info', args);
    };
    
    // Check autopilot status
    const checkAutopilot = setInterval(() => {
      if (window.gameEngine?.isAutopilotEnabled) {
        setAutopilotEnabled(window.gameEngine.isAutopilotEnabled());
      }
    }, 500);
    
    // Cleanup
    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.info = originalInfo;
      clearInterval(checkAutopilot);
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
        console.info('[DEV] Spawned regular bird');
        break;
      case 'boss':
        engine.spawnBoss?.();
        console.info('[DEV] Spawned boss bird');
        break;
      case 'shredder':
        engine.spawnShredder?.();
        console.info('[DEV] Spawned shredder');
        break;
      case 'starbase':
        engine.spawnStarBase?.();
        console.info('[DEV] Spawned StarBase');
        break;
      case 'autopilot':
        if (autopilotEnabled) {
          engine.disableAutopilot?.();
          setAutopilotEnabled(false);
          console.info('[DEV] Autopilot disabled');
        } else {
          engine.enableAutopilot?.();
          setAutopilotEnabled(true);
          console.info('[DEV] Autopilot enabled');
        }
        break;
    }
  };
  
  const clearConsole = () => {
    setMessages([]);
    console.info('[DEV] Console cleared');
  };
  
  const getMessageColor = (type: ConsoleMessage['type']) => {
    switch(type) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-cyan-400';
      default: return 'text-green-400';
    }
  };
  
  const getMessageIcon = (type: ConsoleMessage['type']) => {
    switch(type) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '✓';
    }
  };
  
  return (
    <>
      {/* Spawn Panel - Left Side */}
      <div className={`fixed left-0 top-1/2 -translate-y-1/2 z-50 transition-transform duration-300 ${
        showSpawnPanel ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center">
          <div className="bg-black/95 border border-cyan-500/80 rounded-r-lg shadow-2xl backdrop-blur-sm">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <Bug className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Dev Spawn</span>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => spawnEnemy('bird')}
                  className="block w-full bg-gradient-to-r from-cyan-900/50 to-cyan-800/50 hover:from-cyan-800/50 hover:to-cyan-700/50 text-cyan-300 text-xs px-3 py-2 rounded border border-cyan-500/50 transition-all hover:scale-105 hover:border-cyan-400"
                >
                  🐦 Bird
                </button>
                <button
                  onClick={() => spawnEnemy('boss')}
                  className="block w-full bg-gradient-to-r from-magenta-900/50 to-magenta-800/50 hover:from-magenta-800/50 hover:to-magenta-700/50 text-magenta-300 text-xs px-3 py-2 rounded border border-magenta-500/50 transition-all hover:scale-105 hover:border-magenta-400"
                >
                  👹 Boss
                </button>
                <button
                  onClick={() => spawnEnemy('shredder')}
                  className="block w-full bg-gradient-to-r from-red-900/50 to-red-800/50 hover:from-red-800/50 hover:to-red-700/50 text-red-300 text-xs px-3 py-2 rounded border border-red-500/50 transition-all hover:scale-105 hover:border-red-400"
                >
                  ⚡ Shredder
                </button>
                <button
                  onClick={() => spawnEnemy('starbase')}
                  className="block w-full bg-gradient-to-r from-yellow-900/50 to-yellow-800/50 hover:from-yellow-800/50 hover:to-yellow-700/50 text-yellow-300 text-xs px-3 py-2 rounded border border-yellow-500/50 transition-all hover:scale-105 hover:border-yellow-400"
                >
                  🛸 StarBase
                </button>
                
                <div className="border-t border-cyan-500/30 my-2" />
                
                <button
                  onClick={() => spawnEnemy('autopilot')}
                  className={`block w-full text-xs px-3 py-2 rounded border transition-all hover:scale-105 ${
                    autopilotEnabled 
                      ? 'bg-gradient-to-r from-green-700/50 to-green-600/50 hover:from-green-600/50 hover:to-green-500/50 text-green-200 border-green-400/50 animate-pulse'
                      : 'bg-gradient-to-r from-gray-900/50 to-gray-800/50 hover:from-gray-800/50 hover:to-gray-700/50 text-gray-300 border-gray-500/50'
                  }`}
                >
                  {autopilotEnabled ? '🤖 Auto ON' : '🤖 Auto OFF'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Toggle button for spawn panel */}
          <button
            onClick={() => setShowSpawnPanel(!showSpawnPanel)}
            className="bg-black/90 border border-l-0 border-cyan-500/80 rounded-r px-1 py-4 hover:bg-cyan-900/50 transition-colors"
            aria-label="Toggle spawn panel"
          >
            {showSpawnPanel ? (
              <ChevronLeft className="w-4 h-4 text-cyan-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        </div>
      </div>
      
      {/* Console Messages - Top or Bottom */}
      <div className={`fixed ${consolePosition === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 z-50 pointer-events-none`}>
        <div className="max-w-4xl mx-auto p-2">
          <div className="pointer-events-auto">
            {/* Console Header */}
            <div className={`bg-black/95 border border-cyan-500/80 ${showConsole ? 'rounded-t-lg' : 'rounded-lg'} backdrop-blur-sm`}>
              <div 
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-cyan-900/20 transition-colors"
                onClick={() => setShowConsole(!showConsole)}
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">
                    Dev Console
                  </span>
                  <span className="text-cyan-600 text-xs">
                    ({messages.length} messages)
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {showConsole && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearConsole();
                        }}
                        className="text-cyan-600 hover:text-cyan-400 text-xs px-2 py-1 rounded hover:bg-cyan-900/30 transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConsolePosition(consolePosition === 'top' ? 'bottom' : 'top');
                        }}
                        className="text-cyan-600 hover:text-cyan-400 text-xs px-2 py-1 rounded hover:bg-cyan-900/30 transition-colors"
                      >
                        Move {consolePosition === 'top' ? 'Down' : 'Up'}
                      </button>
                    </>
                  )}
                  {showConsole ? (
                    <ChevronUp className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-cyan-400" />
                  )}
                </div>
              </div>
            </div>
            
            {/* Console Messages */}
            {showConsole && (
              <div className="bg-black/95 border border-t-0 border-cyan-500/80 rounded-b-lg backdrop-blur-sm max-h-64 overflow-y-auto">
                <div className="p-3 space-y-1 font-mono text-xs">
                  {messages.length === 0 ? (
                    <div className="text-gray-500 italic">No console messages yet...</div>
                  ) : (
                    messages.map((msg, i) => (
                      <div 
                        key={`${msg.timestamp}-${i}`}
                        className={`break-all flex gap-2 ${getMessageColor(msg.type)} hover:bg-gray-900/50 px-2 py-1 rounded transition-colors`}
                      >
                        <span className="text-gray-500 whitespace-nowrap">
                          [{new Date(msg.timestamp).toLocaleTimeString()}]
                        </span>
                        <span className="shrink-0">
                          {getMessageIcon(msg.type)}
                        </span>
                        <span className="font-semibold uppercase text-xs">
                          {msg.type}:
                        </span>
                        <span className="break-words flex-1">
                          {msg.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}