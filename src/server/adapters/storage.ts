import { promises as fs } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import type { R2Bucket, R2Object, R2ObjectBody, R2PutOptions, R2GetOptions } from '@cloudflare/workers-types';

/**
 * R2Bucket adapter for Node.js using local filesystem
 * This mimics the Cloudflare R2 API so the worker code doesn't need changes
 */
export class NodeR2Bucket implements R2Bucket {
  private basePath: string;

  constructor(basePath: string = './storage') {
    this.basePath = basePath;
    // Ensure storage directory exists
    this.ensureDirectory(this.basePath);
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore
    }
  }

  private getFilePath(key: string): string {
    // Sanitize key to prevent directory traversal
    const sanitizedKey = key.replace(/\.\./g, '').replace(/^\//, '');
    return path.join(this.basePath, sanitizedKey);
  }

  async head(key: string): Promise<R2Object | null> {
    const filePath = this.getFilePath(key);
    try {
      const stats = await fs.stat(filePath);
      return {
        key,
        version: '1',
        size: stats.size,
        etag: `"${stats.mtimeMs}"`,
        uploaded: stats.birthtime,
        httpEtag: `"${stats.mtimeMs}"`,
        httpMetadata: {},
        customMetadata: {},
        checksums: {},
      } as R2Object;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async get(key: string, options?: R2GetOptions): Promise<R2ObjectBody | null> {
    const filePath = this.getFilePath(key);
    try {
      const stats = await fs.stat(filePath);
      const buffer = await fs.readFile(filePath);

      const body = Readable.from(buffer);

      return {
        key,
        version: '1',
        size: stats.size,
        etag: `"${stats.mtimeMs}"`,
        uploaded: stats.birthtime,
        httpEtag: `"${stats.mtimeMs}"`,
        httpMetadata: {},
        customMetadata: {},
        checksums: {},
        body,
        bodyUsed: false,
        arrayBuffer: async () => buffer.buffer,
        json: async () => JSON.parse(buffer.toString()),
        text: async () => buffer.toString(),
        blob: async () => new Blob([buffer]),
      } as R2ObjectBody;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async put(
    key: string,
    value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob | File | null | undefined,
    options?: R2PutOptions
  ): Promise<R2Object> {
    const filePath = this.getFilePath(key);
    await this.ensureDirectory(path.dirname(filePath));

    let buffer: Buffer;

    if (value instanceof ReadableStream) {
      const chunks: Uint8Array[] = [];
      const reader = value.getReader();
      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        chunks.push(chunk);
      }
      buffer = Buffer.concat(chunks);
    } else if (value instanceof ArrayBuffer) {
      buffer = Buffer.from(value);
    } else if (ArrayBuffer.isView(value)) {
      buffer = Buffer.from(value.buffer, value.byteOffset, value.byteLength);
    } else if (typeof value === 'string') {
      buffer = Buffer.from(value, 'utf-8');
    } else if (value instanceof Blob || value instanceof File) {
      buffer = Buffer.from(await value.arrayBuffer());
    } else {
      throw new Error('Unsupported value type for R2 put');
    }

    await fs.writeFile(filePath, buffer);
    const stats = await fs.stat(filePath);

    return {
      key,
      version: '1',
      size: stats.size,
      etag: `"${stats.mtimeMs}"`,
      uploaded: stats.birthtime,
      httpEtag: `"${stats.mtimeMs}"`,
      httpMetadata: options?.httpMetadata || {},
      customMetadata: options?.customMetadata || {},
      checksums: {},
    } as R2Object;
  }

  async delete(keys: string | string[]): Promise<void> {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    for (const key of keyArray) {
      const filePath = this.getFilePath(key);
      try {
        await fs.unlink(filePath);
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }
  }

  async list(options?: {
    limit?: number;
    prefix?: string;
    cursor?: string;
    delimiter?: string;
    startAfter?: string;
    include?: ('httpMetadata' | 'customMetadata')[];
  }): Promise<{
    objects: R2Object[];
    truncated: boolean;
    cursor?: string;
    delimitedPrefixes: string[];
  }> {
    const limit = options?.limit || 1000;
    const prefix = options?.prefix || '';
    const dirPath = path.join(this.basePath, prefix);

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const objects: R2Object[] = [];

      for (const entry of entries.slice(0, limit)) {
        const fullPath = path.join(dirPath, entry.name);
        const key = path.join(prefix, entry.name).replace(/\\/g, '/');

        if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          objects.push({
            key,
            version: '1',
            size: stats.size,
            etag: `"${stats.mtimeMs}"`,
            uploaded: stats.birthtime,
            httpEtag: `"${stats.mtimeMs}"`,
            httpMetadata: {},
            customMetadata: {},
            checksums: {},
          } as R2Object);
        }
      }

      return {
        objects,
        truncated: entries.length > limit,
        delimitedPrefixes: [],
      };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return {
          objects: [],
          truncated: false,
          delimitedPrefixes: [],
        };
      }
      throw error;
    }
  }
}

