import { FSNode, Module } from '../types/Module';
import { Uint8ArrayReader, Uint8ArrayWriter, ZipWriter } from '@zip.js/zip.js';

export default  async (instance?: Module) => {
  if (!instance) return;
  const reducer: ({path, node}: {path: string, node: FSNode}) => ({[path: string]: Int8Array}) = ({ path, node }) =>
    Object.entries(node.contents).reduce((acc, [name, node]) => ({
      ...acc,
      ...(ArrayBuffer.isView(node.contents)
        ? { [`${path}/${name}`]: node.contents }
        : reducer({ path: `${path}/${name}`, node }))
    }), {} as ReturnType<typeof reducer>);
  const zip = new ZipWriter(new Uint8ArrayWriter(), { bufferedWrite: true });
  for(let [path, content] of Object.entries(reducer(instance.FS.lookupPath(`data/SAVEGAME`)))) {
    await zip.add(path, new Uint8ArrayReader(new Uint8Array(content.buffer)))
  }
  Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([await zip.close()], { type: 'application/zip' })),
    download: 'f2-ce-saves.zip'
  }).dispatchEvent(new MouseEvent('click'));
}
