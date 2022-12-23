import axios , { AxiosInstance } from 'axios';
import EventEmitter from 'eventemitter3';
import * as urlParser from 'url';
import { getTokenOld, storeToken } from './config';

import { generateKeyPair, decryptData } from './encrypt';

export class CloudflreAccess{
    // Event
    events: EventEmitter

    // Axios
    private transfer: AxiosInstance;
    private api: AxiosInstance;

    // User settings
    private user_retry: number = 10
    
    // Tool settings
    private serverURL: string = "https://login.cloudflareaccess.org"
    private loginPath: string = "/cdn-cgi/access/cli"
    private transferPath: string = "/transfer"
    private userAgent: string = "cloudflared/2022.10.0"

    constructor(polling: number = 60000, max_retry: number = 10){
        this.events = new EventEmitter()

        this.transfer = axios.create({
            baseURL: this.serverURL,
            timeout: polling
        })
        this.api = axios.create({
            timeout: 15000
        })
        this.user_retry = max_retry
    }

    async login(url: string){
        const kid = await this.getKidInfo(`https://${url}`)
        if(typeof kid === "string") this.events.emit("error", "KID_NOT_FOUND", "Cannot get 'kid' in query")
        const oldToken = getTokenOld(kid.appURL, kid.kid)
        if(oldToken){
            this.events.emit("complete", oldToken)
            return oldToken
        }

        // Create login request
        const login = this.generateLogin(kid.appURL)
        // Start transfer 
        this.events.emit("login", login.url)
        const token = await this.transferStart(login.publicKey, login.privateKey)
        this.events.emit("complete", token)

        // Store token
        storeToken(kid.appURL, kid.kid, token.app_token)

        return token.app_token
    }

    generateLogin(url: string){
        const key = generateKeyPair()
        const queryPath = new URLSearchParams({
            redirect_url: `https://${url}?token=${key.publicKey}`,
            edge_token_transfer: 'true',
            send_org_token: 'true',
            token: key.publicKey
        })

        return {
            url: `https://${url}${this.loginPath}?${queryPath.toString()}`,
            ...key
        }
    }

    async getKidInfo(url: string){
        return this.api.head(url, {
            headers: this.getHeader()
        }).then((resp) => {
            // Get redirect data
            const response_first = resp.request.res
            // Get query
            const query = urlParser.parse(response_first.responseUrl, true).query

            if(!query.kid) throw new Error("Cannot get 'kid' in query")
            return {
                kid: query.kid,
                appURL: response_first.headers["cf-access-domain"]
            }
        }).catch((e) => e.message) 
    }

    private getHeader(){
        return {
            "User-Agent": this.userAgent
        }
    }

    async transferStart(publicKey: string, secretKey: string){
        let retry = 0;
        for(let i = 0; i < this.user_retry; i++){
            try {
                const token = await this.transfer.get(`${this.transferPath}/${publicKey}`, {
                    headers: this.getHeader()
                })

                // Decrypt token
                const result = decryptData(token.data, token.headers["service-public-key"] || "", secretKey)
                if(!result) return null;
                return JSON.parse(Buffer.from(result).toString())
            }catch(e){
                if(retry >= this.user_retry){
                    return null
                }

                retry += 1
            }
        }
    }
}