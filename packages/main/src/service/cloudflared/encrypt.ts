import {box} from 'tweetnacl';

function generateBase64Padding(data: Uint8Array): string {
    return Buffer.from(data).toString('base64').replaceAll('+', '-').replaceAll('/', '_');
}

export function decryptData(token: string, peerKey: string, secretKey: string) {
    // Convert token to buffer
    const buf = Buffer.from(token, 'base64');

    // Create nonce and key
    const nonce = Buffer.alloc(24);
    const _token = Buffer.alloc(buf.length - 24);

    // Copy it
    buf.copy(nonce, 0, 0, 24);
    buf.copy(_token, 0, 24, buf.length);

    // Decrypt
    const result = box.open(
        _token,
        nonce,
        Buffer.from(peerKey, 'base64'),
        Buffer.from(secretKey, 'base64'),
    );
    return result;
}

export function generateKeyPair() {
    const key = box.keyPair();
    return {
        publicKey: generateBase64Padding(key.publicKey),
        privateKey: generateBase64Padding(key.secretKey),
    };
}
