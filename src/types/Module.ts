export type ModuleInitParams = {
  pushMessage: (msg: string) => void
  reportDownloadProgress: (percent: number) => void
  canvas: HTMLCanvasElement
  ENV: { [key: string]: string | number }
}

export type Module = {
  ENV: { [key: string]: string | number }
  FS: {
    filesystems: { IDBFS: any, MEMFS: any }
    mkdir: (dir: string) => void
    mount: (fs: any, options: {}, path: string) => void,
    syncfs: (syncOrCallback: boolean | ((err: any) => void), callback?: (err: any) => void) => void
    lookupPath: (path: string) => { path: string, node: FSNode }
    writeFile: (path: string, data: Uint8Array | string, options?: { encoding?: 'utf8' | 'binary' }) => void
    readFile: (path: string, options: { encoding?: 'utf8' | 'binary' }) => string | Uint8Array
    stat: (path: string) => any
    unlink: (path: string) => void
    rmdir: (path: string) => void
    chdir: (path: string) => void
  }
  preInit: (() => void)[]
  preRun: (() => void)[]
  locateFile: (path: string) => string
  setStatus: (status: string | Object) => void
  addRunDependency: (dep: string) => void
  removeRunDependency: (dep: string) => void
  print: (msg: string) => void
  printErr: (msg: string) => void
  canvas: HTMLCanvasElement
  onExit: (code: number) => void
  noInitialRun: boolean
  run: () => void
  callMain: (args?: any[]) => void
}

export type FSNode = {
  node_ops: {}
  stream_ops: {};
  readMode: number
  writeMode: number
  mounted: {} | null

  contents: {
    [name: string]: FSNode
  } | Int8Array

  /* unix timestamps */
  atime: number
  ctime: number
  mtime: number

  name: string

  id: number

  mount?: {
    mountpoint: string
    mounts: Array<any>
    opts: { root: string }
    root: FSNode
  }

  parent?: FSNode

  get read(): boolean
  set read(val)
  get write(): boolean
  set write(val)
  get isFolder(): boolean
  get isDevice(): boolean
}

type FSStat = {
  atime: Date
  ctime: Date
  mtime: Date

  blksize: number
  blocks: 1
  dev: number
  gid: 0
  uid: 0
  ino: number
  mode: number
  nlink: number
  rdev: number
  size: number
}
