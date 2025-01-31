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
  CircularProgress,
  Menu,
  MenuItem,
  ListItemText, ListItemIcon
} from '@mui/material';
import BackgroundImage from '../assets/images/background.jpg'

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Module } from '../types/Module';

import ActionConfirmation from '../components/ActionConfirmation';
import DeleteIcon from '../components/icons/DeleteIcon';
import DemoIcon from '../components/icons/DemoIcon';
import DownloadIcon from '../components/icons/DownloadIcon';
import FolderIcon from '../components/icons/FolderIcon';
import FullScreenIcon from '../components/icons/FullScreenIcon';
import GlobeIcon from '../components/icons/GlobeIcon';
import LaunchIcon from '../components/icons/LaunchIcon';
import TerminalIcon from '../components/icons/TerminalIcon';
import UploadIcon from '../components/icons/UploadIcon';
import ZipIcon from '../components/icons/ZipIcon';

import { ModuleInstance } from './module'
import {directoryInputHandler, zipHttpReader, zipInputReader} from './dataInput';
import useConfig from '../hooks/useConfig';
import f2_resIni from '../assets/fallout2ce/f2_res.ini';
import fetchSaves from './fetchSaves';
import throwExpression from '../common/throwExpression';

import { isTMA, initMiniApp } from '@tma.js/sdk';

export default () => {
  const { t, i18n: { resolvedLanguage } } = useTranslation();
  const config = useConfig();
  const theme = useTheme();
  const [downloadProgress, reportDownloadProgress] = useState(0);

  const [instance, setInstance] = useState<Module>();
  const [initialized, setInitialized] = useState(false);
  const [mainRunning, setMainRunning] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [uploadAnchorEl, setUploadAnchorEl] = useState<HTMLButtonElement>();
  const [langAnchorEl, setLangAnchorEl] = useState<HTMLElement>();

  const [showConsole, setShowConsole] = useState(true)
  const [messages, setMessages] = useState<Array<string>>([]);
  const pushMessage = (msg: string) => setMessages(messages => {
    messages.reverse().length = Math.min(messages.length, 200);
    return [...messages.reverse(), msg]
  });

  const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false)

  const [logbox, canvas, directoryInput, zipInput] = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLCanvasElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  useEffect(() => {
    logbox.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end'
    });
  }, [showConsole, messages]);

  useEffect(() => {//disable canvas context menu
    if (!canvas.current) return;
    const handler = (e: MouseEvent) => e.preventDefault();
    canvas.current.addEventListener('contextmenu', handler)
    return () => canvas.current?.removeEventListener('contextmenu', handler);
  }, [canvas]);

  useEffect(function critical () {//init wasm module instance
    if (!canvas.current) return;
    if ((critical as any)['lock']) return;
    (critical as any)['lock'] = true;
    pushMessage(`Starting wasm module...`);
    ModuleInstance({
      ENV: { HOME: '/fallout2-ce' },
      canvas: canvas.current,
      pushMessage,
      reportDownloadProgress,
    }).then(setInstance)
      .catch((e) => pushMessage(`WASM module start failed ${e}`))
  }, [canvas])

  useEffect(() => {
    if (!instance) return;

    instance.print(`Looking up data in [${instance.ENV.HOME}]`);
    (async () => {
      try {
        instance.print(`Mounting [${instance.ENV.HOME}]...`)

        instance.FS.mkdir(`${instance.ENV.HOME}`);
        instance.FS.mount(instance.FS.filesystems.IDBFS, {root: '/'}, `${instance.ENV.HOME}`);
        await new Promise<boolean>((resolve, reject) => instance.FS.syncfs(true, err => {
          if (err) return reject(err);
          instance.print(`Mounted [${instance.ENV.HOME}]`);
          resolve(Object.keys(instance.FS.lookupPath(`${instance.ENV.HOME}`).node.contents).length > 1);
        })).then(setHasData)
      } catch (ignore) {
        instance.print('No local data found...')
      } finally {
        setInitialized(true);
        instance.FS.writeFile(`${instance?.ENV.HOME}/f2_res.ini`, f2_resIni, { encoding: 'utf8' });
        instance.FS.chdir(`${instance?.ENV.HOME}`);

        isTMA().then(is => {
          if (is) {
            const [app] = initMiniApp();
            app.ready();
          }
        });
      }
    })()
  }, [instance])

  useEffect(() => {//handle folder input
    const { current } = directoryInput;
    if (!current || !instance) return;

    const handler = ({ target }: Event) => {
      const input = target as HTMLInputElement;
      if (!input.files) return instance.print('No files selected');
      directoryInputHandler(instance, [...input.files]).then(setHasData);
      input.value = '';
    }
    current.addEventListener('input', handler);

    return () => current.removeEventListener('input', handler);
  }, [directoryInput, instance]);

  useEffect(() => {//handle zip input
    const { current } = zipInput;
    if (!current || !instance) return;

    const handler = ({ target }: Event) => {
      const input = target as HTMLInputElement;
      const file = input.files?.[0] ?? throwExpression('no file provided');
      input.value = '';
      zipInputReader(instance, file).then(setHasData);
    }
    current.addEventListener('input', handler);

    return () => current.removeEventListener('input', handler);
  }, [zipInput, instance]);

  useEffect(() => {
    if (!hasData || !instance) return;
    instance.print(`Data bundle looks ok. Continue initialization...`)
    instance.FS.syncfs(false, err => {
      if (err) return instance.print('Failed to sync FS');
      return true;
    })
  }, [hasData, instance]);

  const clearPath = (basePath: string) => {
    if (!instance) return;
    try {
      Object.entries(instance.FS.lookupPath(basePath).node.contents).forEach(([path, { isFolder }]) => {
        instance.print(`Clearing ${basePath}/${path}`)
        isFolder
            ? clearPath(`${basePath}/${path}`)
            : instance.FS.unlink(`${basePath}/${path}`)
      })
      try { instance.FS.rmdir(`${basePath}`) } catch (ignore) {}
    } catch (e) {
      console.error(e);
      instance.print(`Failed to remove stored data ${e}`)
    }
  };

  const removeData = () => {
    setOpenDeleteConfirmation(true);
  }

  const runInstance = () => {
    if (!instance) return;
    instance.callMain();
    setMainRunning(true);
    setShowConsole(false);
  }

  const importSonora = async () => {
    if (!instance) return;
    instance.print(`Отличный выбор.... Начинаю установку.`);
    const url = 'https://turch.in/Fallout_Sonora_1_14.zip';
    zipHttpReader(instance, url).then(setHasData);
  }

  const importSonoraEn = async () => {
    if (!instance) return;
    instance.print(`Good luck you ranger....`);
    const url = 'https://turch.in/Fallout_Sonora_1_14_en.zip';
    zipHttpReader(instance, url).then(setHasData);
  }


  const importNevada = () => {
    if (!instance) return;
    const url = 'https://turch.in/Fallout_Nevada.zip';
    instance.print(`Отличный выбор.... Начинаю установку.`);
    zipHttpReader(instance, url, 20).then(setHasData);
  }

  useEffect(function critical () {
    const handler = (e: Event) => {
      setFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', handler);

    return () => document.removeEventListener('fullscreenchange', handler);
  }, [])

  useEffect(() => {
    instance?.print(fullscreen
      ? 'Entered fullscreen mode'
      : 'Exited fullscreen mode')
  }, [fullscreen])

  const doFullScreen = () => {
    instance?.print('Entering fullscreen mode')
    canvas.current?.requestFullscreen()
      .catch(() => instance?.print('Fullscreen request failed'));
  }

  return (
    <Card
      elevation={0}
      sx={{
        position: 'relative',
        border: '1px solid',
        borderRadius: 1,
        borderColor: theme.palette.divider,
      }}
    >
      <CardHeader
        slotProps={{ title: { variant: 'subtitle1' }}}
        title={''}
        sx={{ p: '8px 12px', height: '44px', '& .MuiCardHeader-action': { width: '100%' } }}
        action={<>
          <Stack direction={"row"} spacing={2}>
            <Tooltip title='Language' slotProps={{ popper: { sx: {
                  [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]: { marginTop: '0px', color: '#000', fontSize: '1em' }
                } }}}>
              <ToggleButton value={-1} selected={Boolean(langAnchorEl)} sx={{ p: '3px 6px', height: '36px' }} onClick={e => setLangAnchorEl(e.currentTarget)}>
                <GlobeIcon width="2.4em" height="2.4em" />
              </ToggleButton>
            </Tooltip>
            <Menu open={Boolean(langAnchorEl)} anchorEl={langAnchorEl} onClose={() => setLangAnchorEl(undefined)}>
              <MenuItem onClick={() => { config.onChangeLocalization('ru-RU'); setLangAnchorEl(undefined) }} disabled={!zipInput.current} sx={{fontSize: '10px', textDecoration: resolvedLanguage === 'ru-RU' ? 'underline' : '' }}>RU</MenuItem>
              <MenuItem onClick={() => { config.onChangeLocalization('en-US'); setLangAnchorEl(undefined) }} disabled={!directoryInput.current} sx={{fontSize: '10px', textDecoration: resolvedLanguage === 'en-US' ? 'underline' : ''}}>EN</MenuItem>
            </Menu>
            <Box flex={1} />
            {!initialized && <CircularProgress color="warning" size="34px" />}
            {initialized && !hasData && <Button
              sx={{ fontSize: '1em', height: '36px' }}
              variant="contained"
              onClick={e => setUploadAnchorEl(e.currentTarget)}
            >
              <UploadIcon width="2.4em" height="2.4em" style={{ margin: '0 1em 0 0' }} />{t('menu.Add game data')}
            </Button>}
            <Menu open={Boolean(uploadAnchorEl)} anchorEl={uploadAnchorEl} onClose={() => setUploadAnchorEl(undefined)}>
              <MenuItem onClick={() => { zipInput.current?.click(); setUploadAnchorEl(undefined) }} disabled={!zipInput.current} sx={{fontSize: '10px'}}>
                <ListItemIcon><ZipIcon width="2.4em" height="2.4em" style={{ margin: '0 1em 0 0' }} /></ListItemIcon>
                <ListItemText>{t('menu.Select zip archive')}</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { directoryInput.current?.click(); setUploadAnchorEl(undefined) }} disabled={!directoryInput.current} sx={{fontSize: '10px'}}>
                <ListItemIcon><FolderIcon width="2.4em" height="2.4em" style={{ margin: '0 1em 0 0' }} /></ListItemIcon>
                <ListItemText>{t('menu.Select data folder')}</ListItemText>
              </MenuItem>
              {resolvedLanguage === 'ru-RU' && <MenuItem onClick={() => { importSonora(); setUploadAnchorEl(undefined) }} sx={{fontSize: '10px'}}>
                <ListItemIcon><DemoIcon width="2.4em" height="2.4em" style={{ margin: '0 1em 0 0' }} /></ListItemIcon>
                <ListItemText>Fallout 2: Сонора</ListItemText>
              </MenuItem>}
              {resolvedLanguage === 'ru-RU' && <MenuItem onClick={() => { importNevada(); setUploadAnchorEl(undefined) }} sx={{fontSize: '10px'}}>
                  <ListItemIcon><DemoIcon width="2.4em" height="2.4em" style={{ margin: '0 1em 0 0' }} /></ListItemIcon>
                  <ListItemText>Fallout 2: Невада</ListItemText>
              </MenuItem>}
              {resolvedLanguage === 'en-US' && <MenuItem onClick={() => { importSonoraEn(); setUploadAnchorEl(undefined) }} sx={{fontSize: '10px'}}>
                  <ListItemIcon><DemoIcon width="2.4em" height="2.4em" style={{ margin: '0 1em 0 0' }} /></ListItemIcon>
                  <ListItemText>Fallout 2: Sonora</ListItemText>
              </MenuItem>}
            </Menu>
            {initialized && hasData && !mainRunning && <Button
                sx={{ fontSize: '1em', height: '36px' }}
                variant="contained"
                onClick={() => runInstance()}
            ><LaunchIcon width="2.4em" height="2.4em" style={{ margin: '0 1em 0 0' }} /> {t('menu.Run')}</Button>}
            {initialized && hasData && !mainRunning && <Button
                sx={{ fontSize: '1em', height: '36px' }}
                variant="contained"
                onClick={() => {
                  setInitialized(true)
                  fetchSaves(instance).finally(() => setInitialized(false));
                }}
            ><DownloadIcon width="2.4em" height="2.4em" style={{ margin: '0 1em 0 0' }} /> {t('menu.Fetch saves')}</Button>}
            {initialized && hasData && !mainRunning && <Button
              sx={{ fontSize: '1em', height: '36px' }}
              variant="contained"
              onClick={() => removeData()}
            ><DeleteIcon width="2.4em" height="2.4em" style={{ margin: '0 1em 0 0' }} /> {t('menu.Remove data')}</Button>}
            {mainRunning && <Tooltip title={t('menu.Toggle Fullscreen')} slotProps={{ popper: { sx: {
                  [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]: { marginTop: '0px', color: '#000', fontSize: '1em' }
                } }}}>
                <ToggleButton value={-1} selected={fullscreen} sx={{ p: '3px 6px', height: '36px' }} onClick={() => doFullScreen()}>
                    <FullScreenIcon width="2.4em" height="2.4em" />
                </ToggleButton>
            </Tooltip>}
            <Tooltip title={t('menu.Toggle Console')} slotProps={{ popper: { sx: {
                [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]: { marginTop: '0px', color: '#000', fontSize: '1em' }
              } }}}>
                <ToggleButton value={-1} selected={showConsole} sx={{ p: '3px 6px', height: '36px' }} onClick={() => setShowConsole(!showConsole)}>
                  <TerminalIcon width="2.4em" height="2.4em" />
              </ToggleButton>
            </Tooltip>
          </Stack>
        </>}
      />
      <input
        ref={directoryInput}
        style={{ display: 'none' }}
        type="file"
        multiple
        //@ts-ignore
        webkitdirectory={'directory'}
        directory={'directory'}
      />
      <input
        ref={zipInput}
        type="file"
        accept="application/zip"
        style={{ display: 'none' }}
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
          maxWidth: 'calc(100vh* 640 / 480)'
        }}></canvas>
      </CardContent>
      <ActionConfirmation
        open={openDeleteConfirmation}
        title={t('confirm.Are you sure?')}
        handleClose={(status) => {
          setOpenDeleteConfirmation(false);
          if (!status || !instance) return;
          setInitialized(false);
          setShowConsole(true)
          clearPath(String(instance.ENV.HOME));
          instance.FS.writeFile(`${instance?.ENV.HOME}/f2_res.ini`, f2_resIni, {encoding: 'utf8'})
          instance.FS.syncfs(false, err => {
            if (err) return instance.print(`Failed to remove data at [${instance.ENV.HOME}]`);
            setHasData(false)
            setInitialized(true);
          });

        }}
        color="error" />
    </Card>
  )
}
