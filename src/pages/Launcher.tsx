import {
  Card,
  Box,
  CardContent,
  CardHeader,
  ToggleButton,
  Tooltip,
  tooltipClasses,
  Button,
  Stack,
  CircularProgress, Typography
} from '@mui/material';
import BackgroundImage from '../assets/images/background.jpg'

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation} from 'react-i18next';
import { Module } from '../types/Module';

import DeleteIcon from '../components/icons/DeleteIcon';
import LaunchIcon from '../components/icons/LaunchIcon';
import TerminalIcon from '../components/icons/TerminalIcon';

import ActionConfirmation from '../components/ActionConfirmation';
import { ModuleInstance } from '../assets/module/module';
import useYSDK from '../hooks/useYSDK';
import ddrawIni from '../assets/module/ddraw.ini';
import f2_resIni from '../assets/module/f2_res.ini';
import fallout2cfg from '../assets/module/fallout2.cfg';
import throwExpression from '../common/throwExpression';
import useConfig from '../hooks/useConfig';
import { CacheService } from '../assets/module/cache.service';
import preloadBundle from '../assets/module/preload.bundle.json';
import serial from '../common/serial';

export default () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const config = useConfig();

  if (config.i18n !== 'ru-RU') config.onChangeLocalization('ru-RU');

  const { sdk } = useYSDK()

  if (sdk.environment.i18n.lang != 'ru')
    console.warn(`Game supports only russian language`);

  const [instance, setInstance] = useState<Module>();
  const [readyToRun, setReadyToRun] = useState(false);
  const [mainRunning, setMainRunning] = useState(false);
  const [hasData, setHasData] = useState(false);

  const [showConsole, setShowConsole] = useState(import.meta.env.DEV)
  const [messages, setMessages] = useState<Array<string>>([]);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadTimer, setDownloadTimer] = useState(0);
  const pushMessage = (msg: string) => setMessages(messages => {
    if (msg === 'Running...') return messages;
    messages.reverse().length = Math.min(messages.length, 200);
    return [...messages.reverse(), msg]
  });

  const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false)

  const [logbox, canvas] = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLCanvasElement>(null),
  ];

  useEffect(() => {
    if (!readyToRun || !instance || mainRunning) return;
    if (import.meta.env.PROD) runInstance();
  }, [readyToRun, instance, mainRunning]);

  useEffect(() => {
    if (!instance) return;
    const handler = () => {
      if (document.hidden) {
        instance.SDL2?.audioContext.suspend();
      } else {
        instance.SDL2?.audioContext.resume();
      }
    }
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [instance]);

  useEffect(() => {
    if (!hasData || !instance) return;
    instance.print(t(`Data bundle looks ok. Continue initialization...`))
    instance.FS.syncfs(false, err => {
      if (err) return instance.print(t('error.Failed to sync FS'));
      instance.FS.chdir(`${instance?.ENV.HOME}`);
      setReadyToRun(true);
      return true;
    })
  }, [hasData, instance]);

  useEffect(() => {
    logbox.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end'
    });
  }, [showConsole, messages]);

  useEffect(function critical () {//init wasm module instance
    if (!canvas.current || !sdk) return;
    if ((critical as any)['lock']) return;
    (critical as any)['lock'] = true;
    pushMessage(t(`Starting wasm module...`));
    ModuleInstance({
      ENV: { HOME: '/fallout2-ce-sonora' },
      canvas: canvas.current,
      pushMessage,
      reportDownloadProgress: () => {},
      onExit: (code) => {
        console.info('!+EXIT+!', code);
        if (import.meta.env.PROD) {
          sdk.dispatchEvent('EXIT')
            .then(console.log).catch(console.error)
            .finally(() => location.reload());
        }
      }
    }).then(setInstance)
      .catch((e: Error) => {
        pushMessage(t(`error.WASM module start failed`));
        console.error(e);
      })
  }, [canvas, sdk])

  useEffect(() => {
    if (!instance) return;
    Object.assign(window,  { instance });//debug purposes
    let totalDataSize = 0;
    let totalDataDownloaded = 0;
    instance.print(t(`Looking up data in [{{path}}]`, { path: instance.ENV.HOME }));
    const intervalHandle = setInterval(() => {
      instance?.print(`Загружено ${totalDataDownloaded}/${totalDataSize}`);
      setDownloadProgress(totalDataDownloaded/totalDataSize*100);
    }, 1000);
    const start = performance.now();
    const timerIntervalHandle = setInterval(() => {
      setDownloadTimer((performance.now()-start)/1000)
    }, 1)
    const datFiles = instance.REMOTE_DATA_BUNDLE.filter(file => file.name.endsWith('master.dat'));
    const restFiles = instance.REMOTE_DATA_BUNDLE.filter(file => !file.name.endsWith('master.dat'));
    Promise.all(restFiles.filter(file => {
      const info = instance.FS.analyzePath(`${instance.ENV.HOME}/${file.name}`);
      return !info.exists || info.object.contents.length !== file.size
    }).map(missingFile => {
      if (!instance) return false;
      totalDataSize += missingFile.size;
      instance.print(`Нужно докачать: ${missingFile.name}`);
      const path = `${instance?.ENV.HOME}/${missingFile.name}`;
      //return Promise.resolve(true);
      instance?.FS.mkdirTree(instance.PATH.dirname(path) ?? throwExpression('failed_to_create_dir'));
      return fetch(`${instance.REMOTE_DATA_BASE_URL}/${missingFile.name}`)
        .then(async resp => {
          const reader = resp.body?.getReader() ?? throwExpression(`failed to fetch ${(missingFile.name)}`);
          const chunks = []
          while(true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            totalDataDownloaded += value.length;
          }
          instance?.FS.writeFile(path, new Uint8Array(await new Blob(chunks).arrayBuffer()));
          instance?.print(`Файл [${missingFile.name}] полностью скачан.`);
          return true;
        })
        .catch((e) => {
          console.log(e);
          return false;
        });
    }))
      .then(arr => arr.reduce((res, b) => res = res === false ? res : b, true))
      .then(async res => {
        if (!res) {
          instance.print(`Что-то не прогрузилось, попробуйте обновить страницу.`);
          return;
        }

        clearInterval(intervalHandle);
        clearInterval(timerIntervalHandle);
        setDownloadProgress(0);
        setDownloadTimer(0);

        instance.FS.writeFile(`${instance?.ENV.HOME}/f2_res.ini`, f2_resIni, { encoding: 'utf8' });
        //instance.FS.writeFile(`${instance?.ENV.HOME}/fallout2.cfg`, fallout2cfg, { encoding: 'utf8' });
        instance.FS.writeFile(`${instance?.ENV.HOME}/ddraw.ini`, ddrawIni, { encoding: 'utf8' });
        await serial(datFiles.map(datFile => () => CacheService.init(instance, instance.REMOTE_DATA_BASE_URL, { path: datFile.name, size: datFile.size })
          .then(service => {
            const [,list] = Object.entries(preloadBundle).find(([fn]) => datFile.name.endsWith(fn)) ?? [,[]];
            service.setBigFileLoader(setDownloadProgress)
            return service.start(Object.keys(list))
              .finally(() => {
                //dirty hack as I dont' want to implement safe chunk by chunk fetch of big files
                const lsKey = `loaded$${datFile.name}`;
                if (localStorage.getItem(lsKey) === 'yes') return;
                fetch(`${instance.REMOTE_DATA_BASE_URL}/${datFile.name}`)
                  .then(resp => resp.arrayBuffer())
                  .then(arrayBuffer => instance?.FS.writeFile(`${instance.ENV.HOME}/${datFile.name}`, new Uint8Array(arrayBuffer)))
                  .then(() => service.syncCache())
                  .then(() => localStorage.setItem(lsKey, 'yes'))
                  .catch((ignore) => console.log(`fetch of ${datFile.name} faile, lets try next time`))
              });
          })));
        console.log(`loaded in ${(performance.now()-start)/1000}s`)
        setHasData(res);
      })
      .finally(() => {

      });
  }, [instance])

  const clearPath = (basePath: string) => {
    if (!instance) return;
    try {
      Object.entries(instance.FS.lookupPath(basePath).node.contents).forEach(([path, { isFolder }]) => {
        instance.print(`Clearing ${basePath}/${path}`)
        isFolder
            ? clearPath(`${basePath}/${path}`)
            : instance.FS.unlink(`${basePath}/${path}`)
      })
      instance.FS.rmdir(`${basePath}`)
    } catch (err) {
      instance.print(`Failed to remove stored data`)
      console.error(err)
    }
  };

  const removeData = () => {
    setOpenDeleteConfirmation(true);
  }

  const runInstance = () => {
    if (!instance || mainRunning) return;
    try {
      instance.callMain();
    }
    catch (e) {
      console.log(e);
    }
    setMainRunning(true);
    setShowConsole(false);
    sdk.features.LoadingAPI.ready();
  }

  return (
    <Card
      elevation={0}
      sx={{
        position: 'relative',
        border: import.meta.env.PROD ? 'none' : '1px solid',
        borderRadius: 1,
        borderColor: theme.palette.divider,
      }}
    >
      <CardHeader
        slotProps={{
          title: { variant: 'subtitle1' }
        }}
        title={''}
        sx={{ p: '8px 12px', height: '44px', '& .MuiCardHeader-action': { width: '100%' }, ...(import.meta.env.PROD ? {display: 'none'} : {}) }}
        action={<>
          <Stack direction={"row"} spacing={2}>
            <Box flex={1} />
            {!readyToRun && <CircularProgress color="warning" size="34px" />}
            {readyToRun && hasData && !mainRunning && <Button
                sx={{ fontSize: '1em', height: '36px' }}
                variant="contained"
                onClick={() => runInstance()}
            ><LaunchIcon width="2.4em" height="2.4em" style={{ margin: '0 1em 0 0' }} /> {t('menu.Run')}</Button>}
            {readyToRun && hasData && !mainRunning && <Button
              sx={{ fontSize: '1em', height: '36px' }}
              variant="contained"
              onClick={() => removeData()}
            ><DeleteIcon width="2.4em" height="2.4em" style={{ margin: '0 1em 0 0' }} /> {t('menu.Remove data')}</Button>}
            <Tooltip title={t('menu.Toggle Console')} slotProps={{ popper: { sx: {
                [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]: { marginTop: '0px', color: '#000', fontSize: '1em' }
              } }}}>
                <ToggleButton value={-1} selected={showConsole} sx={{ p: '3px 6px', height: '36px' }} onClick={() => {
                  //open(URL.createObjectURL(new Blob([instance?.FS.readFile("/fallout2-ce-sonora/critter.dat", { encoding: 'binary' })!], {type: 'octet/stream'})));
                  setShowConsole(!showConsole)
                }}>
                  <TerminalIcon width="2.4em" height="2.4em" />
              </ToggleButton>
            </Tooltip>
          </Stack>
        </>}
      />
      <CardContent sx={{
        p: 0,
        m: 0,
        background: `url(${BackgroundImage}) center center`,
        backgroundSize: 'cover',
        height: 'calc(100vh - 46px)',
        position: 'relative',
        '&:last-child': {
          paddingBottom: 0
        }}}>
        <Box sx={{
          bgcolor: 'rgba(0, 0, 0, 0.4)',
          height: showConsole ? '100%' : 0,
          width: '100%',
          whiteSpace: 'pre',
          overflowY: 'auto',
          fontFamily: 'Fallout',
          position: 'absolute',
          zIndex: 1000
        }}>
          {messages.join('\n')}
          <div ref={logbox}></div>
        </Box>
        <canvas id="canvas" ref={canvas} width={640} height={480} style={{
          width: '100%', height: '100%', position: 'absolute', zIndex: 100,
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          maxWidth: 'calc(100vh * 640 / 480)'
        }}></canvas>
      </CardContent>
      {downloadProgress ? <Box sx={{ position: 'absolute', display: 'inline-flex', zIndex: 120, top: 'calc(100vh / 2 - 100px)', left: 'calc(100vw / 2 - 100px)' }}>
        <CircularProgress variant="indeterminate" value={downloadProgress} size={200} />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="caption"
            fontSize={40}
            fontWeight={'bold'}
            component="div"
            sx={{ color: 'text.primary' }}
          >{`${Math.round(downloadProgress)}%`}</Typography>
          {downloadTimer ? <Typography
              variant="subtitle1"
              component="div"
              sx={{ color: 'text.primary' }}
          >{`${downloadTimer.toFixed(2)} c`}</Typography> : <Typography
            variant="subtitle1"
            component="div"
            sx={{ color: 'text.primary' }}
          >Кеширование</Typography>}
        </Box>
      </Box> : ''}
      <ActionConfirmation
        open={openDeleteConfirmation}
        title={t('confirm.Are you sure?')}
        handleClose={(status) => {
          setOpenDeleteConfirmation(false);
          if (!status || !instance) return;

          clearPath(`${instance.ENV.HOME}`);
          instance.FS.syncfs(false, err => {
            if (err) return instance.print(`Failed to remove data at [${instance.ENV.HOME}]`);
            setHasData(false)
            setShowConsole(true)
          });

        }}
        color="error" />
    </Card>
  )
}
