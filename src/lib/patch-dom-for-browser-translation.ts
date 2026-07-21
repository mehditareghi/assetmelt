/**
 * Browser translation (and some extensions) wrap or move React-owned text nodes
 * (often into nested <font> elements). React then throws NotFoundError on
 * removeChild/insertBefore because the node is no longer a direct child.
 *
 * Soften those DOM ops so React can continue unmounting/updating instead of
 * crashing. Translation stays enabled.
 *
 * @see https://github.com/facebook/react/issues/11538
 * @see ASSETMELT-WEB-5
 */
export function patchDomForBrowserTranslation(): void {
  if (typeof Node === 'undefined' || !Node.prototype) return

  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      return child
    }
    return originalRemoveChild.call(this, child) as T
  }

  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function <T extends Node>(
    newNode: T,
    referenceNode: Node | null,
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T
  }
}
