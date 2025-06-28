Below is a point‑by‑point technical review of the **Spatial Edge‑Fixed Resize Implementation Plan**.
Everything that is quoted or paraphrased from your document is cited with  .

---

## 1. General coordinate‑system assumptions

* The rotation matrix you give

  $$
  R=\begin{bmatrix}\cos\theta&-\sin\theta\\ \sin\theta&\cos\theta\end{bmatrix}
  $$

  is the standard *mathematical* counter‑clockwise (CCW) matrix.
  Because most UI frameworks place **+y downward**, this very same matrix actually produces a **clockwise** visual rotation (positive θ) on screen, so the code and the prose statement “45° clockwise” are consistent.
* Make this convention explicit in comments; otherwise future readers may think the sign is reversed.

---

## 2. Step‑1 corner computation – correct

The corner‑rotation formula

````typescript
rotated = R * (P – centre) + centre
``` :contentReference[oaicite:1]{index=1}  

is mathematically sound.

---

## 3. Named edge list – purely cosmetic confusion

The section headed **“Visual ‘top‑right’ edge”** actually lists the four perimeter edges (top, right, bottom, left).  
The “top‑right edge” label is misleading. Rename them simply **topEdge, rightEdge, …** to avoid ambiguity. :contentReference[oaicite:2]{index=2}

---

## 4. `getResizeEdgeMapping` – incomplete for arbitrary angles

```typescript
const quadrant = Math.floor(normalizedRotation / 90);
``` :contentReference[oaicite:3]{index=3}

* The mapping only changes every 90°, so at 45°, 135°, … the handle → edge assignment is already wrong.  
* For intuitive behaviour you must consider which edge’s outward normal is closest to the mouse‑drag direction.  
  Two common fixes:
  1. Compare the rotation against **45° offsets** and map into eight 45° wide octants.
  2. Compute the angle of each edge normal and pick the nearest.

---

## 5. Step‑4 local mouse‑delta transform – correct

Inverse‑rotating the mouse delta with `‑frameRotation` is the right operation for transforming **global** motion into **frame‑local** coordinates. :contentReference[oaicite:4]{index=4}

---

## 6. `calculateNewFrameDimensions` – sign logic OK but origin not updated

The width/height formulas are correct, but note that **x / y of the bounding box are *not* updated here**.  
That is deferred to the centre‑recalculation step; just document this clearly to stop future regressions.

---

## 7. Critical bug in `calculateNewFrameCenter`

```typescript
const oppositeEdge = {...}[resizeEdge];
const localDistance = localDistances[oppositeEdge];
...
return {
  x: fixedEdgeCenter.x + globalDistance.x,
  y: fixedEdgeCenter.y + globalDistance.y
};
``` :contentReference[oaicite:5]{index=5}

* `localDistance` is the **vector from *centre* to the chosen edge**.  
  To go from the *fixed‑edge* centre **to** the new frame centre you need the **opposite direction**.
* Using `oppositeEdge` therefore supplies a vector that points **back toward the fixed edge**, so adding it moves the frame centre *past* the fixed edge instead of away from it.  
  Example (dragging the **right** edge, fixed edge = left): the function places the centre further **left** of the fixed edge.

### **Fix**

Either of these is correct:

```typescript
// Option A – keep oppositeEdge but subtract
const globalDistance = ...       // same as now
return {
  x: fixedEdgeCenter.x - globalDistance.x,
  y: fixedEdgeCenter.y - globalDistance.y
};
````

```typescript
// Option B – use resizeEdge directly
const localDistance = localDistances[resizeEdge]; // vector edge→centre
// then add as you already do
```

After this change a quick numerical test confirms that the centre sits exactly
½ newWidth or ½ newHeight away from the fixed edge along its normal.

---

## 8. Axis‑aligned bounding box recomputation – correct but check inputs

The maths in `calculateAxisAlignedBoundingBox` is fine, **provided** that

* `frameWidth` and `frameHeight` are the **unrotated (local) dimensions**.
  If the object you pass in is already an *axis‑aligned* box of a rotated frame, its width/height are larger than the local ones and the result will be wrong. Ensure you store the *intrinsic* size separately or reverse‑engineer it before calling this step.

---

## 9. Edge‑case helpers may break the invariant

`enforceMinimumSize` and `validateImageBoundaries` modify width / height / x / y **after** the fixed‑edge calculation.
Whenever you clamp or move the box:

1. Re‑evaluate the frame centre with the same fixed‑edge rule, or
2. Clamp *in local space first*, then recompute the centre and the final axis‑aligned box.

Otherwise the supposedly “fixed” spatial edge will drift.

---

## 10. Missing helper definition

`calculateRotatedCorners` is used in the main algorithm but not defined in the document. Add it (or rename to `rotateCorners`) so that the plan is self‑contained.&#x20;

---

## 11. Negative sizes

If the user drags past the fixed edge the raw formulas allow width or height ≤ 0, which will flip the object and break the rotation logic.
Add a guard **before** the centre calculation to:

```typescript
newWidth  = Math.max(minWidth , newWidth );
newHeight = Math.max(minHeight, newHeight);
```

so that the orientation never inverts.

---

## 12. Summary of required corrections

| Area                           | Status | Required change                          |
| ------------------------------ | ------ | ---------------------------------------- |
| Rotation‑matrix sign           | ✅      | Add explicit comment                     |
| Edge‑name labels               | ⚠️     | Rename for clarity                       |
| `getResizeEdgeMapping`         | ❌      | Use 45° bins or normal‑angle test        |
| `calculateNewFrameCenter`      | **❌**  | Flip vector sign or use `resizeEdge`     |
| Axis‑aligned box inputs        | ⚠️     | Guarantee local size, not screen box     |
| Minimum‑size / boundary clamps | ⚠️     | Re‑apply fixed‑edge logic after clamping |
| Negative size drag             | ⚠️     | Clamp before centre calc                 |
| Missing helper                 | ⚠️     | Define `calculateRotatedCorners`         |

Applying the fixes above will make the mathematical foundation internally consistent and ensure the *fixed‑edge invariant* holds for all rotations and drags.

Feel free to ask for clarifications or for a concrete test harness once you implement these changes.
