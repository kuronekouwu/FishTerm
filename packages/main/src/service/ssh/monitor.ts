import EventEmitter from 'eventemitter3';

import type {SSH2Stream} from 'ssh2-streams';

import networkFilter from './monitor/network';
import ramFilter from './monitor/ram';
import CPUFilter from './monitor/cpu';
import diskFilter from './monitor/disk';

export class SSHShellMonitor extends EventEmitter {
    private ssh: SSH2Stream;
    private monitors: Record<string, NodeJS.Timer> = {};

    private readonly eventName: string[] = ['cpu', 'ram', 'network', 'disk'];
    private readonly MAX_WINDOWS = 2 * 1024 * 1024;
    private readonly MAX_BUFFER = 32 * 1024;

    private readonly commands: Record<string, any[]> = {
        cpu: ['top -b -d1 -n1|grep -i "Cpu(s)"', CPUFilter],
        ram: ['cat /proc/meminfo', ramFilter],
        network: [
            'NEW_RX=$( cat /sys/class/net/eth0/statistics/rx_bytes );   NEW_TX=$( cat /sys/class/net/eth0/statistics/tx_bytes ); echo "RX:$((NEW_EX)) TX:$((NEW_TX))"',
            networkFilter,
        ],
        disk: ['df | grep "/$"', diskFilter],
    };

    constructor(ssh: SSH2Stream, offset: number = 5) {
        super();
        this.ssh = ssh;

        // Create session [RAM,CPU,DISK]
        for (let i = 1; i <= offset + this.eventName.length; i++) {
            const eventName = this.eventName[i - 1];
            if (!eventName) continue;
            this.ssh.session(i, this.MAX_WINDOWS, this.MAX_BUFFER);
            this.listenEvent(i, eventName);
        }
    }

    closeEventMonitor() {
        for (const [index, key] of this.eventName.entries()) {
            console.log(index, key);
            clearInterval(this.monitors[key]);
            this.removeAllListeners(key);
            // Close connection
            this.ssh.channelClose(index + 1);
        }
    }

    private listenEvent(channel: number, event: string) {
        const [cmd, filter] = this.commands[event];
        this.ssh.on(`CHANNEL_OPEN_CONFIRMATION:${channel}`, () => {
            this.ssh.shell(channel, false);

            // Then start command
            this.monitors[event] = setInterval(() => {
                this.ssh.channelData(channel, `${cmd}\n`);
            }, 1000);

            // this.ssh.once(`CHANNEL_CLOSE`, (e: Buffer) => {
            //     clearInterval(interval)
            // })
        });

        this.ssh.on(`CHANNEL_DATA:${channel}`, (e: Buffer) => {
            if (!filter) return;
            const value = filter(e);
            this.emit(event, value);
        });
    }
}
