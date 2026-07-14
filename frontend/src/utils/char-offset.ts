/**
 * char-offset.ts
 *
 * Utilities for converting DOM Selection ranges to character offsets
 * within a paragraph container, and vice versa for rendering highlights.
 *
 * Strategy: Walk text nodes inside the container, accumulate character count.
 * Non-text nodes (React entity spans, etc.) are skipped but their text
 * children are included so offsets always map to the original paragraph.content string.
 */

/**
 * Walk all text nodes inside `root` in document order,
 * calling `visitor(node, accumulatedOffset)` until visitor returns false.
 */
function walkTextNodes(
  root: Node,
  visitor: (node: Text, offset: number) => boolean,
): number {
  let total = 0;
  const stack: Node[] = [root];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node as Text;
      const shouldContinue = visitor(text, total);
      total += text.length;
      if (!shouldContinue) return total;
    } else {
      // Push children in reverse order so left-most child is processed first
      const children = Array.from(node.childNodes).reverse();
      stack.push(...children);
    }
  }
  return total;
}

/**
 * Convert a DOM Range to { startOffset, endOffset } relative to
 * the text content of `container`.
 * Returns null if the range is not fully inside the container.
 */
export function getCharOffset(
  container: HTMLElement,
  range: Range,
): { startOffset: number; endOffset: number } | null {
  if (!container.contains(range.commonAncestorContainer)) return null;

  let startCharOffset = -1;
  let endCharOffset = -1;

  walkTextNodes(container, (node, offset) => {
    // Determine start
    if (startCharOffset === -1 && range.startContainer === node) {
      startCharOffset = offset + range.startOffset;
    }
    // Determine end
    if (endCharOffset === -1 && range.endContainer === node) {
      endCharOffset = offset + range.endOffset;
      return false; // stop walking
    }
    return true; // continue
  });

  if (startCharOffset === -1 || endCharOffset === -1) return null;
  return { startOffset: startCharOffset, endOffset: endCharOffset };
}

/**
 * Given a container element and character offsets, return an array of DOMRects
 * representing the visual position of the text range.
 * This is used to render an overlay highlight that mirrors the selection.
 */
export function getHighlightRects(
  container: HTMLElement,
  startOffset: number,
  endOffset: number,
): DOMRect[] {
  // Build a Range from character offsets using text node walk
  let startNode: Text | null = null;
  let startNodeOffset = 0;
  let endNode: Text | null = null;
  let endNodeOffset = 0;

  let foundStart = false;
  let foundEnd = false;

  walkTextNodes(container, (node, charOffset) => {
    if (!foundStart) {
      if (charOffset + node.length >= startOffset) {
        startNode = node;
        startNodeOffset = startOffset - charOffset;
        foundStart = true;
      }
    }
    if (foundStart && !foundEnd) {
      if (charOffset + node.length >= endOffset) {
        endNode = node;
        endNodeOffset = endOffset - charOffset;
        foundEnd = true;
        return false;
      }
    }
    return true;
  });

  if (!startNode || !endNode) return [];

  try {
    const range = document.createRange();
    range.setStart(startNode, startNodeOffset);
    range.setEnd(endNode, endNodeOffset);
    const rects = Array.from(range.getClientRects());
    // Filter out zero-width rects
    return rects.filter((r) => r.width > 0 && r.height > 0);
  } catch {
    return [];
  }
}
