/**
 * Stand-ins for the two Node built-ins that sync-engine's shared code imports.
 * The browser client never calls them; they only let Vite resolve the imports
 * and then drop the server-side code. Calling one is a bug, so each throws.
 */
function serverOnly(name: string): never {
  throw new Error(`${name} is server-only and is not available in the browser.`);
}

export const createHash = (): never => serverOnly("node:crypto createHash");
export const randomUUID = (): string => crypto.randomUUID();
export const inspect = (value: unknown): string => String(value);
export default { createHash, randomUUID, inspect };
