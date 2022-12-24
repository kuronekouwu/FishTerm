import { v4 } from 'uuid';
import { ipcRenderer } from 'electron';

interface OptionSSH {
    configId: string,
    sshOpen: (d: (d: any) => void) => void;
    sshData: (data: any) => void;
    sshClose: () => void;
    sshTimeout: () => void;
    sshError: (title: string, desc: string) => void;
    sshRequst: (type: string, data: any) => void;
    sshAuthFailed: () => void;
    settings: {
        rows: number;
        cols: number;
    }
}

interface OptionSSHMonitor {
    sessionId: string;
    cpu: (d: any) => void;
    ram: (d: any) => void;
    disk: (d: any) => void;
    networks: (d: any) => void;
}

interface OptionSSHConfig {
    sshPageAll: (d: any, s: string[]) => void
    createSSHConfig: () => void
}

export function loadSSHConfigAll(speicalRemove: string[] = []){
    ipcRenderer.send("ssh.config.load", speicalRemove)
}

export function listenSSHConfigs(o: OptionSSHConfig){
    ipcRenderer.on("ssh.config.load", (_, d, speicalRemove) => o.sshPageAll(d, speicalRemove))
    ipcRenderer.on("ssh.config.create", (_) => o.createSSHConfig())
}

export function loadSSHConfigInfo(config: string, cb: (d: any[]) => void){
    ipcRenderer.send("ssh.config.info", config)
    ipcRenderer.once("ssh.config.info", (_, d) => cb(d))
}

export function createSSHConfig(data: any, cb: () => void){
    ipcRenderer.send("ssh.config.create", data)
    ipcRenderer.once("ssh.config.create", (_) => cb())
}

export function updateSSHConfig(config: string, data: any, cb: () => void){
    ipcRenderer.send("ssh.config.update", config, data)
    ipcRenderer.once("ssh.config.update", (_) => {
        loadSSHConfigAll()
        cb()
    })
}

export function removeSSHConfig(config: string, cb: () => void){
    ipcRenderer.send("ssh.config.remove", config)
    ipcRenderer.once("ssh.config.remove", (_, configId: string) => {
        loadSSHConfigAll([configId])
        cb()
    })
}

export function closeSSH(sessionId: string){
    ipcRenderer.send(`ssh.session.${sessionId}.close`);
}

export function resizeSSH(sessionId: string, cols: number, rows: number){
    ipcRenderer.send(`ssh.session.${sessionId}.resize`, cols, rows);
}

export function listenMonitor(o: OptionSSHMonitor){
    const sessionId = o.sessionId;
    const cb = {
        cpu: o.cpu,
        ram: o.ram,
        disk: o.disk,
        network: o.networks
    }
    ipcRenderer.on(`ssh.session.${sessionId}.monitor`, (_, type, data) => {
        // @ts-ignore
        cb[type]?.(data)
    });

}

export function listenSSH(o: OptionSSH){
    const sessionData = v4();
    ipcRenderer.send('ssh.session.create', sessionData, o.configId, o.settings.cols, o.settings.rows);

    ipcRenderer.on(`ssh.session.${sessionData}.request`, (_, type, data) => {
        o.sshRequst(type, data)
    });

    ipcRenderer.on(`ssh.session.${sessionData}.open`, (_) => {
        o.sshOpen((data) => {
            ipcRenderer.send(`ssh.session.${sessionData}.write`, data);
        });
    });
    ipcRenderer.on(`ssh.session.${sessionData}.auth.failed`, (_) => {
        o.sshAuthFailed()
    })
    ipcRenderer.on(`ssh.session.${sessionData}.data`, (_, d) => {
        o.sshData(d);
    });
    ipcRenderer.on(`ssh.session.${sessionData}.close`, (_) => {
        // Close all event
        ipcRenderer.removeAllListeners(`ssh.session.${sessionData}.close`)
        ipcRenderer.removeAllListeners(`ssh.session.${sessionData}.request`)
        ipcRenderer.removeAllListeners(`ssh.session.${sessionData}.open`)
        ipcRenderer.removeAllListeners(`ssh.session.${sessionData}.data`)
        ipcRenderer.removeAllListeners(`ssh.session.${sessionData}.timeout`)
        ipcRenderer.removeAllListeners(`ssh.session.${sessionData}.error`)
        ipcRenderer.removeAllListeners(`ssh.session.${sessionData}.monitor`)
        ipcRenderer.removeAllListeners(`ssh.session.${sessionData}.auth.failed`)

        o.sshClose();
    });
    ipcRenderer.on(`ssh.session.${sessionData}.timeout`, (_) => {
        o.sshTimeout();
    });
    ipcRenderer.on(`ssh.session.${sessionData}.error`, (_, title, message) => {
        o.sshError(title, message)
    });

    return sessionData
}