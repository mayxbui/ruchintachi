// Features still being built, switched on per server with an environment
// variable so the deployed site can leave them out. Server only: read during
// a request, so the VM's /etc/ruchintachi.env decides at runtime.

/** Friends & Town (M8). Off unless FEATURE_TOWN=true. */
export function townEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.FEATURE_TOWN === "true";
}
