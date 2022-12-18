<script lang="ts" setup>

// Components
import Container from "../components/Container.vue";
import Card from "../components/Card.vue";
import Title from "../components/Title.vue";
import Button from "../components/Button.vue";
import DialogVue from "../components/Dialog.vue";
// Dialog
import SettingDialog from "../components/settings/settings.vue";
// Main
import { reactive, ref } from "vue";
import { createPage } from '#preload'

interface IConfig {
    name: string;
    images: string;
    ssh: {
        host: string;
        port: number;
        username: string;
        password: string;
        privateKey: string;
    }
}

const showModal = ref(false);
const config: IConfig[] = reactive([{
    name: "M-307 x nSys",
    images: "https://cdn.discordapp.com/app-icons/669039828846772284/9b955f12fd8bddfeefafcd044d0d0006.png?size=256",
    ssh: {
        host: "127.0.0.1",
        port: 22,
        username: "root",
        password: "",
        privateKey: "C:\\Users\\Admin\\.ssh\\id_rsa"
    }
}]);

</script>

<template>
    <Container>
        <div class="flex justify-between">
            <Title title="SSH list" icon="terminal" />
            <Button
                class="mr-2 mb-2"
                @click="showModal = !showModal"
            >
                <!-- <vue-feather type="plus" class="mr-2" size="16" /> -->
                Add terminal
            </Button>
        </div>
        <Card v-for="(data, idx) in config" :key="idx">
            <template #tags>
                <span class="items-center px-4 py-2 rounded-full text-white bg-red-500 font-semibold text-sm flex align-center w-max  ">
                    <!-- <vue-feather type="x" class="mr-2" /> -->
                    Disconnected
                </span>
            </template>
            <template #default>
                <img
                    class="h-24 w-24 rounded-full mx-6 mr-6"
                    :src="data.images"
                />
                <div class="text-left">
                    <h1 class="text-lg font-bold" v-text="data.name" />
                    <h2 class="text-purple-500"  v-text="`${data.ssh.username}@${data.ssh.host}`" /> 
                    <div class="flex mt-3 pt-0">
                        <Button
                            class="mr-2 mb-2"
                            @click="createPage('ssh', {id: '1'})"
                        >
                            <!-- <vue-feather type="settings" class="mr-2" size="16" /> -->
                            Connect
                        </Button>
                        <Button
                            class="mr-2 mb-2"
                            @click="showModal = !showModal"
                        >
                            <!-- <vue-feather type="settings" class="mr-2" size="16" /> -->
                            Setting
                        </Button>
                    </div>
                </div>
            </template>
        </Card>
    </Container>
    <DialogVue :show="showModal" @close="showModal = false">
        <SettingDialog />
    </DialogVue>
</template>
