export const base16 = {
    decode: (hex: string) => {
        return Buffer.from(hex, 'hex').toString('utf8');
    },
    encode: (str: string) => {
        return Buffer.from(str).toString('hex');
    },
};
