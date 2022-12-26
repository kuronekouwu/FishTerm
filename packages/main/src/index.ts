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
import {SSH} from './service/ssh-protocol';

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
            _value: info,
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

    // Init session
    const sessionEvent = `ssh.session.${sessionData}`;

    // Clear all event
    const clearAllEvent = () => {
        const events = [
            'write',
            'resize',
            'password.request',
            'auth.failed',
            'timeout',
            'open',
            'data',
            'close',
            'monitor',
        ];

        for (const key of events) ipcMain.removeAllListeners(`${sessionEvent}.${key}`);
    };

    // Send into user event
    const sendEvent = (name: string, ...args: any[]) => {
        if (event.sender.isDestroyed()) return;
        event.sender.send(`${sessionEvent}.${name}`, ...args);
    };

    if (connection.type === 1) {
        const cloudflare = new CloudflreAccess();

        cloudflare.events.once('login', url =>
            sendEvent(`request`, 'CLOUDFLARE_LOGIN', {
                url: url,
            }),
        );

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
        wsSSH.on('ssh.auth.failed', () => sendEvent(`auth.failed`));
        wsSSH.on('ssh.timeout', () => sendEvent(`timeout`));

        wsSSH.on('ssh.connect', (client: SSHProtocolClient) => {
            sendEvent(`open`);
            const shell = client.shell({
                cols: cols,
                rows: rows,
                terms: 'xterm-color',
            });

            // SSH Data
            shell.on('ssh.data', d => {
                sendEvent(`data`, d);
            });

            wsSSH.on('websocket.close', () => {
                monitor.closeEventMonitor();
                clearAllEvent();
                sendEvent(`close`);
            });

            // SSH Monitor
            const monitor = client.monitor();
            monitor.on('cpu', value => {
                sendEvent(`monitor`, 'cpu', value);
            });
            monitor.on('ram', value => {
                sendEvent(`monitor`, 'ram', value);
            });
            monitor.on('network', value => {
                sendEvent(`monitor`, 'network', value);
            });
            monitor.on('disk', value => {
                sendEvent(`monitor`, 'disk', value);
            });

            // IPC
            ipcMain.once(`${sessionEvent}.close`, () => client.disconnect());
            ipcMain.on(`${sessionEvent}.write`, (_, text) => shell.write(text));
            ipcMain.on(`${sessionEvent}.resize`, (_, cols, rows) => {
                shell.resize(cols, rows);
            });
        });
    } else {
        const ssh = new SSH();
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
        ssh.on('ssh.auth.failed', () => sendEvent(`auth.failed`));
        ssh.on('ssh.timeout', () => sendEvent(`timeout`));

        ssh.on('ssh.connect', (client: SSHProtocolClient) => {
            sendEvent(`open`);
            const shell = client.shell({
                cols: cols,
                rows: rows,
                terms: 'xterm-color',
            });

            // SSH Data
            shell.on('ssh.data', d => {
                sendEvent(`data`, d);
            });
            ssh.on('socket.close', () => {
                monitor.closeEventMonitor();
                clearAllEvent();
                sendEvent(`close`);
            });

            // SSH Monitor
            const monitor = client.monitor();
            monitor.on('cpu', value => {
                if (!event.sender.isDestroyed()) sendEvent(`monitor`, 'cpu', value);
            });
            monitor.on('ram', value => {
                sendEvent(`monitor`, 'ram', value);
            });
            monitor.on('network', value => {
                sendEvent(`monitor`, 'network', value);
            });
            monitor.on('disk', value => {
                sendEvent(`monitor`, 'disk', value);
            });

            // IPC
            ipcMain.once(`${sessionEvent}.close`, () => client.disconnect());
            ipcMain.on(`${sessionEvent}.write`, (_, text) => shell.write(text));
            ipcMain.on(`${sessionEvent}.resize`, (_, cols, rows) => {
                shell.resize(cols, rows);
            });
        });

        ssh.listen(connection.host, connection.port);
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
