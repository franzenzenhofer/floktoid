/**
 * Functional asteroid generator using vector-based non-intersecting polygons
 * Based on radial function approach to guarantee star-shaped simple polygons
 */

export interface AsteroidShape {
  vertices: number[];
  roughness: number[];
}

// Seeded random number generator for reproducible asteroids
const createRNG = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s & 0xffffffff) / 2 ** 32;
  };
};

// Removed choice function - using direct calculation instead

// Create a smooth radial function using sum of sines with random phases
const makeRadialFunction = (rng: () => number, baseRadius: number) => {
  const harmonics = [3, 5, 7]; // Harmonic counts for pleasant lumps/craters
  const phases = harmonics.map(() => rng() * Math.PI * 2);
  const amplitudes = [0.28, 0.12, 0.06].map(a => a * (0.75 + rng() * 0.5));
  
  return (theta: number): number => {
    const wobble = harmonics.reduce(
      (sum, harmonic, i) => sum + amplitudes[i] * Math.sin(harmonic * theta + phases[i]),
      0
    );
    const radius = baseRadius * (1 + wobble);
    return Math.max(baseRadius * 0.5, radius); // Clamp to prevent too small
  };
};

// Generate strictly increasing angles with slight jitter
const generateAngles = (n: number, rng: () => number): number[] => {
  const angles: number[] = [];
  const TAU = Math.PI * 2;
  
  for (let i = 0; i < n; i++) {
    const baseAngle = (i / n) * TAU;
    const jitter = (rng() - 0.5) * (TAU / n) * 0.15; // ±15% sector jitter
    angles.push(baseAngle + jitter);
  }
  
  // Ensure strictly increasing order
  return angles.sort((a, b) => a - b);
};

// Convert polar coordinates to cartesian vertices
const polarToVertices = (
  angles: number[],
  radialFn: (theta: number) => number,
  cx = 0,
  cy = 0
): number[] => {
  const vertices: number[] = [];
  
  angles.forEach(theta => {
    const r = radialFn(theta);
    vertices.push(cx + r * Math.cos(theta));
    vertices.push(cy + r * Math.sin(theta));
  });
  
  return vertices;
};

// Calculate roughness values for each edge (for visual texture)
const calculateRoughness = (vertices: number[], rng: () => number): number[] => {
  const roughness: number[] = [];
  const numEdges = vertices.length / 2;
  
  for (let i = 0; i < numEdges; i++) {
    // Add some randomness to edge roughness for texture
    roughness.push(0.8 + rng() * 0.4); // Between 0.8 and 1.2
  }
  
  return roughness;
};

/**
 * Generate a unique asteroid shape that never self-intersects
 * @param seed - Random seed for reproducible generation
 * @param size - Base size of the asteroid
 * @returns AsteroidShape with vertices and roughness values
 */
export function generateAsteroid(seed?: number, size = 30): AsteroidShape {
  // Use provided seed or generate from current time
  const actualSeed = seed ?? (Date.now() & 0xffffffff);
  const rng = createRNG(actualSeed);
  
  // FIXED: Choose number of edges (3-13 lines for variety)
  // Use better distribution - prefer middle values (6-9) but allow all 3-13
  const distribution = [
    3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 
    8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 11, 11, 12, 12, 13
  ];
  const index = Math.floor(rng() * distribution.length);
  const numEdges = distribution[index] || 7; // Default to 7 if something goes wrong
  
  // Extra safety check
  if (!numEdges || numEdges < 3 || numEdges > 13) {
    console.error('[ASTEROID] Invalid edge count from distribution:', numEdges, 'index:', index);
    return generateAsteroid(Date.now(), size); // Retry with new seed
  }
  
  // CRITICAL: Ensure we have at least 3 edges
  if (numEdges < 3 || numEdges > 13) {
    console.error('[ASTEROID] Edge count out of range:', numEdges);
    throw new Error(`Asteroid must have 3-13 edges, got ${numEdges}!`);
  }
  
  // Generate strictly increasing angles
  const angles = generateAngles(numEdges, rng);
  
  // VALIDATION: Check we have enough angles
  if (angles.length < 3) {
    console.error('[ASTEROID] Not enough angles generated:', angles.length);
    throw new Error('Failed to generate enough angles for asteroid!');
  }
  
  // Create radial function with some size variation
  const baseRadius = size * (0.8 + rng() * 0.4);
  const radialFn = makeRadialFunction(rng, baseRadius);
  
  // Convert to vertices (star-shaped polygon, guaranteed no intersections)
  const vertices = polarToVertices(angles, radialFn);
  
  // VALIDATION: Check we have enough vertices
  if (vertices.length < 6) { // At least 3 points = 6 coordinates
    console.error('[ASTEROID] Not enough vertices:', vertices.length);
    throw new Error('Failed to generate enough vertices for asteroid!');
  }
  
  // Calculate roughness for visual texture
  const roughness = calculateRoughness(vertices, rng);
  
  return { vertices, roughness };
}

/**
 * Generate multiple unique asteroids
 * @param count - Number of asteroids to generate
 * @param baseSeed - Base seed for the batch
 * @param size - Base size for all asteroids
 * @returns Array of AsteroidShape objects
 */
export function generateAsteroidBatch(
  count: number,
  baseSeed?: number,
  size = 30
): AsteroidShape[] {
  const seed = baseSeed ?? Date.now();
  const asteroids: AsteroidShape[] = [];
  
  for (let i = 0; i < count; i++) {
    // Use golden ratio to ensure good distribution of seeds
    const asteroidSeed = seed ^ (0x9e3779b9 * (i + 1));
    asteroids.push(generateAsteroid(asteroidSeed, size));
  }
  
  return asteroids;
}

/**
 * Mutate an existing asteroid shape slightly (for variations)
 * @param shape - Original asteroid shape
 * @param mutationSeed - Seed for the mutation
 * @returns New mutated AsteroidShape
 */
export function mutateAsteroid(shape: AsteroidShape, mutationSeed?: number): AsteroidShape {
  const seed = mutationSeed ?? Date.now();
  
  // Calculate average radius from original shape
  const numVertices = shape.vertices.length / 2;
  let totalRadius = 0;
  
  for (let i = 0; i < numVertices; i++) {
    const x = shape.vertices[i * 2];
    const y = shape.vertices[i * 2 + 1];
    totalRadius += Math.sqrt(x * x + y * y);
  }
  
  const avgRadius = totalRadius / numVertices;
  
  // Generate new shape with slight variation
  return generateAsteroid(seed ^ 0x9e3779b9, avgRadius);
}