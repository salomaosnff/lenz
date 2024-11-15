/**
 * @module lenz:extensions 
 */

import { ensureInitialized } from "./util.js";

/**
 * Obtém uma extensão pelo seu ID
 * @param id
 * @returns
 */
export function getExtension(id: string) {
  return ensureInitialized().extensions().getExtension(id);
}
