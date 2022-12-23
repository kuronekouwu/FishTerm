import {app} from 'electron';
import './security-restrictions';
import {restoreOrCreateWindow} from '/@/mainWindow';

import {Client as SSHClient} from 'ssh2';

import {ipcMain} from 'electron';

import {v4} from 'uuid';

import {SSHClient as SSHProtocolClient} from './service/ssh/client';

import {ConfigLoader} from './service/config';
import {hashpasswordValue} from './utils';
import {CloudflreAccess} from './service/cloudflared/access';
import {CloudflareSSH} from './service/cloudflared/websocket';

import * as fs from 'fs';

const config = new ConfigLoader();
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
ipcMain.on('page.create', (event, type, options) => {
    let configData = config.loadSSH();
    if (!configData) return;
    const info = configData[options.configId];

    event.sender.send('page.create', v4(), {
        type: type,
        options: {
            ...options,
            _value: info
        },
    });
});

ipcMain.on('page.close', (event, pageid) => {
    event.sender.send('page.exit', pageid);
});


/** Config */
ipcMain.on('config.load', (event, pageid) => {
    console.log(process.env)
    const configData = config.loadConfig();
});

/** SSH */
ipcMain.on('ssh.config.create', (event, data) => {
    config.updateSSHInfo(v4(), JSON.parse(data));
    event.sender.send('ssh.config.create');
});

ipcMain.on('ssh.config.load', event => {
    const configData = config.loadSSH();
    event.sender.send('ssh.config.load', configData);
});

ipcMain.on('ssh.config.info', (event, pageid) => {
    let configData = config.loadSSHInfo(pageid);
    // console.log(configData)
    if (!configData) return;
    configData = hashpasswordValue(configData, true);
    event.sender.send('ssh.config.info', configData);
});

ipcMain.on('ssh.config.update', (event, configId, data) => {
    const parsed = JSON.parse(data);
    const _data = hashpasswordValue(parsed, false);
    config.updateSSHInfo(configId, _data);
    event.sender.send('ssh.config.update');
});

ipcMain.on('ssh.session.create', async (event, sessionData, configId, cols, rows) => {
    // Load config
    let configData = config.loadSSH();
    if (!configData) return;
    const info = configData[configId];
    if (!info) return;
    configData = hashpasswordValue(info, true);
    const connection = configData.connection;

    if (connection.type === 1) {
        const cloudflare = new CloudflreAccess();

        cloudflare.events.once('login', url =>
            event.sender.send(`ssh.session.${sessionData}.request`, 'CLOUDFLARE_LOGIN', {
                url: url,
            }),
        );
        cloudflare.events.once('complete', token => {
            console.log('Authenicated success');
        });

        const token = await cloudflare.login(connection.host);

        // Init Websocket
        const wsSSH = new CloudflareSSH(connection.host, token);

        wsSSH.on('ssh.password.request', cb => {
            let type = '';
            const data = {
                username: connection.username,
                password: '',
            };

            if (connection.password.type === 0) {
                data.password = connection.password.value;
                type = 'pwd';
            } else if (connection.password.type === 1) {
                data.password = fs.readFileSync(connection.password.value).toString();
                type = 'cert';
            }
            cb(type, data);
        });
        wsSSH.on('ssh.connect', (client: SSHProtocolClient) => {
            event.sender.send(`ssh.session.${sessionData}.open`);
            const shell = client.shell({
                cols: cols,
                rows: rows,
                terms: 'xterm-color',
            });
            client.monitor()
            // SSH Data
            shell.on('ssh.data', d => {
                // console.log(d)
                event.sender.send(`ssh.session.${sessionData}.data`, d);
            });

            wsSSH.on('websocket.close', () => {
                event.sender.send(`ssh.session.${sessionData}.close`);
            });

            // IPC
            ipcMain.once(`ssh.session.${sessionData}.close`, (e, text) => shell.disconnect());
            ipcMain.on(`ssh.session.${sessionData}.write`, (e, text) => shell.write(text));
            ipcMain.on(`ssh.session.${sessionData}.resize`, (e, cols, rows) => {
                shell.resize(cols, rows);
            });
        });
    } else {
        const client = new SSHClient();
        client
            .on('ready', () => {
                event.sender.send(`ssh.session.${sessionData}.open`);
                client.shell({term: 'xterm-color', cols: cols, rows: rows}, (err, data) => {
                    ipcMain.on(`ssh.session.${sessionData}.write`, (e, text) => data.write(text));
                    ipcMain.once(`ssh.session.${sessionData}.close`, (e, text) => data.close());
                    ipcMain.on(`ssh.session.${sessionData}.resize`, (e, cols, rows) => {
                        // @ts-ignore
                        data.setWindow(cols, rows);
                    });
                    data.on('data', (d: any) => {
                      event.sender.send(`ssh.session.${sessionData}.data`, d);
                    });
                    data.on('exit', () => {
                      ipcMain.removeAllListeners(`ssh.session.${sessionData}.write`)
                      ipcMain.removeAllListeners(`ssh.session.${sessionData}.resize`)

                      event.sender.send(`ssh.session.${sessionData}.close`);
                    });
                });
            })
            .on('timeout', () => {
                // event.sender.send(`app.error`, err.name, err.message);
            })
            .on('error', err => {
                event.sender.send(`app.error`, err.name, err.message);
            })
            .connect({
                host: connection.host,
                port: connection.port,
                username: connection.username,
                password: connection.password.type === 0 ? connection.password.value : undefined,
                privateKey:
                    connection.password.type === 1
                        ? fs.readFileSync(connection.password.value)
                        : undefined,
            });
    }
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
app.whenReady()
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
    app.whenReady()
        .then(() => import('electron-updater'))
        .then(({autoUpdater}) => autoUpdater.checkForUpdatesAndNotify())
        .catch(e => console.error('Failed check updates:', e));
}
