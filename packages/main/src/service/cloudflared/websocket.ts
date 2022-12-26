import {WebSocket} from 'ws';
import EventEmitter from 'eventemitter3';
import {SSHProtocol} from '../ssh';

export class CloudflareSSH extends EventEmitter {
    private readonly websocket: WebSocket;
    private isClosed: boolean = false;

    constructor(server: string, token: string) {
        super();
        this.websocket = new WebSocket(`wss://${server}`, {
            headers: {
                'Cf-Access-Token': token,
            },
        });
        this.init();
    }

    init() {
        this.websocket.on('open', () => {
            const ssh = new SSHProtocol();
            this.emit('websocket.ready');
            // Websocket
            this.websocket.on('message', (data: Buffer) => {
                if (!this.isClosed) ssh.write(data);
            });
            this.websocket.on('close', () => {
                this.emit('websocket.close');
            });

            // SSH Protocol
            ssh.once('ready', () => console.log(`Connected to server ${this.websocket.url}`));
            ssh.on('data', (data: Buffer) => {
                if (!this.isClosed) this.websocket.send(data);
            });
            ssh.once('error', n => this.emit('ssh.error', n));
            ssh.once('auth_failed', () => this.emit('ssh.auth.failed'));

            ssh.once('verify', verify => {
                return verify(true);
            });

            ssh.once('close', () => {
                this.isClosed = true;
                this.websocket.close(1000);
                this.emit('ssh.close');
            });
            ssh.once('end', () => {
                this.isClosed = true;
                this.emit('ssh.end');
                this.websocket.close(1000);
            });

            // SSH2 Data
            ssh.on('password_request', (type, cb) => this.emit('ssh.password.request', type, cb));
            ssh.on('connected', client => this.emit('ssh.connect', client));
        });
    }
}
