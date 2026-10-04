// Tutorial JSON from the repo's tutorials/ folder, checked by the schema
// when loaded, so it is typed as unknown here.
declare module '@tutorials/*.json' {
  const json: unknown;
  export default json;
}
