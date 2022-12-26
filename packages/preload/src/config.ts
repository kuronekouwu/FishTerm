import {ipcRenderer} from 'electron';

interface OptionPage {
    pageCreate: (...args: any[]) => void;
    pageClose: (...args: any[]) => void;
}
export function listenPage(o: OptionPage) {
    ipcRenderer.on('page.create', (_, uuid, options) => {
        o.pageCreate(uuid, options.type || null, options.options);
    });
    ipcRenderer.on('page.exit', (_, uuid, options) => {
        o.pageClose(uuid, options);
    });
}

export function loadConfig() {
    ipcRenderer.send('config.load');
}

export function closePage(page: string) {
    ipcRenderer.send('page.close', page);
}
