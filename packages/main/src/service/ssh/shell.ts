import EventEmitter from 'eventemitter3';
import type {SSH2Stream} from 'ssh2-streams';

export class SSHShell extends EventEmitter {
    private ssh: SSH2Stream;

    private readonly channel: number = 0;
    private readonly terms: string = 'xterm-color';
    private readonly cols: number = 80;
    private readonly rows: number = 24;
    private readonly MAX_WINDOWS = 2 * 1024 * 1024;
    private readonly MAX_BUFFER = 32 * 1024;

    constructor(
        ssh: SSH2Stream,
        channel: number = 0,
        terms: string = 'vt100',
        cols: number = 80,
        rows: number = 24,
    ) {
        super();

        this.channel = channel;
        this.ssh = ssh;
        this.terms = terms;
        this.cols = cols;
        this.rows = rows;

        // Create session
        this.ssh.session(channel, this.MAX_WINDOWS, this.MAX_BUFFER);
        this.listenEvent();
    }

    private listenEvent() {
        this.ssh.on(`CHANNEL_OPEN_CONFIRMATION:${this.channel}`, () => {
            this.ssh.pty(this.channel, this.rows, this.cols, 640, 480, this.terms, null);
            this.ssh.shell(this.channel, true);
        });

        this.ssh.on('CHANNEL_DATA:0', (e: Buffer) => this.emit('ssh.data', e));

        this.ssh.once('CHANNEL_CLOSE:0', () => {
            this.ssh.disconnect(0);
        });
    }

    disconnect() {
        this.ssh.channelClose(this.channel);
    }

    write(data: string) {
        this.ssh.channelData(this.channel, data);
    }

    resize(cols: number, rows: number) {
        // @ts-ignore
        this.ssh.windowChange(this.channel, rows, cols);
    }
}
