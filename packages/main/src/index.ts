import {app} from 'electron';
import './security-restrictions';
import {restoreOrCreateWindow} from '/@/mainWindow';

import { Client as SSHClient } from 'ssh2';

import { ipcMain } from 'electron';

import { v4 } from 'uuid';


const pageData = [];

/**
 * Prevent electron from running multiple instances.
 */
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}
app.on('second-instance', restoreOrCreateWindow);

ipcMain.on('page.create', (event, type, options) =>{
  event.sender.send('page.create', v4(), {
    type: type,
    options: options,
  });
});

ipcMain.on('page.close', (event, pageid) =>{
  event.sender.send('page.exit', pageid);
});


ipcMain.on('ssh.create', (event, sessionData, configId, cols, rows) =>{
  const client = new SSHClient();

  client.on('ready', () => {
    console.log('READY TO CONNECT');
    event.sender.send(`ssh.${sessionData}.open`, null);
    console.log(cols, rows);
    client.shell({term: 'xterm-color', cols: cols, rows: rows},(err, data) => {
      ipcMain.on(`ssh.${sessionData}.write`, (e, text) => data.write(text));
      data.on('data', (d: any) => event.sender.send(`ssh.${sessionData}.data`, d));
      data.on('exit', () => event.sender.send(`ssh.${sessionData}.close`));
    });
  }).connect({
    host: '154.208.140.168',
    username: 'ubuntu',
    password: 'll11LL',
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
