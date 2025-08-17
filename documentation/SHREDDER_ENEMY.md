# Ticket: "Shredder" tri-shuriken enemy (punishes asteroid spam)

## Summary

Add a special enemy **Shredder** (tri-shuriken outline). It’s **bigger than normal ships** (random up to **3×**), **spins** around its axis, and flies a **waveform path** (sine/cosine or gentle lissajous).
Asteroid interactions:

* **Asteroid smaller than Shredder** → asteroid is **instantly shredded** (laser-hit equivalent).
* **Asteroid equal or larger** → **Shredder explodes**; asteroid survives (optional partial impact damage).

---

## Correct spawn rule

Let `A = asteroidsOnScreen`.

**Piecewise as spec (“> 10” unlocks the boost):**

```
if A ≤ 10:  P = 0.05                // 5%
if A > 10:  P = 0.05 + (A/10)%      // == 0.05 + A/1000
```

**Examples (per spawn check):**

* A=0  → **5%**  (0.05)
* A=10 → **5%**  (0.05)
* A=20 → **7%**  (0.07) ✅
* A=50 → **10%** (0.10)
* A=100 → **15%** (0.15)

*(Optional)* clamp extreme cases: `P_max = 0.25` (25%).

**Cadence:** use the existing enemy spawn tick.
**Concurrency:** `maxConcurrentShredders = 2` (config).

---

## Behavior

* **Scale:** `s ∈ [1.25, 3.0] × normalShipTipRadius`.
* **Spin:** `ω_spin ∈ [0.6, 1.6] rad/s`, random sign.
* **Path (choose at spawn):**

  * `SINE`: `y = y0 + A·sin(ωt + φ)`
  * `COSINE`: `y = y0 + A·cos(ωt + φ)`
  * `LISSAJOUS-lite`: forward drift + mild 1:2 x/y wobble
* **Amplitude:** `A ∈ [0.15, 0.30] × screenHeight`.
* **SpeedX:** reuse normal enemy base speed (± \~20% jitter).
* **Collisions (use radii):** `rS = shredder.radius`, `rA = asteroid.radius`, tolerance `τ = 0.05`.

  * if `rA < rS·(1−τ)` → shred asteroid (instant kill, sparks FX, small score).
  * if `rA > rS·(1+τ)` → Shredder explodes (asteroid persists; optional impact damage).
  * else (≈equal) → both destroyed.

---

## Inline assets (no attachments)

### A) SVG (outline-only)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-122 -122 244 244" width="244" height="244">
  <!-- outer outline -->
  <polyline points="-39.0,67.5 0.0,110.0 39.0,67.5 39.0,-67.5 0.0,-110.0 -39.0,-67.5 -97.5,0.0 -90.4,15.6 -78.4,27.6 -67.5,39.0 -39.0,67.5"
            fill="none" stroke="#000" stroke-width="2" stroke-linejoin="miter" stroke-linecap="square"/>
  <!-- inner hub (triangle) -->
  <polyline points="0.0,18.0 15.6,-9.0 -15.6,-9.0 0.0,18.0"
            fill="none" stroke="#000" stroke-width="2" stroke-linejoin="miter" stroke-linecap="square"/>
</svg>
```

*Note:* This SVG’s coordinates are based on a tip radius of **110** units. The normalized points below divide by 110, so the **furthest tip = 1.0**.

### B) Normalized vector points (furthest tip = 1.0)

```js
// OUTER polyline (closed by repeating the first point at the end)
const OUTER = [
  [-0.3545,  0.6136], [ 0.0000,  1.0000], [ 0.3545,  0.6136],
  [ 0.3545, -0.6136], [ 0.0000, -1.0000], [-0.3545, -0.6136],
  [-0.8864,  0.0000], [-0.8218,  0.1418], [-0.7127,  0.2509],
  [-0.6136,  0.3545], [-0.3545,  0.6136]
];

// HUB triangle (closed by repeating the first point)
const HUB = [
  [ 0.0000,  0.1636], [ 0.1418, -0.0818],
  [-0.1418, -0.0818], [ 0.0000,  0.1636]
];
```

✔️ Checks: `67.5/110=0.6136`, `39/110=0.3545`, `97.5/110=0.8864`, `18/110=0.1636`, `15.6/110=0.1418`, `9/110=0.0818`.

---

## Pseudocode only (framework-agnostic)

> Replace identifiers/types with your engine’s. This is **dummy code** to express intent — **not** drop-in.

### Spawner (called on your existing spawn tick)

```
function maybeSpawnShredder(world):
    A = world.countOnscreen("asteroid")
    if A <= 10:
        P = 0.05                       // 5%
    else:
        P = 0.05 + (A / 1000)          // 5% + (A/10)%

    if CONFIG.clampEnabled:
        P = min(P, CONFIG.maxSpawnProb)    // e.g., 0.25

    if world.countOnscreen("Shredder") >= CONFIG.maxConcurrent:
        return

    if random() < P:
        side = randomChoice("left","right")
        world.spawn( Shredder(side) )
```

### Shredder entity (reuses base enemy lifecycle)

```
class Shredder extends EnemyBase:
    init(spawnSide):
        scale = rand(1.25, 3.0)
        tipRadius = NORMAL_SHIP_TIP_RADIUS * scale
        rotationSpeed = rand(0.6, 1.6) * randomSign()

        // choose motion
        motionType = randomChoice(SINE, COSINE, LISSAJOUS_LITE)
        amplitude = rand(0.15, 0.30) * SCREEN_H
        omega = rand(0.6, 1.2)
        phase = rand(0, 2π)
        forwardSpeedX = BASE_ENEMY_SPEED_X * rand(0.9, 1.2)
        setStartPositionBySide(spawnSide)

    update(dt):
        // forward drift + waveform
        t += dt
        if motionType == SINE:
            x = x0 + dir * forwardSpeedX * t
            y = y0 + amplitude * sin(omega * t + phase)
        else if motionType == COSINE:
            x = x0 + dir * forwardSpeedX * t
            y = y0 + amplitude * cos(omega * t + phase)
        else: // LISSAJOUS_LITE
            x = x0 + dir * forwardSpeedX * t + 0.30*SCREEN_W * sin(1*omega*t + phase)
            y = y0 + amplitude *        sin(2*omega*t + 0.5*phase)

        rotation += rotationSpeed * dt
        applyCommonEnemyLifetimeCulling()

    render(renderer):
        // Outline look; if your engine is sprite/mesh-based, draw equivalent
        renderer.drawTriShurikenOutline(position, tipRadius, rotation,
                                        strokeWidth = max(1.5, tipRadius * 0.03))

    onCollision(other):
        if other.type != "asteroid":
            return handleWithBaseEnemyRules(other)

        rS = tipRadius
        rA = other.radius
        τ  = 0.05   // 5% tolerance

        if rA < rS * (1 - τ):
            other.destroyAsLaserHit()
            fx("shred_sparks", other.pos)
            score.add(+10)
        else if rA > rS * (1 + τ):
            other.applyImpactDamage(frac = 0.35)   // optional
            self.explode()
            fx("metal_burst", self.pos)
        else:
            other.destroy()
            self.explode()
```

---

## Acceptance criteria

* **Math:** For `A=20`, per-check probability is **7%** (0.07). For `A=50`, **10%**. For `A=100`, **15%**.
* **Spawn system:** Uses existing spawn cadence; never exceeds `maxConcurrentShredders`.
* **Movement:** Clear sine/cosine/lissajous-lite motion; amplitude in **15–30%** of screen height.
* **Visuals:** Outline tri-shuriken scales **1.25×–3×**; crisp miter joins; continuous rotation.
* **Collisions:** Smaller asteroid shredded; larger asteroid destroys Shredder; near-equal → both destroyed.
* **DRY:** Reuse base enemy lifecycle (pooling, culling, explosion, scoring hooks).

---

## Test plan

1. **Probability table:** A={0,10,20,50,100} → P={0.05, 0.05, 0.07, 0.10, 0.15}.
2. **Monte-Carlo sanity:** simulate 10k spawn ticks at A=20 → observed spawn ≈ 7% ± noise.
3. **Motion & spin:** logs show amplitude within 0.15–0.30H; rotation speed within range and random sign.
4. **Collision branches:** verify small, large, near-equal outcomes and correct FX/score hooks.
5. **Concurrency:** never exceed `maxConcurrentShredders` even under A=200 (stress).

---
