// Shell-side helpers only. MFE-side proxies (`./vue`, `./pinia`, `./vue-router`)
// must be imported by their own path so they run in the remote bundle context.
export * from './install';
