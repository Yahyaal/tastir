/** Conservative spatial filtering; callers still perform the exact geometry tests. */
export interface Box {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}
interface Node extends Box {
  readonly start: number;
  readonly end: number;
  readonly left?: Node;
  readonly right?: Node;
}

/** Partition in linear expected time; sorting every level costs O(n log² n). */
function partition(
  items: Uint32Array,
  centres: Float64Array,
  start: number,
  end: number,
  middle: number,
) {
  let lo = start,
    hi = end - 1;
  while (lo < hi) {
    const pivot = centres[items[(lo + hi) >>> 1] as number] as number;
    let i = lo,
      j = hi;
    while (i <= j) {
      while (i <= hi && (centres[items[i] as number] as number) < pivot) i++;
      while (j >= lo && (centres[items[j] as number] as number) > pivot) j--;
      if (i <= j) {
        const item = items[i] as number;
        items[i++] = items[j] as number;
        items[j--] = item;
      }
    }
    if (middle <= j) hi = j;
    else if (middle >= i) lo = i;
    else break;
  }
}

function build(
  items: Uint32Array,
  boxes: readonly Box[],
  xs: Float64Array,
  ys: Float64Array,
  start: number,
  end: number,
  depth = 0,
): Node {
  if (end - start <= 8) {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (let i = start; i < end; i++) {
      const box = boxes[items[i] as number] as Box;
      minX = Math.min(minX, box.minX);
      maxX = Math.max(maxX, box.maxX);
      minY = Math.min(minY, box.minY);
      maxY = Math.max(maxY, box.maxY);
    }
    return { minX, maxX, minY, maxY, start, end };
  }
  const middle = (start + end) >>> 1;
  partition(items, depth % 2 ? ys : xs, start, end, middle);
  const left = build(items, boxes, xs, ys, start, middle, depth + 1);
  const right = build(items, boxes, xs, ys, middle, end, depth + 1);
  return {
    minX: Math.min(left.minX, right.minX),
    maxX: Math.max(left.maxX, right.maxX),
    minY: Math.min(left.minY, right.minY),
    maxY: Math.max(left.maxY, right.maxY),
    start,
    end,
    left,
    right,
  };
}

export class BoxIndex {
  private readonly root: Node;
  private readonly items: Uint32Array;
  constructor(private readonly boxes: readonly Box[]) {
    this.items = new Uint32Array(boxes.length);
    const xs = new Float64Array(boxes.length);
    const ys = new Float64Array(boxes.length);
    let count = 0;
    for (let id = 0; id < boxes.length; id++) {
      const box = boxes[id] as Box;
      if (!(box.minX <= box.maxX && box.minY <= box.maxY)) continue;
      this.items[count++] = id;
      xs[id] = box.minX + box.maxX;
      ys[id] = box.minY + box.maxY;
    }
    this.root = build(this.items, boxes, xs, ys, 0, count);
  }
  /** Each box is returned at most once. `after` supports unordered pair enumeration. */
  query(box: Box, pad: number, after = -1): number[] {
    const found: number[] = [];
    const stack = [this.root];
    const minX = box.minX - pad,
      maxX = box.maxX + pad;
    const minY = box.minY - pad,
      maxY = box.maxY + pad;
    while (stack.length) {
      const n = stack.pop() as Node;
      if (n.minX > maxX || n.maxX < minX || n.minY > maxY || n.maxY < minY)
        continue;
      if (!n.left) {
        for (let i = n.start; i < n.end; i++) {
          const id = this.items[i] as number;
          const b = this.boxes[id] as Box;
          if (
            id > after &&
            b.minX <= maxX &&
            b.maxX >= minX &&
            b.minY <= maxY &&
            b.maxY >= minY
          )
            found.push(id);
        }
      } else stack.push(n.left, n.right as Node);
    }
    return found;
  }
}
