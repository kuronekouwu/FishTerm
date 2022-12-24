const REGEX = /RX:(\d+) TX:(\d+)/;

let RX = 0;
let TX = 0;

export default function networkFilter(raw: Buffer) {
    /**
     * Network filter
     * Creator: Maythiwat and M-307
     */

    const resp = {
        rx: 0,
        tx: 0,
    };

    const data = raw.toString().split(REGEX);

    const tx_val =  Number(data[2])
    const rx_val = Number(data[1]);
    if(RX > 0) resp.rx = rx_val - RX;
    if(TX > 0) resp.tx = tx_val - TX

    RX = rx_val;
    TX = tx_val;

    return resp;
}
