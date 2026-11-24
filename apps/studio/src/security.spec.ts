import type { Request } from 'express';
import { strToU8, zipSync } from 'fflate';
import { join } from 'node:path';
import type { LookupAddress } from 'node:dns';
import { isPublicAddress, isSafeMetadataUrl, publicLookup } from './auth.js';
import { Owner } from './owner.js';
import { isReference, overlaySvg, type Reference } from './reference.js';
import { safeNext, sameSecret } from './safe.js';
import { Studio, ZIP_LIMITS } from './studio.js';
import { testBackend, type TestBackend } from './testing.js';

const tutorials = join(import.meta.dirname, '../../../tutorials');

/** Runs a lookup made by publicLookup and returns what it answered. */
const resolveWith = (
  addresses: { address: string; family: number }[],
  all = false,
) =>
  new Promise<{ error: Error | null; address: unknown }>((done) =>
    publicLookup(async () => addresses)(
      'app.example',
      { all },
      (error, address) => done({ error, address }),
    ),
  );

describe('the hosted studio refuses what the 23 November audit found', () => {
  it('checks the address a metadata name resolves to, at connect time', async () => {
    expect(isPublicAddress('93.184.216.34')).toBe(true);
    for (const inside of [
      '10.0.0.5',
      '127.0.0.1',
      '169.254.169.254',
      '::1',
      'fd00::1',
    ])
      expect(isPublicAddress(inside), inside).toBe(false);
    // The name looks public, so the URL check alone lets it through ...
    expect(isSafeMetadataUrl('https://rebind.example/client.json')).toBe(true);
    // ... and the lookup the socket uses refuses its private address.
    const refused = await resolveWith([
      { address: '169.254.169.254', family: 4 },
    ]);
    expect(refused.error?.message).toMatch(/not a public address/);
    const mixed = await resolveWith(
      [
        { address: '93.184.216.34', family: 4 },
        { address: '10.0.0.1', family: 4 },
      ],
      true,
    );
    expect(mixed.error).not.toBeNull();
    const fine = await resolveWith(
      [{ address: '93.184.216.34', family: 4 }],
      true,
    );
    expect(fine.error).toBeNull();
    expect((fine.address as LookupAddress[])[0]!.address).toBe('93.184.216.34');
  });

  it('sends a sign-in back only to a path on this site', () => {
    expect(safeNext('/projects/one?x=1')).toBe('/projects/one?x=1');
    for (const away of [
      '/\\evil.com',
      '//evil.com',
      '/a\r\nSet-Cookie: x',
      '/\tx',
      'https://evil.com',
      5,
    ])
      expect(safeNext(away), String(away)).toBe('/connections');
  });

  it('reads a malformed cookie without failing the request', async () => {
    const owner = new Owner({
      google: { clientId: 'id', clientSecret: 'secret' },
      allow: ['owner@example.com'],
      secret: 'a-session-secret-of-at-least-32-characters',
      baseUrl: new URL('https://studio.example'),
    });
    const request = {
      headers: { cookie: 'tastir_session=%E0%A4%A' },
    } as Request;
    expect(await owner.who(request)).toBeUndefined();
    expect(typeof owner.csrf(request)).toBe('string');
  });

  it('compares form tokens as secrets', () => {
    expect(sameSecret('abc', 'abc')).toBe(true);
    expect(sameSecret('abd', 'abc')).toBe(false);
    expect(sameSecret('ab', 'abc')).toBe(false);
    expect(sameSecret(undefined, 'abc')).toBe(false);
    expect(sameSecret(['abc'], 'abc')).toBe(false);
  });

  describe('importing a zip', () => {
    let store: TestBackend;
    let studio: Studio;
    beforeEach(async () => {
      store = await testBackend('files');
      studio = new Studio(store.root, tutorials, store.backend);
    });
    afterEach(() => store.close());

    const exported = async () => {
      const id = (await studio.create({ author: 'owner', title: 'Zipped' }))
        .project;
      return (await studio.exportZip(id)).bytes;
    };
    const zipOf = (files: Record<string, Uint8Array>) =>
      Buffer.from(zipSync(files, { level: 9 })).toString('base64');

    it('refuses a zip with too many files or too many unzipped bytes', async () => {
      const many = Object.fromEntries(
        Array.from({ length: ZIP_LIMITS.entries + 1 }, (_, i) => [
          `f${i}.txt`,
          strToU8('x'),
        ]),
      );
      await expect(
        studio.importZip({ author: 'owner', zip: zipOf(many) }),
      ).rejects.toThrow(/too big to import/);
      const bomb = { 'project.json': new Uint8Array(ZIP_LIMITS.bytes + 1) };
      await expect(
        studio.importZip({ author: 'owner', zip: zipOf(bomb) }),
      ).rejects.toThrow(/too big to import/);
    });

    it('refuses a reference photo whose type or size is not plain data', async () => {
      const { unzipSync, strFromU8 } = await import('fflate');
      const files = unzipSync(await exported());
      const project = JSON.parse(strFromU8(files['project.json']!));
      const photo = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      for (const reference of [
        {
          file: 'reference.png',
          type: 'image/png"/><image href="file:///etc/passwd',
          width: 10,
          height: 10,
        },
        {
          file: 'reference.png',
          type: 'image/png',
          width: '10" onload="x',
          height: 10,
        },
        { file: '../reference.png', type: 'image/png', width: 10, height: 10 },
      ]) {
        const zip = zipOf({
          'project.json': strToU8(JSON.stringify({ ...project, reference })),
          'reference.png': photo,
          '../reference.png': photo,
        });
        await expect(
          studio.importZip({ author: 'owner', zip }),
          JSON.stringify(reference),
        ).rejects.toThrow(/cannot be read/);
      }
    });
  });

  it('writes only numbers and a known type into the overlay SVG', () => {
    const good: Reference = {
      file: 'reference.png',
      type: 'image/png',
      width: 4,
      height: 3,
    };
    expect(isReference(good)).toBe(true);
    expect(overlaySvg(good, Buffer.from('x'))).toContain('width="4"');
    const bad = { ...good, type: 'image/png;"/><x' } as unknown as Reference;
    expect(() => overlaySvg(bad, Buffer.from('x'))).toThrow(/cannot be read/);
  });
});
