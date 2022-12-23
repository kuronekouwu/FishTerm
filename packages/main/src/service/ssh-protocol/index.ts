import {Socket} from 'net';
import EventEmitter from 'eventemitter3';
import { SSHProtocol } from '../ssh'

export class CloudflareSSH extends EventEmitter {
    private readonly socket: Socket;
    private readonly ssh: SSHProtocol;

    constructor(server: string, token: string) {
        super();
        this.socket = new Socket();
        this.ssh = new SSHProtocol();
        this.init();
    }

    init() {
        this.socket.on("ready", () => this.emit('websocket.ready'))
        this.socket.on("data", (data: Buffer) => {
            this.ssh.write(data);
        });
        this.socket.on("close", () => this.emit("socket.close"))

        // SSH Protocol
        this.ssh.once('ready', () => {
            console.log("READY")
        })
        this.ssh.on('data', (data: Buffer) => {
            this.socket.write(data);
        })
        this.ssh.once('fingerprint', (verify) => {
            return verify(true);
        })
        this.ssh.once('end', () => {
            this.emit('ssh.end');
            this.socket.destroy();
        });
        this.ssh.once('error', n => this.emit('ssh.error', n));
        this.ssh.once('close', () => this.emit('ssh.close'));

        // SSH2 Data
        this.ssh.on("password_request", (type, cb) => this.emit('ssh.password.request', type, cb))
        this.ssh.on("connected", (client) => this.emit("ssh.connect", client))

        // this.websocket.on('open', () => {
        //     this.emit('websocket.ready');
        //     // Websocket
        //     this.websocket.on('message', (data: Buffer) => {
        //         this.ssh.write(data);
        //     });
        //     this.websocket.on('close', () => {
        //         this.emit("websocket.close")
        //     });
            
        //     // SSH Protocol
        //     this.ssh.once('ready', () => {
        //         console.log("READY")
        //     })
        //     this.ssh.on('data', (data: Buffer) => {
        //         this.websocket.send(data);
        //     })
        //     this.ssh.once('fingerprint', (verify) => {
        //         return verify(true);
        //     })
        //     this.ssh.once('end', () => {
        //         this.emit('ssh.end');
        //         this.websocket.close(1000);
        //     });
        //     this.ssh.once('error', n => this.emit('ssh.error', n));
        //     this.ssh.once('close', () => this.emit('ssh.close'));

        //     // SSH2 Data
        //     this.ssh.on("password_request", (type, cb) => this.emit('ssh.password.request', type, cb))
        //     this.ssh.on("connected", (client) => this.emit("ssh.connect", client))
        // })
    }
}
