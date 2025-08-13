# Color Me Same API Documentation

> **Note**: The current implementation of Color Me Same is a client-side React application. The API endpoints documented below represent the planned backend API for future features like multiplayer, leaderboards, and cloud saves.

## Current Architecture

The game currently runs entirely in the browser with:
- Client-side puzzle generation
- Local state management
- No backend API required

## Planned API Endpoints (Future)

When implemented, the API will support:

### Base URLs

- **Production**: `https://api.color-me-same.franzai.com`
- **Staging**: `https://api-staging.color-me-same.franzai.com`
- **Local**: `http://localhost:8787`

### Endpoints

### Generate Puzzle

Creates a new puzzle with the specified difficulty.

**POST** `/api/generate`

#### Request Body

```json
{
  "difficulty": "easy" // "easy" | "medium" | "hard" | "expert" | "infinite"
}
```

#### Response

```json
{
  "grid": [[0, 1, 0], [1, 0, 1], [0, 1, 0]],
  "solvedGrid": [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
  "powerTiles": ["1-1"],
  "lockedTiles": { "0-2": 3 },
  "solution": [
    { "row": 1, "col": 1 },
    { "row": 0, "col": 0 }
  ],
  "reverseMoves": [
    { "row": 2, "col": 2 },
    { "row": 1, "col": 0 }
  ],
  "verified": true,
  "statesExplored": 245,
  "difficulty": "easy",
  "config": {
    "size": 3,
    "colors": 3,
    "reverseSteps": 3,
    "maxMoves": 0,
    "maxLockedTiles": 0,
    "powerTileChance": 0,
    "timeLimit": 0,
    "tutorialEnabled": true,
    "description": "Perfect for learning! No limits, full tutorial."
  }
}
```

### Apply Move

Applies a move to the current grid state and returns the updated grid.

**POST** `/api/move`

#### Request Body

```json
{
  "grid": [[0, 1, 0], [1, 0, 1], [0, 1, 0]],
  "row": 1,
  "col": 1,
  "power": ["1-1"],
  "locked": { "0-2": 3 },
  "colors": 3
}
```

#### Response

```json
{
  "grid": [[0, 2, 0], [2, 1, 2], [0, 2, 0]],
  "changedTiles": [
    { "row": 1, "col": 1, "oldColor": 0, "newColor": 1 },
    { "row": 0, "col": 1, "oldColor": 1, "newColor": 2 }
  ],
  "isPowerMove": false,
  "won": false
}
```

### Solve Puzzle

Finds the optimal solution for a given puzzle state using BFS algorithm.

**POST** `/api/solve`

#### Request Body

```json
{
  "grid": [[0, 1, 0], [1, 0, 1], [0, 1, 0]],
  "power": ["1-1"],
  "locked": { "0-2": 3 },
  "colors": 3
}
```

#### Response

```json
{
  "solution": [
    { "row": 1, "col": 1 },
    { "row": 0, "col": 0 },
    { "row": 2, "col": 2 }
  ],
  "solvable": true,
  "statesExplored": 156,
  "timeMs": 45
}
```

### Get Leaderboard

Retrieves the top scores for a specific difficulty level.

**GET** `/api/leaderboard/:difficulty`

#### Parameters

- `difficulty`: One of `easy`, `medium`, `hard`, `expert`, `infinite`

#### Response

```json
[
  {
    "name": "Player1",
    "score": 3450,
    "moves": 12,
    "time": 45,
    "timestamp": 1704067200000
  },
  {
    "name": "Player2",
    "score": 3200,
    "moves": 15,
    "time": 62,
    "timestamp": 1704067100000
  }
]
```

### Submit Score

Submits a score to the leaderboard.

**POST** `/api/score`

#### Request Body

```json
{
  "name": "Player1",
  "score": 3450,
  "moves": 12,
  "time": 45,
  "difficulty": "medium"
}
```

#### Response

```json
{
  "success": true
}
```

## WebSocket API (Multiplayer)

### Connect to Game Session

**WebSocket** `/websocket`

#### Connection

```javascript
const ws = new WebSocket('wss://color-me-same.franzai.com/websocket');
```

#### Message Types

##### Move Broadcast

```json
{
  "type": "move",
  "data": {
    "playerId": "player-123",
    "row": 1,
    "col": 1,
    "timestamp": 1704067200000
  }
}
```

##### Game State Sync

```json
{
  "type": "state",
  "data": {
    "grid": [[0, 1, 0], [1, 0, 1], [0, 1, 0]],
    "moves": 5,
    "players": ["player-123", "player-456"]
  }
}
```

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK`: Success
- `400 Bad Request`: Invalid input
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error Response Format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Rate Limiting

- **API Calls**: 100 requests per minute per IP
- **WebSocket Connections**: 10 concurrent connections per IP
- **KV Operations**: Subject to Cloudflare Workers limits

## CORS

The API supports CORS for the following origins:

- `https://color-me-same.franzai.com`
- `http://localhost:*` (development)

For other origins, please contact support.