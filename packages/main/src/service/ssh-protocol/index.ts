import {Socket} from 'net';
import EventEmitter from 'eventemitter3';
import { SSHProtocol } from '../ssh'

export class SSH extends EventEmitter {
    private readonly socket: Socket;

    constructor() {
        super();
        this.socket = new Socket();
        this.init();
    }

    init() {
        this.socket.on("connect", () => {
            const ssh = new SSHProtocol();
            this.emit('socket.ready')
            this.socket.on("data", (data: Buffer) => {
                ssh.write(data);
            });
            this.socket.on("close", () => this.emit("socket.close"))
    
            // SSH Protocol
            ssh.on('data', (data: Buffer) => {
                this.socket.write(data);
            })
            ssh.once('verify', (verify) => {
                return verify(true);
            })
            ssh.once('end', () => {
                this.emit('ssh.end');
                this.socket.destroy();
            });
            ssh.once('error', n => {
                this.emit('ssh.error', n)
            });
            ssh.once(("auth_failed"), () => {
                this.emit("ssh.auth.failed")
            })
            ssh.once('close', () => this.emit('ssh.close'));
    
            // SSH2 Data
            ssh.on("password_request", (type, cb) => this.emit('ssh.password.request', type, cb))
            ssh.on("connected", (client) => this.emit("ssh.connect", client))
        });
        this.socket.once("timeout", () => {
            this.emit("ssh.timeout")
            this.socket.destroy()
        })
    }

    listen(host: string, port: number = 22){
        this.socket.setTimeout(1000 * 10);
        this.socket.connect({
            host: host,
            port: port
        })

    }
}
