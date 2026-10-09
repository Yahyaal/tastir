// Resolved only in Vitest. Production's virtual module exports an empty object.
export default import.meta.glob<unknown>('../../../../tutorials/*.json', {
  eager: true,
  import: 'default',
});
