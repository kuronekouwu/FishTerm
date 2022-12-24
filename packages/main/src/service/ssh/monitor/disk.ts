const REGEX = (/(\s+)/gm)

export default function diskFilter(raw: Buffer){
    /**
     * Disk Filter
     * Creator: M-307
     */
    const diskS = raw.toString().split(REGEX)
    return {
        name: diskS[0],
        size: Number(diskS[2]),
        avaliable: Number(diskS[4]),
        usage: Number(diskS[6]),
        usage_percentage: Number(diskS[8].replace("%","")),
        path: diskS[10]
    }
} 