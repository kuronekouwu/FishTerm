import {SSH2Stream, utils} from 'ssh2-streams';
import EventEmitter from 'eventemitter3';
import {SSHClient} from './client';

export class SSHProtocol extends EventEmitter {
    private readonly ssh: SSH2Stream;

    constructor() {
        super();
        this.ssh = new SSH2Stream();
        this.init();
    }

    init() {
        this.ssh.once('ready', () => {
            this.ssh.service('ssh-userauth');
            this.emit('ready');
        });
        this.ssh.on('data', (data: Buffer) => this.emit('data', data));
        this.ssh.once('fingerprint', (_, verify) => this.emit('verify', verify));
        this.ssh.once('end', () => this.emit('end'));
        this.ssh.once('error', n => this.emit('error', n));
        this.ssh.once('close', () => this.emit('close'));
        this.ssh.on('SERVICE_ACCEPT', (name: string) => {
            if (name === 'ssh-userauth') {
                this.emit(
                    'password_request',
                    (type: string, data: {username: string; password: string}) => {
                        if (type === 'pwd') {
                            this.ssh.authPassword(data.username, data.password);
                        } else if (type === 'cert') {
                            let certKey = utils.parseKey(data.password);
                            if (Array.isArray(certKey)) certKey = certKey[0];

                            // @ts-ignore
                            this.ssh.authPK(data.username, certKey);

                            this.ssh.once('USERAUTH_PK_OK', () => {
                                // @ts-ignore
                                this.ssh.authPK(data.username, certKey, function (buf, cb) {
                                    // @ts-ignore
                                    cb(certKey?.sign(buf));
                                });
                            });
                        }
                    },
                );
            }
        });

        this.ssh.on('USERAUTH_SUCCESS', () => {
            this.ssh.removeAllListeners('USERAUTH_FAILURE');
            this.ssh.removeAllListeners('SERVICE_ACCEPT');
            this.ssh.removeAllListeners('USERAUTH_PK_OK');

            this.emit('connected', new SSHClient(this.ssh));
        });

        this.ssh.on('USERAUTH_FAILURE', e => {
            this.ssh.removeAllListeners('USERAUTH_SUCCESS');
            this.ssh.removeAllListeners('SERVICE_ACCEPT');
            this.ssh.removeAllListeners('USERAUTH_PK_OK');
            this.emit('auth_failed');
        });
    }

    write(data: Buffer) {
        this.ssh.write(data);
    }
}
