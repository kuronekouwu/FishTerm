<script lang="ts" setup>
import {onMounted, reactive, ref,watch} from 'vue';
import {listenPage, loadConfig, applicationListen} from '#preload';

import Home from './views/Home.vue';
import SSH from './views/SSH.vue';
import Swal from 'sweetalert2';

import Dialog from './components/Dialog.vue';
import Info from './components/dialog/info.vue';

let tabIndex = ref('home');
// const terminal: TerminalTabs[] = reactive([]);
const terminal: Record<string, {title: string; options: any}> = reactive({});

const tab = ref<HTMLDivElement | null>(null);
let tabHeight = ref(0);

function removeTerminal(key: string) {
    delete terminal[key];
    tabIndex.value = 'home'
}

function selectTab(key: string) {
    tabIndex.value = key;
}

const showModal = ref(false);

onMounted(() => {
    loadConfig();
    // Page
    listenPage({
        pageCreate: (id, type, options) => {
            let title = options._value.connection.username + '@' + options._value.connection.host;

            tabHeight.value = tab.value?.clientHeight || 0;

            terminal[id] = {
                title: title,
                options: options,
            };
            tabIndex.value = id;
        },
        pageClose: d => {
            removeTerminal(d);
            tabIndex.value = 'home';
        },
    });

    applicationListen({
        error: (title, message) => {
            Swal.fire({
                icon: 'error',
                title: title,
                text: message,
            });
        },
    });
});

watch(tabIndex, (n: string, o: string) => {
    document.getElementsByTagName("title")[0].innerText = terminal[n]?.title || "Home"
})
</script>

<template>
    <nav
        class="flex  mx-auto bg-gray-200 z-50 w-full dark:dark:bg-slate-800 justify-between"
        ref="tab"
    >
        <div>
            <button
                class="ml-2 space-x-8 w-[250px] mt-1 text-left"
                @click="selectTab('home')"
            >
                <div
                    :class="`bg-white py-1 ${
                        tabIndex === 'home' ? 'pt-2 mt-1' : 'mt-2'
                    } rounded-t-lg border-r-3 hover:bg-slate-50 active:bg-stone-100 dark:hover:bg-slate-700 dark:bg-slate-500`"
                >
                    <p class="ml-2 inline-flex items-center">
                        Home
                    </p>
                </div>
            </button>

            <button
                class="ml-2 space-x-8 w-[250px] text-left"
                v-for="(key, idx) in Object.keys(terminal)"
                v-bind:key="idx"
                @click="selectTab(key)"
            >
                <div
                    :class="`bg-white ${
                        tabIndex === key ? 'pt-2 mt-1' : 'mt-2'
                    } py-1 rounded-t-lg border-r-3 hover:bg-slate-50 active:bg-stone-100`"
                >
                    <div class="flex justify-between">
                        <p class="ml-2 inline-flex items-center">
                            {{ terminal[key].title }}
                        </p>
                        <button
                            class="flex items-center rounded-full hover:bg-gray-200 px-2 mr-3 py-1"
                            @click="removeTerminal(key)"
                        >
                            <Icon icon="fas fa-close" />
                        </button>
                    </div>
                </div>
            </button>
        </div>
        <div class="flex items-center mr-5">
            <button @click="showModal = true">
                
                <Icon icon="fas fa-info-circle" class="text-white" />
            </button>
        </div>
    </nav>

    <main class="dark:bg-[#121212] min-h-screen">
        <div :hidden="tabIndex !== 'home'">
            <Home />
        </div>
        <div
            v-for="(key, _) in Object.keys(terminal)"
            :hidden="tabIndex !== key"
            :key="key"
        >
            <SSH
                :page_id="key"
                :options="terminal[key].options"
                :screen_size="tabHeight"
            />
        </div>
    </main>
    <Dialog
        :show="showModal"
        @close="showModal = false"
    >
        <Info />
    </Dialog>
</template>
