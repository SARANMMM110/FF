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

      // Convert Node.js Readable to ReadableStream for compatibility
      const body = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(buffer));
          controller.close();
        }
      });

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
        bytes: async () => buffer,
        storageClass: 'STANDARD',
        writeHttpMetadata: (headers: any) => {
          // No-op for local storage - accept any Headers type
        },
        arrayBuffer: async () => buffer.buffer,
        json: async () => JSON.parse(buffer.toString()),
        text: async () => buffer.toString(),
        blob: async () => new Blob([buffer]),
      } as unknown as R2ObjectBody;
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
    } else if (value instanceof Blob || (typeof File !== 'undefined' && (value as any) instanceof File)) {
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

  // @ts-expect-error - Headers type incompatibility between DOM and Cloudflare Workers types
  async list(options?: R2ListOptions): Promise<R2Objects> {
    // Implementation with type assertion to handle Headers incompatibility
    const result = await this._listImpl(options);
    return result as unknown as R2Objects;
  }

  private async _listImpl(options?: {
    limit?: number;
    prefix?: string;
    cursor?: string;
    delimiter?: string;
    startAfter?: string;
    include?: ('httpMetadata' | 'customMetadata')[];
  }): Promise<R2Objects> {
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
            writeHttpMetadata: (headers: import("@cloudflare/workers-types").Headers) => {
              // No-op for local storage - accept Cloudflare Headers type
            },
          } as unknown as R2Object);
        }
      }

      const truncated = entries.length > limit;
      if (truncated) {
        return {
          objects: objects as any,
          truncated: true as const,
          cursor: `cursor_${Date.now()}`,
          delimitedPrefixes: [],
        } as any;
      }
      return {
        objects: objects as any,
        truncated: false as const,
        delimitedPrefixes: [],
      } as any;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return {
          objects: [],
          truncated: false as const,
          delimitedPrefixes: [],
        };
      }
      throw error;
    }
  }
}

