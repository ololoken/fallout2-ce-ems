import { BooleanFormatter, l, la, Primitive, StringFormatter, Struct } from '@ololoken/struct';
import { Module } from '../../types/Module';
import throwExpression from "../../common/throwExpression.ts";

type DbEntry = {
  pathLength: number
  path: string
  compressed: boolean
  uncompressedSize: number
  dataSize: number
  dataOffset: number
}

export class CacheService {
  private static readonly PRELOAD_SIZE = 1024*1024;
  private readonly dbStream;
  private readonly dbEntries;
  private loader?: (value: (((prevState: number) => number) | number)) => void;

  constructor(
    private readonly instance: Module,
    private readonly remoteCacheUrl: string,
    protected readonly dbFile: { size: number, path: string }
  ) {
    this.instance[this.dbFile.path] = this;

    this.dbStream = this.instance.FS.open(`${this.instance.ENV.HOME}/${this.dbFile.path}`, 'r+');

    const tailBuffer = new Uint8Array(CacheService.PRELOAD_SIZE);
    const t_size_UInt32 = 4;

    this.instance.FS.read(this.dbStream, tailBuffer, 0, tailBuffer.byteLength, this.dbFile.size-tailBuffer.byteLength);

    this.dbEntries = new Struct<{ entriesCount: number, entries: Array<DbEntry>, entriesSize: number, dbSize: number }>()
      .goto(l(tailBuffer.byteLength - t_size_UInt32 * 2))
      .single('entriesSize', Primitive.UInt32LE())
      .goto((res) => tailBuffer.byteLength - res.entriesSize - t_size_UInt32 * 2)
      .single('entriesCount', Primitive.Int32LE())
      .array('entries', new Struct<DbEntry>()
        .single('pathLength', Primitive.Int32LE())
        .array('path', Primitive.UInt8(), la('pathLength'), StringFormatter({encoding: 'utf8'}))
        .single('compressed', Primitive.UInt8(), BooleanFormatter())
        .single('uncompressedSize', Primitive.UInt32LE())
        .single('dataSize', Primitive.UInt32LE())
        .single('dataOffset', Primitive.UInt32LE()), la('entriesCount'))
      .goto(l(tailBuffer.byteLength - t_size_UInt32))
      .single('dbSize', Primitive.UInt32LE()).unpack(new DataView(tailBuffer.buffer, 0, tailBuffer.byteLength))
  }

  private get key () {
    return `cacheDB:${this.dbFile.path}`;
  }

  private getCachedItems(): Array<string> {
    try {
      return JSON.parse(localStorage.getItem(this.key) ?? '[]');
    }
    catch (e) {}
    return []
  }

  static async init(
    instance: Module,
    remoteCacheUrl: string,
    file: { size: number, path: string }
  ) {
    const path = `${instance.ENV.HOME}/${file.path}`
    if (!instance.FS.analyzePath(path).exists) {
      //create dummy db file
      const dummyDbFile = await fetch(`${remoteCacheUrl}/${file.path}`, { headers: { 'Range': `bytes=${file.size-CacheService.PRELOAD_SIZE}-${file.size}` } })
        .then(resp => resp.arrayBuffer())
        .then(buffer => new Blob([new Uint8Array(file.size - buffer.byteLength), buffer]).arrayBuffer());
      instance?.FS.writeFile(path, new Uint8Array(dummyDbFile));
      console.log(`Created file ${file.path}:${file.size} at ${path}`)
    }

    return new CacheService(instance, remoteCacheUrl, file);
  }

  public async start(preloadList: Array<string>) {
    const cachedItems = this.getCachedItems();
    const entries = preloadList.filter(file => !cachedItems.includes(file))
      .flatMap(file => this.dbEntries.entries.find(entry => entry.path === file) ?? [])
      .filter(entry => {
        const dataOffset = this.dbFile.size - this.dbEntries.dbSize + entry.dataOffset;
        const buffer = new Uint8Array(Math.min(entry.dataSize, 512));
        this.instance.FS.read(this.dbStream, buffer, 0, buffer.byteLength, dataOffset);
        return buffer.reduce((acc, b) => b, 0) === 0;
      })
      .sort((a, b) => a.dataOffset-b.dataOffset);
    const groups = entries.reduce((c, entry, index, a) => {
      if (index === 0) {
        c.push([entry]);
        return c;
      }
      const prev = a.at(index-1) ?? throwExpression('whuuut?');
      if (entry.dataOffset - prev.dataOffset+prev.dataSize < 1024*1024*20) {
        c[c.length-1].push(entry);
      }
      else {
        c.push([entry]);
      }
      return c;
    }, <Array<Array<DbEntry>>>[])
    for (const g of groups) {
      const first = g.at(0) ?? throwExpression('whuuut?');
      const last = g.at(-1) ?? throwExpression('whuuut?');
      const dataOffset = this.dbFile.size - this.dbEntries.dbSize + first.dataOffset;
      const size = last.dataOffset + last.dataSize - dataOffset;
      await this.cacheSector(dataOffset, size, false);
    }
  }

  private async cacheEntry(entry: DbEntry, sync = true) {
    const dataOffset = this.dbFile.size - this.dbEntries.dbSize + entry.dataOffset;
    await this.cacheSector(dataOffset, entry.dataSize, false);
    if (sync) await this.syncCache();
  }

  private async cacheSector(dataOffset: number, size: number, sync = true) {
    console.log(`caching sector from ${dataOffset} of size ${size}/${(size/1024).toFixed(2)}KB`)
    let totalDataSize = size;
    let totalDataDownloaded = 0;
    const content = await fetch(`${this.remoteCacheUrl}/${this.dbFile.path}`, { headers: { 'Range': `bytes=${dataOffset}-${dataOffset+size-1}` } })
      .then(async resp => {
        const reader = resp.body?.getReader() ?? throwExpression(`failed to fetch}`);
        const chunks = []
        while(true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          totalDataDownloaded += value.length;
          if (totalDataSize > 1024*1024) this.loader?.(totalDataDownloaded/totalDataSize*100);
        }

        return await new Blob(chunks).arrayBuffer();
      })
      .then(buffer => new Uint8Array(buffer))
      .finally(() => this.loader?.(0));
    this.instance.FS.write(this.dbStream, content, 0, content.byteLength, dataOffset);
    if (sync) await this.syncCache();
  }

  public async syncCache() {
    return new Promise<void>((resolve, reject) => this.instance.FS.syncfs(false, err => {
      if (err) return reject(err);
      resolve();
      return true;
    }))
  }

  private isPhysicallyCached(entry: DbEntry): boolean {
    const dataOffset = this.dbFile.size - this.dbEntries.dbSize + entry.dataOffset;
    const buffer = new Uint8Array(Math.min(entry.dataSize, 512));
    this.instance.FS.read(this.dbStream, buffer, 0, buffer.byteLength, dataOffset);
    return buffer.reduce((acc, b) => b, 0) !== 0;
  }

  public async checkCache(path: string) {
    const entry = this.dbEntries.entries.find(entry => entry.path.replace('/\\/ig', '/').toLowerCase() === path.toLowerCase());
    if (entry && !this.isPhysicallyCached(entry)) {
      await this.cacheEntry(entry);
    }
  }

  setBigFileLoader(setCacheLoading: (value: (((prevState: number) => number) | number)) => void) {
    this.loader = setCacheLoading;
  }
}
