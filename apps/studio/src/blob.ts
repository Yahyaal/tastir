import { del, get, put } from '@vercel/blob';
import type { PhotoStore } from './backend.js';

/**
 * Reference photos in a private Vercel Blob store, for the hosted studio.
 * Private blobs have no public address: only the server, with the store's
 * token (BLOB_READ_WRITE_TOKEN), can read them, and it does so only for a
 * signed-in owner or a signed-in agent's picture.
 */
const path = (id: string, file: string) => `projects/${id}/${file}`;

export class BlobPhotos implements PhotoStore {
  async put(id: string, file: string, bytes: Buffer) {
    await put(path(id, file), bytes, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  }

  async get(id: string, file: string) {
    const found = await get(path(id, file), { access: 'private' });
    if (!found?.stream) throw new Error('The reference photo is missing.');
    return Buffer.from(await new Response(found.stream).arrayBuffer());
  }

  async remove(id: string, file: string) {
    await del(path(id, file));
  }
}
