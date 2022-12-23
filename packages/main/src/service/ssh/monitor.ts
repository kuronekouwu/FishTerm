import EventEmitter from 'eventemitter3';
import type { SSH2Stream } from 'ssh2-streams';

export class SSHShellMonitor extends EventEmitter {
    private ssh: SSH2Stream

    private readonly offset: number = 0
    private readonly eventName: string[] = ["cpu","ram","network","disk"]
    private readonly MAX_WINDOWS = 2 * 1024 * 1024 
    private readonly MAX_BUFFER = 32 * 1024

    private readonly commands: Record<string, string> = {
        cpu: "top -b -d1 -n1|grep -i \"Cpu(s)\"",
        ram: "cat /proc/meminfo",
        network: "cat /proc/net/dev",
        disk: "df"
    }

    constructor(
        ssh: SSH2Stream, 
        offset: number = 0
    ){
        super()

        this.offset = offset
        this.ssh = ssh

        // Create session [RAM,CPU,DISK]
        for(let i = offset; i < offset + this.eventName.length; i++){
            const offsetReal = i - offset
            this.ssh.session(offsetReal, this.MAX_WINDOWS, this.MAX_BUFFER)
            this.listenEvent(offsetReal, this.eventName[offsetReal])
        }
    }

    private listenEvent(channel: number, event: string){
        this.ssh.on(`CHANNEL_OPEN_CONFIRMATION:${channel}`, () => {
            this.ssh.shell(channel, true)

            // Then start command
            const interval = setInterval(() => {
                console.log()
            }, 1000)
        })

        this.ssh.on(`CHANNEL_DATA:${channel}`, (e: Buffer) => {})
    }
}