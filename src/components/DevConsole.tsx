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
      spawnStarBaseWave7?: () => void;
      spawnStarBaseWave17?: () => void;
      enableAutopilot?: () => void;
      disableAutopilot?: () => void;
      isAutopilotEnabled?: () => boolean;
      getScore?: () => number;
      getWave?: () => number;
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
      case 'starbase7':
        engine.spawnStarBaseWave7?.();
        console.info('[DEV] Spawned StarBase Wave 7 (6 HP)');
        break;
      case 'starbase17':
        engine.spawnStarBaseWave17?.();
        console.info('[DEV] Spawned StarBase Wave 17 (8 HP)');
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
      case 'submitScore':
        submitTestScore();
        break;
    }
  };
  
  const submitTestScore = async () => {
    console.info('[DEV] Testing leaderboard submission...');
    
    // Get current game state
    const engine = window.gameEngine;
    if (!engine) {
      console.error('[DEV] No game engine available');
      return;
    }
    
    const score = engine.getScore ? engine.getScore() : Math.floor(Math.random() * 10000);
    const wave = engine.getWave ? engine.getWave() : Math.floor(Math.random() * 30) + 1;
    const gameId = `dev_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Import and use leaderboard service
    try {
      const { leaderboardService } = await import('../services/LeaderboardService');
      console.info(`[DEV] Submitting score: ${score}, wave: ${wave}, gameId: ${gameId}`);
      
      const success = await leaderboardService.submitScore(score, wave, gameId);
      
      if (success) {
        console.info('[DEV] ✅ Score submitted successfully!');
        console.info('[DEV] Check leaderboard at: https://floktoid.franzai.com/leaderboard');
        
        // Verify it appears
        setTimeout(async () => {
          const data = await leaderboardService.getLeaderboard();
          const username = localStorage.getItem('floktoid_username') || 'Unknown';
          const found = data.last24h?.find((e: any) => e.gameId === gameId);
          if (found) {
            console.info('[DEV] ✅ VERIFIED: Score appears in leaderboard!', found);
          } else {
            console.error('[DEV] ❌ Score NOT found in leaderboard after submission');
            console.error('[DEV] Username:', username);
            console.error('[DEV] Last 24h entries:', data.last24h);
          }
        }, 2000);
      } else {
        console.error('[DEV] ❌ Score submission failed');
      }
    } catch (error) {
      console.error('[DEV] Error during submission:', error);
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
                  className="block w-full bg-gradient-to-r from-cyan-900 to-cyan-700 hover:from-cyan-700 hover:to-cyan-500 text-white text-xs font-bold px-3 py-2 rounded border-2 border-cyan-400 transition-all hover:scale-105 hover:border-cyan-300 shadow-lg"
                >
                  BIRD
                </button>
                <button
                  onClick={() => spawnEnemy('boss')}
                  className="block w-full bg-gradient-to-r from-magenta-900 to-magenta-700 hover:from-magenta-700 hover:to-magenta-500 text-white text-xs font-bold px-3 py-2 rounded border-2 border-magenta-400 transition-all hover:scale-105 hover:border-magenta-300 shadow-lg"
                >
                  BOSS
                </button>
                <button
                  onClick={() => spawnEnemy('shredder')}
                  className="block w-full bg-gradient-to-r from-red-900 to-red-700 hover:from-red-700 hover:to-red-500 text-white text-xs font-bold px-3 py-2 rounded border-2 border-red-400 transition-all hover:scale-105 hover:border-red-300 shadow-lg"
                >
                  SHREDDER
                </button>
                <button
                  onClick={() => spawnEnemy('starbase')}
                  className="block w-full bg-gradient-to-r from-yellow-900 to-yellow-700 hover:from-yellow-700 hover:to-yellow-500 text-white text-xs font-bold px-3 py-2 rounded border-2 border-yellow-400 transition-all hover:scale-105 hover:border-yellow-300 shadow-lg"
                >
                  STARBASE
                </button>
                <button
                  onClick={() => spawnEnemy('starbase7')}
                  className="block w-full bg-gradient-to-r from-yellow-800 to-yellow-600 hover:from-yellow-600 hover:to-yellow-400 text-white text-xs font-bold px-3 py-2 rounded border-2 border-yellow-300 transition-all hover:scale-105 hover:border-yellow-200 shadow-lg"
                >
                  STARBASE 7
                </button>
                <button
                  onClick={() => spawnEnemy('starbase17')}
                  className="block w-full bg-gradient-to-r from-orange-800 to-orange-600 hover:from-orange-600 hover:to-orange-400 text-white text-xs font-bold px-3 py-2 rounded border-2 border-orange-300 transition-all hover:scale-105 hover:border-orange-200 shadow-lg"
                >
                  STARBASE 17
                </button>
                
                <div className="border-t border-cyan-500/30 my-2" />
                
                <button
                  onClick={() => spawnEnemy('autopilot')}
                  className={`block w-full text-xs font-bold px-3 py-2 rounded border-2 transition-all hover:scale-105 shadow-lg ${
                    autopilotEnabled 
                      ? 'bg-gradient-to-r from-green-700 to-green-500 hover:from-green-600 hover:to-green-400 text-white border-green-300 animate-pulse'
                      : 'bg-gradient-to-r from-gray-700 to-gray-500 hover:from-gray-600 hover:to-gray-400 text-white border-gray-400'
                  }`}
                >
                  {autopilotEnabled ? 'AUTO ON' : 'AUTO OFF'}
                </button>
                
                <div className="border-t border-cyan-500/30 my-2" />
                
                <button
                  onClick={() => spawnEnemy('submitScore')}
                  className="block w-full bg-gradient-to-r from-purple-700 to-purple-500 hover:from-purple-600 hover:to-purple-400 text-white text-xs font-bold px-3 py-2 rounded border-2 border-purple-300 transition-all hover:scale-105 shadow-lg"
                >
                  TEST SUBMIT
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