import { useEffect, useState } from 'react';

interface ConsoleMessage {
  type: 'log' | 'warn' | 'error';
  message: string;
  timestamp: number;
}

export function DevConsole() {
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  
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
  
  return (
    <div className="fixed top-0 left-0 w-full p-2 z-50 pointer-events-none">
      <div className="bg-black/80 border border-yellow-500/50 rounded p-2 max-w-4xl mx-auto">
        <div className="text-yellow-400 text-xs font-bold mb-1">DEV CONSOLE (Last 5 messages)</div>
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
      </div>
    </div>
  );
}