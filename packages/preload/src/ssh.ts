import { v4 } from 'uuid';
import { ipcRenderer } from 'electron';

interface OptionSSH {
    configId: string,
    sshOpen: (d: (d: any) => void) => void;
    sshData: (data: any) => void;
    sshClose: () => void;
    settings: {
        rows: number;
        cols: number;
    }
}

export function listenSSH(o: OptionSSH){
    const sessionData = v4();
    ipcRenderer.send('ssh.create', sessionData, o.configId, o.settings.cols, o.settings.rows);

    ipcRenderer.on(`ssh.${sessionData}.open`, (_) => {
        o.sshOpen((data) => {
            ipcRenderer.send(`ssh.${sessionData}.write`, data);
        });
    });
    ipcRenderer.on(`ssh.${sessionData}.data`, (_, d) => {
        o.sshData(d);
    });
    ipcRenderer.on(`ssh.${sessionData}.close`, (_) => {
        o.sshClose();
    });
}