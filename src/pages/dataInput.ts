import throwExpression from '../common/throwExpression';
import { Module } from '../types/Module';
import { BlobReader, Uint8ArrayWriter, ZipReader } from '@zip.js/zip.js';

const whitListedFolders = ['data', 'fallout_sonora'];
const requiredFiles = ['master.dat', 'critter.dat']

const filterInput = (relativePath: string) => {
  if (relativePath.endsWith('/')) return false;
  const [fileName, ...path] = relativePath.split('/').reverse();
  if (fileName.startsWith('.')) return false;
  console.log(path)
  return path
    .map(folder => folder.toLocaleLowerCase())
    .some(folder => whitListedFolders.includes(folder))
}

const mkdirWithParents = (instance: Module) => (path: string) => {
  const parts = path.split('/');
  try { instance?.FS.lookupPath(parts.join('/')) }
  catch (ignore) {
    instance.print(`Creating new directory [${path}]`);
    parts.reduce((p, part) => {
      p = [...p, part];
      try { instance?.FS.lookupPath(p.join('/')) }
      catch (ignore) { instance?.FS.mkdir(p.join('/')) }
      return p;
    }, new Array<string>());
  }
}

export const directoryInputHandler = (instance: Module, setHasData: (hasData: boolean) => void) => ({ target }: Event) => {

  const input = target as HTMLInputElement;
  if (!input.files) return instance.print('No files selected');

  const files = [...input.files];
  input.value = '';

  if (files.length === 1) return instance.print('zip archives are not supported yet, sorry');
  if (files.length > 3000) return instance.print('wrong directory, or your maps collection is really awesome.');

  const filtered = files.filter(({ webkitRelativePath }) => filterInput(webkitRelativePath));

  const requiredResolved = filtered.filter(({ webkitRelativePath: path }) =>
    requiredFiles.some(rq => path.toLocaleLowerCase().endsWith(rq.toLocaleLowerCase()))).length === requiredFiles.length;
  if (!requiredResolved) return instance.print('Required data not found in directory');

  filtered.reduce((uploaded, file) => {
    const [fileName, ...path] = file.webkitRelativePath.split('/').reverse();
    const [, ...relativePath] = path.reverse();

    mkdirWithParents(instance)(`${instance.ENV.HOME}/${relativePath.join('/')}`);

    const reader = new FileReader();
    reader.addEventListener('error', console.error);
    reader.addEventListener('loadend', ({ target }) => {
      const uri = `${instance.ENV.HOME}/${relativePath.join('/')}/${fileName}`;
      instance.print(`Writing file ${uri} to virtual fs from ${file.webkitRelativePath}`);
      instance.FS.writeFile(`${uri}`, new Uint8Array(target?.result as ArrayBuffer ?? throwExpression('')), {
        encoding: 'binary'
      });
      uploaded.push(uri);
      if (uploaded.length === filtered.length) {
        instance.print(`Data bundle looks ok. Ready to run...`)
        instance.FS.syncfs(false, err => {
          if (err) return instance.print('Failed to sync FS');
          setHasData(true);
        })
      }
    });
    reader.readAsArrayBuffer(file);
    return uploaded;
  }, new Array<string>);
}

export const zipInputReader = (instance: Module, setHasData: (hasData: boolean) => void, file: Blob) => {
  new ZipReader(new BlobReader(file)).getEntries({})
    .then(entries => entries.filter(({ filename: relativePath }) => filterInput(relativePath)))
    .then(filtered => {
      const hasRootFolder = Object.keys(filtered
        .reduce((names, { filename }) => ({ ...names, [`${filename.split('/').at(0)}`]: true }), <{[k: string]: boolean}>{}))
        .length === 1;
      filtered.reduce((uploaded, entry) => {
        const [fileName, ...path] = entry.filename.split('/').reverse();
        let relativePath: string[];
        if (hasRootFolder) [, ...relativePath] = path.reverse();
        else [...relativePath] = path.reverse();

        const uri = `${instance.ENV.HOME}/${relativePath.join('/')}/${fileName}`;
        mkdirWithParents(instance)(`${instance.ENV.HOME}/${relativePath.join('/')}`);

        entry.getData?.(new Uint8ArrayWriter).then(data => {
          instance.print(`Writing file ${uri} to virtual fs from provided zip archive`);
          instance.FS.writeFile(`${uri}`, data, {
            encoding: 'binary'
          });
          uploaded.push(uri);
          if (uploaded.length === filtered.length) {
            instance.print(`Data bundle looks ok. Continue initialization...`)
            instance.FS.syncfs(false, err => {
              if (err) return instance.print('Failed to sync FS');
              setHasData(true)
            })
          }
        })

        return uploaded;
      }, new Array<string>)
    })
}

export const zipInputHandler = (instance: Module, setHasData: (hasData: boolean) => void) => ({ target }: Event) => {
  const input = target as HTMLInputElement;
  const file = input.files?.[0] ?? throwExpression('no file provided');
  input.value = '';
  zipInputReader(instance, setHasData, file);
}
