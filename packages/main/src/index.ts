import {app} from 'electron';
import './security-restrictions';
import {restoreOrCreateWindow} from '/@/mainWindow';

import {ipcMain} from 'electron';

import {v4} from 'uuid';

import {SSHClient as SSHProtocolClient} from './service/ssh/client';

import {ConfigLoader} from './service/config';
import {hashpasswordValue} from './utils';
import {CloudflreAccess} from './service/cloudflared/access';
import {CloudflareSSH} from './service/cloudflared/websocket';

import * as fs from 'fs';
import { SSH } from './service/ssh-protocol';

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
    const configData = config.loadConfig();
});

/** SSH */
ipcMain.on('ssh.config.create', (event, data) => {
    config.updateSSHInfo(v4(), JSON.parse(data));
    event.sender.send('ssh.config.create');
});

ipcMain.on('ssh.config.load', (event, speicalRemove) => {
    const configData = config.loadSSH();
    event.sender.send('ssh.config.load', configData, speicalRemove);
});

ipcMain.on('ssh.config.info', (event, pageid) => {
    let configData = config.loadSSHInfo(pageid);
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

ipcMain.on('ssh.config.remove', (event, configId) => {
    config.deleteSSHInfo(configId);
    event.sender.send('ssh.config.remove', configId);
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

            // SSH Data
            shell.on('ssh.data', d => {
                event.sender.send(`ssh.session.${sessionData}.data`, d);
            });

            wsSSH.on('websocket.close', () => {
                event.sender.send(`ssh.session.${sessionData}.close`);
            });

            // SSH Monitor
            const monitor = client.monitor()
            monitor.on("cpu", (value) => {
                event.sender.send(`ssh.session.${sessionData}.monitor`, "cpu", value);
            })
            monitor.on("ram", (value) => {
                event.sender.send(`ssh.session.${sessionData}.monitor`, "ram", value);
            })
            monitor.on("network", (value) => {
                event.sender.send(`ssh.session.${sessionData}.monitor`, "network", value);
            })
            monitor.on("disk", (value) => {
                event.sender.send(`ssh.session.${sessionData}.monitor`, "disk", value);
            })

            // IPC
            ipcMain.once(`ssh.session.${sessionData}.close`, (e, text) => shell.disconnect());
            ipcMain.on(`ssh.session.${sessionData}.write`, (e, text) => shell.write(text));
            ipcMain.on(`ssh.session.${sessionData}.resize`, (e, cols, rows) => {
                shell.resize(cols, rows);
            });
        });
    } else {
        const ssh = new SSH()
        ssh.on('ssh.password.request', cb => {
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
        ssh.on('ssh.auth.failed', () => {
            event.sender.send(`ssh.session.${sessionData}.auth.failed`);
        })
        ssh.on('ssh.timeout', () => {
            console.log("Timeout from server")
            event.sender.send(`ssh.session.${sessionData}.timeout`);
        })

        ssh.on('ssh.connect', (client: SSHProtocolClient) => {
            event.sender.send(`ssh.session.${sessionData}.open`);
            const shell = client.shell({
                cols: cols,
                rows: rows,
                terms: 'xterm-color',
            });
            const monitor = client.monitor()
            // SSH Data
            shell.on('ssh.data', d => {
                event.sender.send(`ssh.session.${sessionData}.data`, d);
            });
            ssh.on('socket.close', () => {
                ipcMain.removeAllListeners(`ssh.session.${sessionData}.write`)
                ipcMain.removeAllListeners(`ssh.session.${sessionData}.resize`)
                event.sender.send(`ssh.session.${sessionData}.close`);
            });

            // SSH Monitor
            monitor.on("cpu", (value) => {
                event.sender.send(`ssh.session.${sessionData}.monitor`, "cpu", value);
            })
            monitor.on("ram", (value) => {
                event.sender.send(`ssh.session.${sessionData}.monitor`, "ram", value);
            })
            monitor.on("network", (value) => {
                event.sender.send(`ssh.session.${sessionData}.monitor`, "network", value);
            })
            monitor.on("disk", (value) => {
                event.sender.send(`ssh.session.${sessionData}.monitor`, "disk", value);
            })

            // IPC
            ipcMain.once(`ssh.session.${sessionData}.close`, (e, text) => shell.disconnect());
            ipcMain.on(`ssh.session.${sessionData}.write`, (e, text) => shell.write(text));
            ipcMain.on(`ssh.session.${sessionData}.resize`, (e, cols, rows) => {
                shell.resize(cols, rows);
            });
        })

        ssh.listen(connection.host, connection.port)
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
