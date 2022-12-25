import {WebSocket} from 'ws';
import EventEmitter from 'eventemitter3';
import { SSHProtocol } from '../ssh'

export class CloudflareSSH extends EventEmitter {
    private readonly websocket: WebSocket;
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
                ssh.write(data);
            });
            this.websocket.on('close', () => {
                this.emit("websocket.close")
            });
            
            // SSH Protocol
            ssh.once('ready', () => {
                console.log(`Connected to server ${this.websocket.url}`)
            })
            ssh.on('data', (data: Buffer) => {
                this.websocket.send(data);
            })
            ssh.once('verify', (verify) => {
                return verify(true);
            })
            ssh.once('end', () => {
                this.emit('ssh.end');
                this.websocket.close(1000);
            });
            ssh.once('ssh.error', n => this.emit('ssh.error', n));
            ssh.once(("auth_failed"), () => {
                this.emit("ssh.auth.failed")
            })
            
            ssh.once('close', () => this.emit('ssh.close'))

            // SSH2 Data
            ssh.on("password_request", (type, cb) => this.emit('ssh.password.request', type, cb))
            ssh.on("connected", (client) => this.emit("ssh.connect", client))
        })
    }
}
