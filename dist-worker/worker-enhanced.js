var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/itty-router/index.mjs
var e = /* @__PURE__ */ __name(({ base: e2 = "", routes: t = [], ...o2 } = {}) => ({ __proto__: new Proxy({}, { get: (o3, s2, r, n) => "handle" == s2 ? r.fetch : (o4, ...a) => t.push([s2.toUpperCase?.(), RegExp(`^${(n = (e2 + o4).replace(/\/+(\/|$)/g, "$1")).replace(/(\/?\.?):(\w+)\+/g, "($1(?<$2>*))").replace(/(\/?\.?):(\w+)/g, "($1(?<$2>[^$1/]+?))").replace(/\./g, "\\.").replace(/(\/?)\*/g, "($1.*)?")}/*$`), a, n]) && r }), routes: t, ...o2, async fetch(e3, ...o3) {
  let s2, r, n = new URL(e3.url), a = e3.query = { __proto__: null };
  for (let [e4, t2] of n.searchParams)
    a[e4] = a[e4] ? [].concat(a[e4], t2) : t2;
  for (let [a2, c2, i2, l2] of t)
    if ((a2 == e3.method || "ALL" == a2) && (r = n.pathname.match(c2))) {
      e3.params = r.groups || {}, e3.route = l2;
      for (let t2 of i2)
        if (null != (s2 = await t2(e3.proxy ?? e3, ...o3)))
          return s2;
    }
} }), "e");
var o = /* @__PURE__ */ __name((e2 = "text/plain; charset=utf-8", t) => (o2, { headers: s2 = {}, ...r } = {}) => void 0 === o2 || "Response" === o2?.constructor.name ? o2 : new Response(t ? t(o2) : o2, { headers: { "content-type": e2, ...s2.entries ? Object.fromEntries(s2) : s2 }, ...r }), "o");
var s = o("application/json; charset=utf-8", JSON.stringify);
var c = o("text/plain; charset=utf-8", String);
var i = o("text/html");
var l = o("image/jpeg");
var p = o("image/png");
var d = o("image/webp");

// src/game-logic.js
var GAME_CONFIG = {
  COLOR_PALETTE: ["#FF4444", "#44DD44", "#4444FF", "#FFAA00", "#AA44FF", "#44DDDD"],
  COLOR_NAMES: ["Red", "Green", "Blue", "Orange", "Purple", "Cyan"],
  DIFFICULTIES: {
    easy: {
      size: 3,
      colors: 3,
      reverseSteps: 3,
      maxMoves: 0,
      maxLockedTiles: 0,
      powerTileChance: 0,
      timeLimit: 0,
      tutorialEnabled: true,
      description: "Perfect for learning! No limits, full tutorial."
    },
    medium: {
      size: 4,
      colors: 4,
      reverseSteps: 5,
      maxMoves: 25,
      maxLockedTiles: 1,
      powerTileChance: 0.1,
      timeLimit: 0,
      tutorialEnabled: false,
      description: "More complex puzzles with special tiles."
    },
    hard: {
      size: 5,
      colors: 4,
      reverseSteps: 7,
      maxMoves: 35,
      maxLockedTiles: 2,
      powerTileChance: 0.15,
      timeLimit: 600,
      tutorialEnabled: false,
      description: "Advanced puzzles with time challenge."
    },
    expert: {
      size: 6,
      colors: 5,
      reverseSteps: 10,
      maxMoves: 50,
      maxLockedTiles: 3,
      powerTileChance: 0.2,
      timeLimit: 480,
      tutorialEnabled: false,
      description: "For puzzle masters only!"
    },
    infinite: {
      size: 5,
      colors: 6,
      reverseSteps: 15,
      maxMoves: 0,
      maxLockedTiles: 4,
      powerTileChance: 0.25,
      timeLimit: 0,
      tutorialEnabled: false,
      description: "Endless challenge mode."
    }
  },
  WORLDS: {
    sandbox: { name: "Sandbox", belt: "white", unlockRequirement: null },
    world1: { name: "Beginner's Garden", belt: "yellow", unlockRequirement: { puzzles: 5, minStars: 1 } },
    world2: { name: "Power Plaza", belt: "orange", unlockRequirement: { puzzles: 3, minStars: 2 } },
    world3: { name: "Reflection Ridge", belt: "green", unlockRequirement: { goldStars: 1 } },
    world4: { name: "Time Temple", belt: "blue", unlockRequirement: { allSilver: true } },
    world5: { name: "Master's Domain", belt: "purple", unlockRequirement: { dailyStreak: 1 } }
  }
};
function deepClone(grid) {
  return grid.map((row) => [...row]);
}
__name(deepClone, "deepClone");
function getNextColor(current, totalColors) {
  return (current + 1) % totalColors;
}
__name(getNextColor, "getNextColor");
function isWinningState(grid) {
  if (!grid || !grid.length)
    return false;
  const firstColor = grid[0][0];
  return grid.every((row) => row.every((cell) => cell === firstColor));
}
__name(isWinningState, "isWinningState");
function calculateMoveEffect(row, col, size, isPowerTile) {
  const effect = Array(size).fill(null).map(() => Array(size).fill(0));
  if (isPowerTile) {
    for (let r = Math.max(0, row - 1); r <= Math.min(size - 1, row + 1); r++) {
      for (let c2 = Math.max(0, col - 1); c2 <= Math.min(size - 1, col + 1); c2++) {
        effect[r][c2] = 1;
      }
    }
  } else {
    effect[row][col] = 1;
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    directions.forEach(([dr, dc]) => {
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
        effect[newRow][newCol] = 1;
      }
    });
  }
  return effect;
}
__name(calculateMoveEffect, "calculateMoveEffect");
function applyMove(grid, row, col, powerTiles, lockedTiles, totalColors) {
  const newGrid = deepClone(grid);
  const size = grid.length;
  const tileKey = `${row}-${col}`;
  const isPowerTile = powerTiles.has(tileKey);
  const effect = calculateMoveEffect(row, col, size, isPowerTile);
  const changedTiles = [];
  for (let r = 0; r < size; r++) {
    for (let c2 = 0; c2 < size; c2++) {
      const key = `${r}-${c2}`;
      if (effect[r][c2] && !lockedTiles.has(key)) {
        const oldColor = newGrid[r][c2];
        newGrid[r][c2] = getNextColor(oldColor, totalColors);
        changedTiles.push({
          row: r,
          col: c2,
          oldColor,
          newColor: newGrid[r][c2]
        });
      }
    }
  }
  return {
    grid: newGrid,
    changedTiles,
    isPowerMove: isPowerTile
  };
}
__name(applyMove, "applyMove");
async function solvePuzzle(initialGrid, powerTiles, lockedTiles, totalColors) {
  const startTime = Date.now();
  const visited = /* @__PURE__ */ new Set();
  const queue = [{ state: initialGrid, path: [] }];
  const gridToString = /* @__PURE__ */ __name((g) => g.map((row) => row.join("")).join("|"), "gridToString");
  const MAX_STATES = 1e4;
  const MAX_DEPTH = 30;
  let statesExplored = 0;
  while (queue.length > 0 && statesExplored < MAX_STATES) {
    const { state, path } = queue.shift();
    const stateKey = gridToString(state);
    if (visited.has(stateKey))
      continue;
    visited.add(stateKey);
    statesExplored++;
    if (isWinningState(state)) {
      return {
        solution: path,
        solvable: true,
        statesExplored,
        timeMs: Date.now() - startTime
      };
    }
    if (path.length >= MAX_DEPTH)
      continue;
    const size = state.length;
    for (let r = 0; r < size; r++) {
      for (let c2 = 0; c2 < size; c2++) {
        const key = `${r}-${c2}`;
        if (!lockedTiles.has(key)) {
          const result = applyMove(state, r, c2, powerTiles, lockedTiles, totalColors);
          const newStateKey = gridToString(result.grid);
          if (!visited.has(newStateKey)) {
            queue.push({
              state: result.grid,
              path: [...path, { row: r, col: c2 }]
            });
          }
        }
      }
    }
  }
  return {
    solution: [],
    solvable: false,
    statesExplored,
    timeMs: Date.now() - startTime
  };
}
__name(solvePuzzle, "solvePuzzle");
async function generatePuzzle(difficulty = "easy") {
  const config = GAME_CONFIG.DIFFICULTIES[difficulty];
  const { size, reverseSteps, maxLockedTiles, powerTileChance, colors } = config;
  const solvedGrid = Array(size).fill(null).map(() => Array(size).fill(0));
  const powerTiles = /* @__PURE__ */ new Set();
  const lockedTiles = /* @__PURE__ */ new Map();
  if (powerTileChance > 0) {
    const numPowerTiles = Math.min(3, Math.floor(size * size * powerTileChance));
    while (powerTiles.size < numPowerTiles) {
      const r = Math.floor(Math.random() * size);
      const c2 = Math.floor(Math.random() * size);
      powerTiles.add(`${r}-${c2}`);
    }
  }
  while (lockedTiles.size < maxLockedTiles) {
    const r = Math.floor(Math.random() * size);
    const c2 = Math.floor(Math.random() * size);
    const key = `${r}-${c2}`;
    if (!powerTiles.has(key)) {
      lockedTiles.set(key, Math.floor(Math.random() * 3) + 2);
    }
  }
  let currentGrid = deepClone(solvedGrid);
  const reverseMoves = [];
  for (let i2 = 0; i2 < reverseSteps; i2++) {
    const validMoves = [];
    for (let r = 0; r < size; r++) {
      for (let c2 = 0; c2 < size; c2++) {
        if (!lockedTiles.has(`${r}-${c2}`)) {
          validMoves.push({ row: r, col: c2 });
        }
      }
    }
    const move = validMoves[Math.floor(Math.random() * validMoves.length)];
    const result = applyMove(currentGrid, move.row, move.col, powerTiles, /* @__PURE__ */ new Map(), colors);
    currentGrid = result.grid;
    reverseMoves.push(move);
  }
  const solution = await solvePuzzle(currentGrid, powerTiles, lockedTiles, colors);
  return {
    grid: currentGrid,
    solvedGrid,
    powerTiles: Array.from(powerTiles),
    lockedTiles: Object.fromEntries(lockedTiles),
    solution: solution.solution,
    reverseMoves,
    verified: solution.solvable,
    statesExplored: solution.statesExplored,
    difficulty,
    config
  };
}
__name(generatePuzzle, "generatePuzzle");

// src/worker-enhanced.js
import manifestJSON from "__STATIC_CONTENT_MANIFEST";
var router = e();
var manifest = JSON.parse(manifestJSON || "{}");
router.post("/api/generate", async (request) => {
  const { difficulty = "easy" } = await request.json();
  const puzzle = await generatePuzzle(difficulty);
  return new Response(JSON.stringify(puzzle), {
    headers: { "Content-Type": "application/json" }
  });
});
router.post("/api/solve", async (request) => {
  const { grid, power, locked, colors } = await request.json();
  const solution = await solvePuzzle(grid, power, locked, colors);
  return new Response(JSON.stringify(solution), {
    headers: { "Content-Type": "application/json" }
  });
});
router.post("/api/move", async (request) => {
  const { grid, row, col, power, locked, colors } = await request.json();
  const result = applyMove(grid, row, col, power, locked, colors);
  const won = isWinningState(result.grid);
  return new Response(JSON.stringify({ ...result, won }), {
    headers: { "Content-Type": "application/json" }
  });
});
router.get("/api/leaderboard/:difficulty", async (request, env) => {
  const { difficulty } = request.params;
  const leaderboard = await env.GAME_STATE.get(`leaderboard:${difficulty}`, { type: "json" });
  return new Response(JSON.stringify(leaderboard || []), {
    headers: { "Content-Type": "application/json" }
  });
});
router.post("/api/score", async (request, env) => {
  const { name, score, moves, time, difficulty } = await request.json();
  const key = `leaderboard:${difficulty}`;
  const leaderboard = await env.GAME_STATE.get(key, { type: "json" }) || [];
  leaderboard.push({
    name,
    score,
    moves,
    time,
    timestamp: Date.now()
  });
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard.splice(100);
  await env.GAME_STATE.put(key, JSON.stringify(leaderboard));
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
});
router.get("/*", async (request, env, ctx) => {
  const url = new URL(request.url);
  if (env.ENVIRONMENT === "development") {
    return fetch(`http://localhost:3000${url.pathname}`);
  }
  try {
    let asset = await env.__STATIC_CONTENT.get(url.pathname);
    if (!asset && !url.pathname.includes(".")) {
      asset = await env.__STATIC_CONTENT.get("index.html");
    }
    if (asset) {
      const headers = {
        "Content-Type": getMimeType(url.pathname),
        "Cache-Control": url.pathname === "/index.html" ? "public, max-age=0, must-revalidate" : "public, max-age=31536000, immutable"
      };
      return new Response(asset.body, { headers });
    }
  } catch (e2) {
    console.error("Error serving asset:", e2);
  }
  return new Response("Not found", { status: 404 });
});
function getMimeType(pathname) {
  const ext = pathname.split(".").pop()?.toLowerCase();
  const types = {
    "js": "application/javascript",
    "mjs": "application/javascript",
    "css": "text/css",
    "html": "text/html",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "svg": "image/svg+xml",
    "json": "application/json",
    "woff": "font/woff",
    "woff2": "font/woff2",
    "ttf": "font/ttf",
    "otf": "font/otf"
  };
  return types[ext] || "text/plain";
}
__name(getMimeType, "getMimeType");
var GameSession = class {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = /* @__PURE__ */ new Map();
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/websocket") {
      const upgradeHeader = request.headers.get("Upgrade");
      if (upgradeHeader !== "websocket") {
        return new Response("Expected Upgrade: websocket", { status: 426 });
      }
      const [client, server] = Object.values(new WebSocketPair());
      await this.handleSession(server, request);
      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }
    return new Response("Not found", { status: 404 });
  }
  async handleSession(websocket, request) {
    websocket.accept();
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, {
      websocket,
      playerId: null,
      roomId: null
    });
    websocket.addEventListener("message", async (msg) => {
      const data = JSON.parse(msg.data);
      const session = this.sessions.get(sessionId);
      switch (data.type) {
        case "join":
          session.playerId = data.playerId;
          session.roomId = data.roomId;
          this.broadcastToRoom(data.roomId, {
            type: "player-joined",
            playerId: data.playerId
          }, sessionId);
          break;
        case "move":
          this.broadcastToRoom(session.roomId, {
            type: "move",
            playerId: session.playerId,
            row: data.row,
            col: data.col
          }, sessionId);
          break;
      }
    });
    websocket.addEventListener("close", () => {
      const session = this.sessions.get(sessionId);
      if (session?.roomId) {
        this.broadcastToRoom(session.roomId, {
          type: "player-left",
          playerId: session.playerId
        }, sessionId);
      }
      this.sessions.delete(sessionId);
    });
  }
  broadcastToRoom(roomId, data, excludeSessionId) {
    for (const [id, session] of this.sessions) {
      if (session.roomId === roomId && id !== excludeSessionId) {
        if (session.websocket.readyState === WebSocket.OPEN) {
          session.websocket.send(JSON.stringify(data));
        }
      }
    }
  }
};
__name(GameSession, "GameSession");
var worker_enhanced_default = {
  fetch: router.handle
};
export {
  GameSession,
  worker_enhanced_default as default
};
//# sourceMappingURL=worker-enhanced.js.map
