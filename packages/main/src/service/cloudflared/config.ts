import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

const noop = () => {};

function createFilename(url: string, kid: string, type: 'token') {
    return `${url}-${kid}-${type}`;
}

function checkTokenIsExpired(token: string) {
    const [header, payload, hash] = token.split('.');
    const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    if (Date.now() >= data.exp * 1000) return true;
    return false;
}

function getHomeCloudflared() {
    const home = os.homedir();
    const _path = path.join(home, '.cloudflared');
    if (!fs.existsSync(_path)) fs.mkdir(_path, noop);
    return _path;
}

function removeOldToken(path: string) {
    fs.unlinkSync(path);
}

export function storeToken(url: string, kid: string, token: string) {
    const _path = path.join(getHomeCloudflared(), createFilename(url, kid, 'token'));
    fs.writeFileSync(_path, token, 'utf-8');
}

export function getTokenOld(url: string, kid: string) {
    // Check file if exist
    const _path = path.join(getHomeCloudflared(), createFilename(url, kid, 'token'));
    if (fs.existsSync(_path)) {
        const token = fs.readFileSync(_path).toString();
        if (!checkTokenIsExpired(token)) {
            return token;
        } else {
            removeOldToken(_path);
        }
    }

    return null;
}
