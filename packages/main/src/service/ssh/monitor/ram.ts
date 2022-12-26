const REGEX = /^(\S+):\s+(\d+).*$/gm;

export default function ramFilter(raw: Buffer) {
    /**
     * Memory filter
     * Creator: Maythiwat
     * Monified: M-307
     */
    const resp = {
        total: 0,
        free: 0,
        avaliable: 0,
    };
    const key = {
        MemTotal: 'total',
        MemFree: 'free',
        MemAvailable: 'avaliable',
    };
    const keyArr = Object.keys(key);
    let result: RegExpExecArray | null;
    while ((result = REGEX.exec(raw.toString())) !== null) {
        let [keyVal, value] = result.slice(1, result.length);
        if (!keyArr.includes(keyVal)) continue;
        // @ts-ignore
        resp[key[keyVal]] = Number(value);
    }

    return resp;
}
