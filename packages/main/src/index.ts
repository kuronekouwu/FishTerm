import {app} from 'electron';
import './security-restrictions';
import {restoreOrCreateWindow} from '/@/mainWindow';

import { Client as SSHClient } from 'ssh2';

import { ipcMain } from 'electron';

import { v4 } from 'uuid';

import { ConfigLoader } from './service/config';
import { hashpasswordValue } from './utils';

// import { base16 } from '../../preload/src/base16'

import * as fs from 'fs'

const config = new ConfigLoader()

/**
 * Shortcut
 */

// app.on("ready", () => {
//   globalShortcut.register("CommandOrControl+W", () => {
//       if()
//   })
// })

/**
 * Prevent electron from running multiple instances.
 */
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}
app.on('second-instance', restoreOrCreateWindow);

/** Page */
ipcMain.on('page.create', (event, type, options) =>{
  event.sender.send('page.create', v4(), {
    type: type,
    options: options,
  });
});

ipcMain.on('page.close', (event, pageid) =>{
  event.sender.send('page.exit', pageid);
});

/** Config */
ipcMain.on('config.load', (event, pageid) =>{
  const configData = config.loadConfig()
});

/** SSH */
ipcMain.on('ssh.config.create', (event, data) =>{
  // console.log(data)
  // return;

  config.updateSSHInfo(v4(), JSON.parse(data))
  event.sender.send("ssh.config.create")
});

ipcMain.on('ssh.config.load', (event) =>{
  const configData = config.loadSSH()
  event.sender.send("ssh.config.load", configData)
});

ipcMain.on('ssh.config.info', (event, pageid) =>{
  let configData = config.loadSSHInfo(pageid)
  // console.log(configData)
  if(!configData) return;
  configData = hashpasswordValue(configData, true)
  event.sender.send("ssh.config.info", configData)
});

ipcMain.on('ssh.config.update', (event, configId, data) =>{
  const parsed = JSON.parse(data)
  const _data = hashpasswordValue(parsed, false)
  config.updateSSHInfo(configId, _data)
  event.sender.send("ssh.config.update")
});

ipcMain.on('ssh.session.create', (event, sessionData, configId, cols, rows) =>{
  // Load config
  let configData = config.loadSSH()
  if(!configData) return;
  const info = configData[configId]
  if(!info) return;
  configData = hashpasswordValue(info, true)
  const connection = configData.connection

  const client = new SSHClient();
  client.on('ready', () => {
    event.sender.send(`ssh.session.${sessionData}.open`);
    client.shell({term: 'xterm-color', cols: cols, rows: rows},(err, data) => {
      ipcMain.on(`ssh.session.${sessionData}.write`, (e, text) => data.write(text));
      ipcMain.once(`ssh.session.${sessionData}.close`, (e, text) => data.close());
      data.on('data', (d: any) => event.sender.send(`ssh.session.${sessionData}.data`, d));
      data.on('exit', () => {
        event.sender.send(`ssh.session.${sessionData}.close`)
      });
    });
  }).on("timeout", () => {
    event.sender.send(`ssh.session.${sessionData}.timeout`);
  }).on("error", (err) => {
    event.sender.send(`ssh.session.${sessionData}.error`, err.name, err.message);
  }).connect({
    host: connection.host,
    port: connection.port,
    username: connection.username,
    password: connection.password.type === 0 ? connection.password.value : undefined,
    privateKey: connection.password.type === 1 ? fs.readFileSync(connection.password.value) : undefined
  });
});  


/**
 * Disable Hardware Acceleration to save more system resources.
 */
app.disableHardwareAcceleration();

/**
 * Shout down background process if all windows was closed
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * @see https://www.electronjs.org/docs/latest/api/app#event-activate-macos Event: 'activate'.
 */
app.on('activate', restoreOrCreateWindow);

/**
 * Create the application window when the background process is ready.
 */
app
  .whenReady()
  .then(restoreOrCreateWindow)
  .catch(e => console.error('Failed create window:', e));

/**
 * Install Vue.js or any other extension in development mode only.
 * Note: You must install `electron-devtools-installer` manually
 */
// if (import.meta.env.DEV) {
//   app.whenReady()
//     .then(() => import('electron-devtools-installer'))
//     .then(({default: installExtension, VUEJS3_DEVTOOLS}) => installExtension(VUEJS3_DEVTOOLS, {
//       loadExtensionOptions: {
//         allowFileAccess: true,
//       },
//     }))
//     .catch(e => console.error('Failed install extension:', e));
// }

/**
 * Check for new version of the application - production mode only.
 */
if (import.meta.env.PROD) {
  app
    .whenReady()
    .then(() => import('electron-updater'))
    .then(({autoUpdater}) => autoUpdater.checkForUpdatesAndNotify())
    .catch(e => console.error('Failed check updates:', e));
}
