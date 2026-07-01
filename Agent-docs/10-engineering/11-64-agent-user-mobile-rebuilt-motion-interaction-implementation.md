# 11-64 Agent User Mobile Rebuilt Motion Interaction Implementation

Version: v1.8.32

## Implementation summary

This version rebuilds the mobile Home Agent card interaction around a Motion-owned deck layer while keeping `AgentFlipCard` frozen.

## Key implementation points

### 1. Circular offset

The previous mobile implementation only used nearby slots and had accumulated several CSS overrides. The new implementation calculates a circular distance for every card:

```ts
function getCircularDistance(index: number, activeIndex: number, total: number) {
  let distance = index - activeIndex;
  const half = total / 2;

  if (distance > half) distance -= total;
  if (distance < -half) distance += total;

  return distance;
}
```

This keeps the carousel loop stable and avoids remounting or slot jumps.

### 2. Motion fan layout

`getMotionFanLayout()` converts the circular offset into a full transform state:

```ts
x
 y
 rotate
 scale
 opacity
 filter
 zIndex
```

The side-card positions use a circular arc calculation:

```ts
const angle = distance * 16 * (Math.PI / 180);
const radius = metrics.cardWidth * 2.12;
const x = Math.sin(angle) * radius;
const y = (1 - Math.cos(angle)) * radius + absDistance * 10;
```

This creates a natural poker-hand / fan spread without relying on stacked CSS patch rules.

### 3. Frozen card component

`AgentFlipCard` is not modified.

On mobile, each card is rendered inside a Motion slot:

```tsx
<motion.div className="agent-motion-card-slot">
  <AgentFlipCard mode="standalone" />
</motion.div>
```

The card itself still owns flip, media, start, sound, and local upload behavior.

### 4. Interaction separation

- Active slot: receives pointer events for inner card controls.
- Side slots: receive click selection at the wrapper level only.
- Far slots: no pointer events.

This avoids side-card controls stealing gestures from the carousel.

### 5. Container height

Mobile deck height is 124% of card height:

```css
.agent-carousel--mobile-motion-rebuild {
  --mobile-card-height: calc(var(--card-width) * 1.333333);
  --mobile-deck-height: calc(var(--mobile-card-height) * 1.24);
  height: var(--mobile-deck-height);
}
```

This is intentionally above the requested minimum of 120%.

## Validation notes

The package intentionally omits:

```text
node_modules
package-lock.json
dist
```

This avoids leaking internal npm registry URLs and keeps the package clean for local installation.
