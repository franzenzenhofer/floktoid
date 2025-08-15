import { useState, useEffect } from 'react';
import { leaderboardService, type LeaderboardEntry } from '../services/LeaderboardService';

interface LeaderboardScreenProps {
  onBack: () => void;
}

interface LeaderboardStats {
  totalPlayers: number;
  playersLast24h: number;
}

export function LeaderboardScreen({ onBack }: LeaderboardScreenProps) {
  const [loading, setLoading] = useState(true);
  const [last24h, setLast24h] = useState<LeaderboardEntry[]>([]);
  const [allTime, setAllTime] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats>({ totalPlayers: 0, playersLast24h: 0 });
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await leaderboardService.getLeaderboard();
        setLast24h(data.last24h || []);
        setAllTime(data.allTime || []);
        setStats({
          totalPlayers: data.totalPlayers || 0,
          playersLast24h: data.playersLast24h || 0
        });
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="fixed inset-0 bg-black overflow-y-auto overflow-x-hidden">
      <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 mt-8">
          <h1 className="text-4xl sm:text-6xl font-bold">
            <span className="neon-text">LEADER</span>
            <span className="neon-pink">BOARD</span>
          </h1>
        </div>
        
        {/* Stats */}
        <div className="flex justify-center gap-8 text-sm sm:text-base text-gray-400">
          <div>
            Total Players: <span className="text-cyan-400">{stats.totalPlayers}</span>
          </div>
          <div>
            Last 24h: <span className="text-yellow-400">{stats.playersLast24h}</span>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center text-cyan-400 animate-pulse">Loading...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* 24 Hour Leaders */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 text-center">
                Last 24 Hours - Top 10
              </h2>
              <div className="space-y-2">
                {last24h.length === 0 ? (
                  <div className="text-center text-gray-500">No scores yet today</div>
                ) : (
                  last24h.map((entry, index) => (
                    <div
                      key={`24h-${index}`}
                      className={`flex justify-between items-center p-2 rounded ${
                        index === 0 ? 'bg-yellow-900/20 border border-yellow-600' :
                        index === 1 ? 'bg-gray-800/30 border border-gray-600' :
                        index === 2 ? 'bg-orange-900/20 border border-orange-700' :
                        'bg-gray-900/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${
                          index === 0 ? 'text-yellow-400 text-xl' :
                          index === 1 ? 'text-gray-300 text-lg' :
                          index === 2 ? 'text-orange-600 text-lg' :
                          'text-gray-500'
                        }`}>
                          #{index + 1}
                        </span>
                        <span className="text-cyan-300">{entry.username}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-mono">{entry.score.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{formatDate(entry.timestamp)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* All Time Leaders */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 text-center">
                All Time - Top 10
              </h2>
              <div className="space-y-2">
                {allTime.length === 0 ? (
                  <div className="text-center text-gray-500">No scores yet</div>
                ) : (
                  allTime.map((entry, index) => (
                    <div
                      key={`all-${index}`}
                      className={`flex justify-between items-center p-2 rounded ${
                        index === 0 ? 'bg-cyan-900/20 border border-cyan-600' :
                        index === 1 ? 'bg-gray-800/30 border border-gray-600' :
                        index === 2 ? 'bg-blue-900/20 border border-blue-700' :
                        'bg-gray-900/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${
                          index === 0 ? 'text-cyan-400 text-xl' :
                          index === 1 ? 'text-gray-300 text-lg' :
                          index === 2 ? 'text-blue-400 text-lg' :
                          'text-gray-500'
                        }`}>
                          #{index + 1}
                        </span>
                        <span className="text-cyan-300">{entry.username}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-mono">{entry.score.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{formatDate(entry.timestamp)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Back Button */}
        <div className="text-center pb-8">
          <button
            onClick={onBack}
            className="px-6 py-2 text-lg font-bold bg-transparent border-2 border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white transition-all duration-300"
          >
            BACK TO MENU
          </button>
        </div>
      </div>
    </div>
  );
}