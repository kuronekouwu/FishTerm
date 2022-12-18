<script lang="ts" setup>
import { onMounted, defineProps } from 'vue';

import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { listenSSH, closePage } from '#preload'

const props = defineProps(['page_id'])

const term = new Terminal()
const fitAddon = new FitAddon()

onMounted(() => {
    fitAddon.activate(term)
    
     // @ts-ignore
    term.open(document.getElementById(props.page_id))
    fitAddon.fit();

    listenSSH({
        configId: props.page_id,
        settings :{
            cols: term.cols,
            rows: term.rows
        },
        sshOpen: (w: (d: any) => void) => {
            term.onData((data) => {
                w(data)
            });
        },
        sshClose: () => {
            closePage(props.page_id)
        },
        sshData: (d) => {
            term.write(d)
        }
    })
})
</script>

<template>
    <div class="min-h-screen bg-black">
        <div :id="props.page_id" class="min-h-[95vh] h-[85%] min-w-full"></div>
    </div>
</template>

<style>
.xterm .xterm-viewport {
    overflow-y: hidden !important;
}
</style>