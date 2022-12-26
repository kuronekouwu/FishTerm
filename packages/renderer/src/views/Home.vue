<script lang="ts" setup>
// Components
import Container from '../components/Container.vue';
import Card from '../components/Card.vue';
import Title from '../components/Title.vue';
import Button from '../components/Button.vue';
import DialogVue from '../components/Dialog.vue';
// Dialog
import SettingDialog from '../components/dialog/settings.vue';

// Main
import {onMounted, reactive, ref} from 'vue';
import {createPage, loadSSHConfigAll, listenSSHConfigs} from '#preload';

interface IConfig {
    title: string;
    type: number;
    image: string;
    connection: {
        host: string;
        type: number;
        port: number;
        username: string;
        password: {
            type: number;
            value: string;
        };
    };
}

const showModal = ref(false);
let config: Record<string, IConfig> = reactive({});
const settingId = ref('');
const actionType = ref('add');

function addTerminal() {
    actionType.value = 'add';
    showModal.value = true;
}

function openSettings(configId: string) {
    actionType.value = 'edit';
    settingId.value = configId;
    showModal.value = true;
}

onMounted(() => {
    listenSSHConfigs({
        sshPageAll: (d, spicalRemoveArray) => {
            for (const key of Object.keys(d)) {
                // @ts-ignore
                config[key] = d[key];
            }
            // Remove data old
            for (const val of spicalRemoveArray) {
                delete config[val];
            }
        },
        createSSHConfig: () => {
            loadSSHConfigAll();
        },
    });

    loadSSHConfigAll();
});
</script>

<template>
    <Container>
        <div class="flex justify-between">
            <Title
                class="dark:text-white text-dark"
                title="SSH list"
                icon="terminal"
            />
            <Button
                class="mr-2 mb-2"
                @click="addTerminal"
            >
                <Icon icon="fas fa-plus" />
                Add terminal
            </Button>
        </div>
        <div class="space-y-3 overflow-y-auto h-[800px] my-7 scrollbar">
            <Card
                v-for="(key, idx) in Object.keys(config)"
                :key="idx"
            >
                <template #default>
                    <img
                        class="h-24 w-24 rounded-full mx-6"
                        :src="config[key].image"
                        v-if="config[key].image"
                    />
                    <div
                        v-else
                        class="text-slate-800 dark:text-white text-7xl flex items-center mx-6"
                    >
                        <Icon icon="fas fa-terminal" />
                    </div>
                    <div class="text-left">
                        <h1
                            class="text-lg font-bold dark:text-white text-dark"
                            v-text="config[key].title"
                        />
                        <h2
                            class="text-purple-500"
                            v-text="
                                `${config[key].connection.username}@${config[key].connection.host}${
                                    config[key].connection.port !== 22
                                        ? `:${config[key].connection.port}`
                                        : ''
                                }`
                            "
                        />
                        <div class="flex mt-3 pt-0 space-x-2">
                            <Button @click="createPage('ssh', {configId: key})">
                                <Icon icon="fas fa-plug" />
                                <p>Connect</p>
                            </Button>
                            <Button @click="openSettings(key)">
                                <Icon icon="fas fa-cogs" />
                                <p>Settings</p>
                            </Button>
                        </div>
                    </div>
                </template>
            </Card>
        </div>
    </Container>
    <DialogVue
        :show="showModal"
        @close="showModal = false"
    >
        <SettingDialog
            :configId="settingId"
            :actionType="actionType"
            @closePage="showModal = false"
        />
    </DialogVue>
</template>
