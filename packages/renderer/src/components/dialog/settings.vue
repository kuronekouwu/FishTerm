<script lang="ts" setup>
import {loadSSHConfigInfo, updateSSHConfig, createSSHConfig, removeSSHConfig} from '#preload';

import Title from '../Title.vue';
import Text from '../input/text.vue';
import Select from '../input/select.vue';
import File from '../input/file.vue';
import Button from '../Button.vue';

import Dialog from '../Dialog.vue';

import {onMounted, reactive, ref} from 'vue';

const props = defineProps(['configId', 'actionType']);
const emit = defineEmits(['closePage']);

const previewPasswordData = ref('');
const previousPasswordType = ref(0);
const previousPasswordData = ref('');

const previewConnectionData = ref('');
const previousConnectionType = ref(0);
const previousConnectionData = ref('');

const showModal = ref(false);

const config = reactive({
    data: {
        title: '',
        image: '',
        connection: {
            host: '',
            port: 22,
            type: 0,
            username: '',
            password: {
                type: 0,
                value: '',
            },
        },
    },
});

const selectAuthType = ref([
    {
        name: 'Password',
        value: 0,
        icon: 'fas fa-key',
    },
    {
        name: 'Certificate File',
        value: 1,
        icon: 'fas fa-certificate',
    },
]);

const selectConnectionType = ref([
    {
        name: 'SSH Normal',
        value: 0,
        icon: 'fas fa-terminal',
    },
    {
        name: 'Cloudflare Tunnel',
        value: 1,
        icon: 'fab fa-cloudflare',
    },
]);

function updateSSH(e: Event) {
    e.preventDefault();
    // Replace it

    config.data.connection.password.value = previewPasswordData.value;
    config.data.connection.host = previewConnectionData.value;

    if (props.actionType === 'edit') {
        updateSSHConfig(props.configId, JSON.stringify(config.data), () => {
            emit('closePage');
        });
    } else if (props.actionType === 'add') {
        createSSHConfig(JSON.stringify(config.data), () => {
            emit('closePage');
        });
    }
}

function deleteConfig() {
    removeSSHConfig(props.configId, () => {
        showModal.value = false;
        emit('closePage');
    })
}

function updatePrivateKey(path: string) {
    previewPasswordData.value = path;
}

function onUpdatePasswordSelect(value: number) {
    if (value != previousPasswordType.value) previewPasswordData.value = '';
    else previewPasswordData.value = previousPasswordData.value;
}

function onUpdateConnectionSelect(value: number) {
    if (value != previousConnectionType.value) previewConnectionData.value = '';
    else previewConnectionData.value = previewConnectionData.value;
}

onMounted(() => {
    if (props.actionType === 'edit') {
        loadSSHConfigInfo(props.configId, (e: any) => {
            config.data = reactive(e);
            // Host
            previousConnectionType.value = e.connection.type;
            previewConnectionData.value = e.connection.host;
            previousConnectionData.value = e.connection.host;

            // Password
            previousPasswordType.value = e.connection.password.type;
            previewPasswordData.value = e.connection.password.value;
            previousPasswordData.value = e.connection.password.value;
        });
    }
});
</script>

<template>
    <Title
        title="Setting"
        icon="settings"
    />
    <hr class="m-3" />
    <form
        @submit="updateSSH"
        class="space-y-3"
    >
        <Text
            v-model="config.data.title"
            name="Name host"
            placeholder="Ex. My awsome SSH server 😎"
            :required="true"
        />
        <Select
            @onChange="onUpdateConnectionSelect"
            v-model="config.data.connection.type"
            name="Connection Type"
            :data="selectConnectionType"
        />
        <div
            class="grid grid-cols-2 gap-4"
            v-if="config.data.connection.type === 0"
        >
            <Text
                v-model="previewConnectionData"
                name="SSH Host"
                placeholder="localhost"
                :required="true"
            />
            <Text
                v-model.number="config.data.connection.port"
                name="SSH Port"
                placeholder="22"
                :required="true"
            />
        </div>
        <div v-if="config.data.connection.type === 1">
            <Text
                v-model="previewConnectionData"
                name="URL Cloudflare Tunnel"
                placeholder="ssh.example.dev"
                :required="true"
            />
        </div>
        <Text
            v-model="config.data.connection.username"
            name="Username"
            placeholder="root"
            :required="true"
        />
        <Select
            v-model="config.data.connection.password.type"
            @onChange="onUpdatePasswordSelect"
            name="Login type"
            :data="selectAuthType"
        />

        <!-- Login type (Password) -->
        <Text
            v-model="previewPasswordData"
            type="password"
            name="Password"
            v-if="config.data.connection.password.type === 0"
            :required="true"
        />
        <!-- Login type (Private key) -->
        <File
            :path="previewPasswordData"
            @updatePath="updatePrivateKey"
            name="Certificate"
            text="Certificate File (id_rsa, cert.pem, etc.)"
            v-if="config.data.connection.password.type === 1"
        />

        <Button
            class="mr-2 mt-3 mb-2 w-full"
            type="submit"
        >
            {{ props.actionType === 'add' ? 'Add' : 'Update' }} terminal
        </Button>
        <Button
            v-if="props.actionType !== 'add'"
            @click="showModal = true"
            :class="`!bg-red-500`"
            class="mr-2 mt-3 mb-2 w-full"
            type="button"
        >
            Delete terminal
        </Button>
        <Dialog
            :show="showModal"
            @close="showModal = false"
        >
            <div>
                <p class="text-black dark:text-white">Are you sure delete this config?</p>
                <div class="space-y-1">
                    <Button
                        v-if="props.actionType !== 'add'"
                        :class="`!bg-red-500`"
                        class="mr-2 mt-3 mb-2 w-full"
                        type="button"
                        @click="deleteConfig"
                    >
                        Delete it!
                    </Button>
                    <Button
                        class="mr-2 mt-3 mb-2 w-full"
                        type="submit"
                        @click="showModal = false"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </Dialog>
    </form>
</template>
