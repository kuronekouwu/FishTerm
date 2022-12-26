const REGEX = /(\s+)/gm;

export default function CPUFilter(raw: string) {
    /**
     * CPU Filter
     * Creator: M-307
     */
    const CPUS = raw.toString().split(REGEX);
    return {
        used: Number(CPUS[2]),
    };
}
