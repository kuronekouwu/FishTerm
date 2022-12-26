import type {SSH2Stream} from 'ssh2-streams';
import {SSHShellMonitor} from './monitor';
import {SSHShell} from './shell';

interface IShellOptions {
    terms: string;
    cols: number;
    rows: number;
}

export class SSHClient {
    private _ssh: SSH2Stream;

    constructor(ssh: SSH2Stream) {
        this._ssh = ssh;
    }

    shell(o: IShellOptions) {
        return new SSHShell(this._ssh, 0, o.terms || 'vt100', o.cols || 80, o.rows || 24);
    }

    monitor() {
        return new SSHShellMonitor(this._ssh, 20);
    }

    disconnect() {
        this._ssh.disconnect();
    }
}
