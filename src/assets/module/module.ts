import { BundleFile, BundleNode, Module, ModuleInitParams } from '../../types/Module';

import wasm from './fallout2-ce.wasm?url'
import fallout2ce from './fallout2-ce';
import bundle from './bundle.json'


const flatten = ((root: BundleNode): Array<BundleFile> => root
  .filter(node => ['directory', 'file'].includes(node.type)).flatMap(node => node.type === 'directory'
    ? flatten(node.contents)
    : node as BundleFile
  ))

export const ModuleInstance = ({ ENV, reportDownloadProgress, pushMessage, canvas, onExit }: ModuleInitParams) => {
  let module: Module;
  return fallout2ce(module = <Module>{
    REMOTE_DATA_BASE_URL: 'https://storage.yandexcloud.net/yandex-games/Fallout_Sonora_Dayglow_1_15',
    REMOTE_DATA_BUNDLE: flatten(bundle as BundleNode),
    print: msg => module.printErr?.(msg),
    printErr: msg => pushMessage?.(msg),
    canvas,
    preInit: [() => {
      Object.assign(module.ENV, ENV)
    }],
    preRun: [
      () => {
        module.addRunDependency('fs-sync')
        module.FS.mkdir(`${ENV.HOME}`);
        module.FS.mount(module.FS.filesystems.IDBFS, { root: '/' }, `${ENV.HOME}`);
        module.FS.syncfs(true, err => {
          if (err) throw err;
          module.removeRunDependency('fs-sync')
        });
      },
    ],
    noInitialRun: true,
    onExit,
    locateFile: (path: string) => {
      if (path.endsWith('wasm')) return wasm;
      throw(`Unknown file[${path}] is requested by fallout2-ce.js module; known urls are: ${[wasm]}`);
    },
    setStatus: (status: string | {}) => {
      if (!status) return;
      if (typeof status === 'string') {
        pushMessage(status);
        const dlProgressRE = /(?<progress>\d+)\/(?<total>\d+)/ig;
        if (!dlProgressRE.test(status)) return;
        dlProgressRE.lastIndex = 0;
        const { groups: { progress, total } } = [...status.matchAll(dlProgressRE)][0] as unknown as { groups: { progress: number, total: number } };
        reportDownloadProgress?.(Math.round(progress / total * 100));
      }
    }
  });
}
