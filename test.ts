import { readSync, openSync, fstatSync } from 'fs';
import { Struct,
  Primitive,
  StringFormatter,
  BooleanFormatter,
  l,
  la
} from '@ololoken/struct'

type DbEntry = {
  pathLength: number
  path: string
  compressed: boolean
  uncompressedSize: number
  dataSize: number
  dataOffset: number
}
type DbTail = { entriesSize: number, dbSize: number }

const fd = openSync('/Users/roman/Downloads/games/Fallout_Sonora_Dayglow_1_15/master.dat', 'r');
const stat = fstatSync(fd);

const tailBytes = Buffer.alloc(1024*1024);

readSync(fd, tailBytes, 0, tailBytes.byteLength, Math.max(stat.size, tailBytes.length)-tailBytes.byteLength);

console.log(
  new Struct<{ entriesCount: number, entries: Array<DbEntry> } & DbTail >()
    .goto(l(tailBytes.byteLength - 8))
    .single('entriesSize', Primitive.UInt32LE())
    .goto((res) => tailBytes.byteLength - res.entriesSize - 8)
    .single('entriesCount', Primitive.Int32LE())
    .array('entries', new Struct<DbEntry>()
      .single('pathLength', Primitive.Int32LE())
      .array('path', Primitive.UInt8(), la('pathLength'), StringFormatter({encoding: 'ascii'}))
      .single('compressed', Primitive.UInt8(), BooleanFormatter())
      .single('uncompressedSize', Primitive.UInt32LE())
      .single('dataSize', Primitive.UInt32LE())
      .single('dataOffset', Primitive.UInt32LE()), la('entriesCount'))
    .goto(l(tailBytes.byteLength - 4))
    .single('dbSize', Primitive.UInt32LE()).unpack(new DataView(tailBytes.buffer, 0, tailBytes.byteLength))
);

