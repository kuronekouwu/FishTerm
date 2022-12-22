import { ipcRenderer } from 'electron'

interface OptionApplication {
    error: (text: string, reason: string) => void
}

export function applicationListen(o: OptionApplication){
    ipcRenderer.on("app.error", (_, t, d) => o.error(t, d))
}