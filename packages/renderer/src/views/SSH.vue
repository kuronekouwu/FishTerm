<script lang="ts" setup>
import {onMounted, defineProps, ref, onBeforeUnmount} from 'vue';
import prettyBytes from 'pretty-bytes';

import Button from '../components/Button.vue';

import {Terminal} from 'xterm';
import {FitAddon} from 'xterm-addon-fit';
import {listenSSH, closePage, closeSSH, openBrowser, resizeSSH, listenMonitor} from '#preload';

const props = defineProps(['page_id', 'screen_size', 'options']);

const term = new Terminal({
    theme: {
        background: '#0f172a',
    },
    fontFamily: 'Fira Code, monospace',
});
const fitAddon = new FitAddon();

const isShow = ref(false);
const terminalHeight = ref();
const windowHeight = ref(window.screen.availHeight);
const termDiv = ref<HTMLDivElement | null>(null);
const monitorDiv = ref<HTMLDivElement | null>(null);
const clientID = ref('');

// Modal loading
const isLoading = ref(true);
const pageStep = ref(0);
const LoginURL = ref('');

// Monitor data
const CPU = ref(0);
const RAM = ref(0);
const DISK = ref(0);
const DOWNLOAD_RX = ref(0);
const UPLOAD_TX = ref(0);

const preloadTerminal = ref<HTMLDivElement | null>(null);

onMounted(async () => {
    terminalHeight.value =
        (window.screen.availHeight - props.screen_size || 0) -
        (monitorDiv.value?.clientHeight || 0);

    // Init window resize
    window.addEventListener(
        'resize',
        () => {
            fitAddon.fit();
            resizeSSH(clientID.value, term.cols, term.rows);
        },
        false,
    );

    setTimeout(() => {
        term.loadAddon(fitAddon);
        // @ts-ignore
        term.open(termDiv.value);
        fitAddon.fit();
    }, 100);

    setTimeout(() => {
        clientID.value = listenSSH({
            configId: props.options.configId || '',
            settings: {
                cols: term.cols,
                rows: term.rows,
            },
            sshOpen: (w: (d: any) => void) => {
                isShow.value = true;
                term.onData(data => {
                    w(data);
                });

                // Listen Monitor
                listenMonitor({
                    sessionId: clientID.value,
                    cpu: (value: any) => {
                        CPU.value = value.used;
                    },
                    ram: (value: any) => {
                        RAM.value = Number(
                            (((value.total - value.avaliable) / value.total) * 100).toFixed(2),
                        );
                    },
                    disk: (value: any) => {
                        DISK.value = Number(
                            (((value.size - value.usage) / value.size) * 100).toFixed(2),
                        );
                    },
                    networks: value => {
                        DOWNLOAD_RX.value = value.rx;
                        UPLOAD_TX.value = value.tx;
                    },
                });
            },
            sshClose: () => {
                closePage(props.page_id);
                term.clear();
            },
            sshData: d => {
                term.write(d);
            },
            sshTimeout: () => {
                isLoading.value = false;
                pageStep.value = 4;
            },
            sshError: (title, desc) => {
                console.error(`Got error SSH`);
            },
            sshRequst: (type, data) => {
                if (type === 'CLOUDFLARE_LOGIN') {
                    pageStep.value = 1;
                    LoginURL.value = data.url;
                }
            },
            sshAuthFailed: () => {
                isLoading.value = false;
                pageStep.value = 3;
            },
        });
    }, 250);
});

onBeforeUnmount(() => {
    closeSSH(clientID.value);
});
</script>

<template>
    <div
        ref="preloadTerminal"
        hidden
    />
    <div
        class="min-h-screen flex items-center justify-center mx-auto z-20 bg-slate-800"
        v-show="!isShow"
    >
        <div
            class="flex items-center justify-center p-10 bg-white dark:dark:bg-slate-900 rounded-lg"
        >
            <div class="space-y-3 text-center">
                <div
                    role="status"
                    v-if="isLoading"
                >
                    <svg
                        class="inline mr-2 w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                            fill="currentColor"
                        />
                        <path
                            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                            fill="currentFill"
                        />
                    </svg>
                    <span class="sr-only">Loading...</span>
                </div>
                <div>
                    <Icon
                        v-if="pageStep === 3 || pageStep === 4"
                        icon="fas fa-times-circle"
                        class="text-5xl text-red-500"
                    />
                </div>
                <div v-if="pageStep === 0">
                    <h1 class="text-black dark:text-white">Connecting to server ....</h1>
                </div>
                <div
                    v-if="pageStep === 1"
                    class="space-y-3"
                >
                    <h1 class="text-black dark:text-white"
                        >Please login cloudflare first to access this SSH</h1
                    >
                    <div>
                        <Button
                            class="!bg-orange-400"
                            @click="openBrowser(LoginURL)"
                        >
                            <Icon icon="fab fa-cloudflare" />
                            <p>Login with cloudflare</p>
                        </Button>
                    </div>
                </div>
                <div v-if="pageStep === 3">
                    <h1 class="text-black dark:text-white">Authenticate failed</h1>
                    <h4 class="text-black dark:text-white text-sm"
                        >Please change password and try again.</h4
                    >
                </div>
                <div v-if="pageStep === 4">
                    <h1 class="text-black dark:text-white">Timeout from server</h1>
                    <h4 class="text-black dark:text-white text-sm"
                        >Please check your host is turn on. (or you forgor paid bill?)</h4
                    >
                </div>
            </div>
        </div>
    </div>
    <div class="bg-[#0f172a] z-10">
        <div
            ref="termDiv"
            :style="{
                'min-height': `${(terminalHeight / windowHeight) * 100}vh !important`,
            }"
        ></div>
        <div
            ref="monitorDiv"
            class="py-1 sticky bottom-0 space-x-3 flex bg-gray-200 z-50 w-full dark:dark:bg-slate-800 text-dark dark:text-white justify-end"
        >
            <div class="flex items-center space-x-1">
                <Icon icon="fas fa-microchip" />
                <p>{{ CPU }}%</p>
            </div>
            <div class="flex items-center space-x-1">
                <Icon icon="fas fa-memory" />
                <p>{{ RAM }}%</p>
            </div>
            <div class="flex items-center space-x-1">
                <Icon icon="fas fa-hard-drive" />
                <p>{{ DISK }}%</p>
            </div>
            <div class="flex items-center space-x-1">
                <Icon icon="fas fa-upload" />
                <p>{{ prettyBytes(UPLOAD_TX) }}</p>
            </div>
            <div class="flex items-center space-x-1">
                <Icon icon="fas fa-download" />
                <p>{{ prettyBytes(DOWNLOAD_RX) }}</p>
            </div>
        </div>
    </div>
</template>

<style>
.xterm .xterm-viewport {
    overflow-y: hidden !important;
}
</style>
