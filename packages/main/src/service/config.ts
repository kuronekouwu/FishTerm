import * as fs from 'fs'
import * as path from 'path'

import { homedir } from 'os'

export class ConfigLoader {
    // Home dir
    private readonly home: string = homedir()
    // Folder
    private readonly folder: string = '.fishssh'
    // Full path
    private folder_path: string = ''
    
    constructor(){
        this.folder_path = this.loadFolder(this.folder)
    }
    
    updateSSHInfo(keyId: string, data: any){
        const configData = this.loadSSH()
        configData[keyId] = data
        this.updateFile('ssh.json', configData)
    }

    deleteSSHInfo(keyId: string){
        const configData = this.loadSSH()
        delete configData[keyId]
        this.updateFile('ssh.json', configData)
    }

    loadSSHInfo(keyId: string){
        try {
            return JSON.parse(this.loadFile('ssh.json', {}))[keyId]
        }catch(e){ 
            return e
        }
    }

    loadSSH(){
        try {
            return JSON.parse(this.loadFile('ssh.json', {}))
        }catch(e){ 
            return e
        }
    }

    loadConfig(){
        try {
            return JSON.parse(this.loadFile('config.json'))
        }catch(e){ 
            return e
        }
    }

    private updateFile(_path: string, data: any = {}){
        const _realpath = path.join(this.folder_path, _path)
        fs.writeFileSync(_realpath, JSON.stringify(data, null, 4))
    }

    private loadFile(_path: string, defaultData: any = {}){
        const _realpath = path.join(this.folder_path, _path)
        if(fs.existsSync(_realpath)) {
            return fs.readFileSync(_realpath).toString()
        }else{
            const raw = JSON.stringify(defaultData)
            fs.writeFileSync(_realpath, raw)
            return raw
        }
    }

    private loadFolder(_path: string){
        const _realpath = path.join(this.home, _path)
        if(!fs.existsSync(_realpath)) fs.mkdirSync(_realpath)
        return _realpath
    }
}