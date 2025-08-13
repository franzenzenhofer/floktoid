import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-backdrop flex items-start justify-center pt-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 pb-4 border-b flex-shrink-0 sticky top-0 bg-white z-10">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">How to Play</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-6 text-gray-700">
            {/* Goal */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Goal</h3>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="flex justify-center items-center gap-3 text-2xl mb-2">
                  <div className="grid grid-cols-3 gap-1">
                    <span>🟥</span><span>🟩</span><span>🟥</span>
                    <span>🟩</span><span>🟥</span><span>🟩</span>
                    <span>🟥</span><span>🟩</span><span>🟥</span>
                  </div>
                  <span>→</span>
                  <div className="grid grid-cols-3 gap-1">
                    <span>🟩</span><span>🟩</span><span>🟩</span>
                    <span>🟩</span><span>🟩</span><span>🟩</span>
                    <span>🟩</span><span>🟩</span><span>🟩</span>
                  </div>
                  <span>✅</span>
                </div>
                <p>Make all tiles the same color!</p>
              </div>
            </section>

            {/* Click Pattern */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Click Pattern</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-center mb-3">
                  <div className="grid grid-cols-3 gap-2 text-2xl">
                    <div className="w-10 h-10"></div>
                    <div className="w-10 h-10 flex items-center justify-center">⬆️</div>
                    <div className="w-10 h-10"></div>
                    <div className="w-10 h-10 flex items-center justify-center">⬅️</div>
                    <div className="w-10 h-10 flex items-center justify-center bg-white rounded">👆</div>
                    <div className="w-10 h-10 flex items-center justify-center">➡️</div>
                    <div className="w-10 h-10"></div>
                    <div className="w-10 h-10 flex items-center justify-center">⬇️</div>
                    <div className="w-10 h-10"></div>
                  </div>
                </div>
                <p className="text-center">Click affects 5 tiles in a cross pattern</p>
              </div>
            </section>

            {/* Color Cycle */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Color Cycle</h3>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">
                  🟥 → 🟩 → 🟥
                </div>
                <p className="text-sm">For levels 1-9: Only red & green (2 colors)</p>
                <p className="text-xs text-gray-600 mt-1">More colors unlock in later levels</p>
              </div>
            </section>

            {/* Examples */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Examples</h3>
              
              <div className="space-y-4">
                {/* Basic Click */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Basic Click</h4>
                  <div className="flex justify-center items-center gap-4 text-xl">
                    <div className="grid grid-cols-3 gap-1">
                      <span>🟥</span><span>🟥</span><span>🟥</span>
                      <span>🟥</span><span className="bg-yellow-200 rounded">🟩</span><span>🟥</span>
                      <span>🟥</span><span>🟥</span><span>🟥</span>
                    </div>
                    <span>→</span>
                    <div className="grid grid-cols-3 gap-1">
                      <span>🟥</span><span>🟩</span><span>🟥</span>
                      <span>🟩</span><span>🟥</span><span>🟩</span>
                      <span>🟥</span><span>🟩</span><span>🟥</span>
                    </div>
                  </div>
                </div>

                {/* Corner vs Center */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Corner vs Center</h4>
                  <div className="flex justify-around text-sm">
                    <div>
                      <p className="font-medium mb-1">Corner (3 tiles)</p>
                      <div className="grid grid-cols-3 gap-1">
                        <span>👆</span><span>→</span><span>·</span>
                        <span>↓</span><span>·</span><span>·</span>
                        <span>·</span><span>·</span><span>·</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Center (5 tiles)</p>
                      <div className="grid grid-cols-3 gap-1">
                        <span>·</span><span>↑</span><span>·</span>
                        <span>←</span><span>👆</span><span>→</span>
                        <span>·</span><span>↓</span><span>·</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Strategy */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Strategy</h3>
              
              <div className="space-y-3">
                <div className="bg-purple-50 p-3 rounded">
                  <h4 className="font-medium mb-1">1. Click Power</h4>
                  <p className="text-sm">Center = 5 tiles, Edge = 4 tiles, Corner = 3 tiles</p>
                </div>
                
                <div className="bg-purple-50 p-3 rounded">
                  <h4 className="font-medium mb-1">2. Shared Tiles</h4>
                  <p className="text-sm">Adjacent clicks share 1 tile - it flips twice (cancels)</p>
                </div>
                
                <div className="bg-purple-50 p-3 rounded">
                  <h4 className="font-medium mb-1">3. Work Backwards</h4>
                  <p className="text-sm">Picture the winning board. Count what needs to change</p>
                </div>
              </div>
            </section>

            {/* Progression */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Level Progression</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium w-20">L1-9:</span>
                  <span className="text-2xl">🟥🟩</span>
                  <span className="text-gray-600">2 colors (easiest)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium w-20">L10-18:</span>
                  <span className="text-2xl">🟥🟩🟦</span>
                  <span className="text-gray-600">3 colors</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium w-20">L19-27:</span>
                  <span className="text-2xl">🟥🟩🟦🟨</span>
                  <span className="text-gray-600">4 colors</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium w-20">L28+:</span>
                  <span className="text-gray-600">Bigger grids (4×4, 5×5)</span>
                </div>
              </div>
            </section>

            {/* Common Patterns */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Common Patterns & Min-Moves</h3>
              
              <div className="space-y-4">
                {/* Checkerboard */}
                <div className="border rounded-lg p-3">
                  <p className="font-medium text-sm mb-2 text-center">Checkerboard = 4 clicks</p>
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <div className="grid grid-cols-3 gap-0.5">
                      <span>🟥</span><span>🟩</span><span>🟥</span>
                      <span>🟩</span><span>🟥</span><span>🟩</span>
                      <span>🟥</span><span>🟩</span><span>🟥</span>
                    </div>
                    <span>→</span>
                    <div className="grid grid-cols-3 gap-0.5">
                      <span>⬜</span><span>👆</span><span>⬜</span>
                      <span>👆</span><span>⬜</span><span>👆</span>
                      <span>⬜</span><span>👆</span><span>⬜</span>
                    </div>
                    <span>→</span>
                    <div className="grid grid-cols-3 gap-0.5">
                      <span>🟥</span><span>🟥</span><span>🟥</span>
                      <span>🟥</span><span>🟥</span><span>🟥</span>
                      <span>🟥</span><span>🟥</span><span>🟥</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-center">Click: top-mid, left-mid, right-mid, bottom-mid</p>
                </div>
                
                {/* Two Move Win */}
                <div className="border rounded-lg p-3">
                  <p className="font-medium text-sm mb-2 text-center">Two Move Win!</p>
                  <div className="flex items-center justify-center gap-3 text-xs">
                    <div className="grid grid-cols-3 gap-0.5">
                      <span>🟩</span><span>🟩</span><span>🟩</span>
                      <span>🟥</span><span>🟥</span><span>🟥</span>
                      <span>🟩</span><span>🟩</span><span>🟩</span>
                    </div>
                    <span>→</span>
                    <div className="grid grid-cols-3 gap-0.5">
                      <span>⬜</span><span>👆</span><span>⬜</span>
                      <span>⬜</span><span>⬜</span><span>⬜</span>
                      <span>⬜</span><span>👆</span><span>⬜</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-center">Click top-mid, then bottom-mid</p>
                </div>
                
                {/* L-Shape Win */}
                <div className="border rounded-lg p-3">
                  <p className="font-medium text-sm mb-2 text-center">L-Shape = 1 click!</p>
                  <div className="flex items-center justify-center gap-3 text-xs">
                    <div className="grid grid-cols-3 gap-0.5">
                      <span>🟩</span><span>🟩</span><span>🟥</span>
                      <span>🟩</span><span>🟥</span><span>🟥</span>
                      <span>🟥</span><span>🟥</span><span>🟥</span>
                    </div>
                    <span>→</span>
                    <div className="grid grid-cols-3 gap-0.5">
                      <span>👆</span><span>⬜</span><span>⬜</span>
                      <span>⬜</span><span>⬜</span><span>⬜</span>
                      <span>⬜</span><span>⬜</span><span>⬜</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-center">Click top-left corner → all red!</p>
                </div>
                
                {/* One Click Win */}
                <div className="border rounded-lg p-3">
                  <p className="font-medium text-sm mb-2 text-center">One Click Win!</p>
                  <div className="flex items-center justify-center gap-3 text-xs">
                    <div className="grid grid-cols-3 gap-0.5">
                      <span>🟥</span><span>🟩</span><span>🟥</span>
                      <span>🟩</span><span>🟩</span><span>🟩</span>
                      <span>🟥</span><span>🟩</span><span>🟥</span>
                    </div>
                    <span>→</span>
                    <div className="grid grid-cols-3 gap-0.5">
                      <span>🟥</span><span>🟥</span><span>🟥</span>
                      <span>🟥</span><span>👆</span><span>🟥</span>
                      <span>🟥</span><span>🟥</span><span>🟥</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-center">Click center → all turn red!</p>
                </div>
                
                {/* Single Center Dot */}
                <div className="border rounded-lg p-3">
                  <p className="font-medium text-sm mb-2 text-center">Single Center = 5 clicks!</p>
                  <div className="flex items-center justify-center gap-3 text-xs">
                    <div className="grid grid-cols-3 gap-0.5">
                      <span>🟥</span><span>🟥</span><span>🟥</span>
                      <span>🟥</span><span>🟩</span><span>🟥</span>
                      <span>🟥</span><span>🟥</span><span>🟥</span>
                    </div>
                    <span>→</span>
                    <div className="grid grid-cols-3 gap-0.5">
                      <span>⬜</span><span>👆</span><span>⬜</span>
                      <span>👆</span><span>👆</span><span>👆</span>
                      <span>⬜</span><span>👆</span><span>⬜</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-center">Click all 5 tiles in the cross pattern!</p>
                </div>
              </div>
            </section>

            {/* Advanced Techniques */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Advanced Techniques</h3>
              
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium mb-1 text-sm">The Parity Principle</h4>
                  <p className="text-xs text-gray-600">For 2 colors: Count wrong tiles. Even = even clicks, odd = odd clicks</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium mb-1 text-sm">Tile Influence Zones</h4>
                  <p className="text-xs text-gray-600">Corner affects 3, edge affects 4, center affects 5 tiles</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium mb-1 text-sm">Color Frequency</h4>
                  <p className="text-xs text-gray-600">With 3+ colors: Target the most common color</p>
                </div>
              </div>
            </section>

            {/* Tips */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Quick Tips</h3>
              
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-sm">Start with high-impact moves (center/edges)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-sm">Save corners for precision fixes</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-sm">Adjacent clicks cancel shared tiles</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-sm">Plan 2-3 moves ahead</span>
                </div>
              </div>
            </section>

            {/* Scoring */}
            <section className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Scoring</h3>
              <div className="space-y-1 text-sm">
                <div>⭐⭐⭐ = Optimal moves</div>
                <div>⭐⭐ = Good</div>
                <div>⭐ = Complete</div>
                <div className="pt-2 text-xs text-gray-600">
                  Points: Base (1000) + Efficiency + Speed
                </div>
              </div>
            </section>

            {/* Got it button at the end of content */}
            <div className="pt-4 pb-4">
              <button
                onClick={onClose}
                className="btn-primary w-full"
              >
                Got it
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HowToPlayModal;