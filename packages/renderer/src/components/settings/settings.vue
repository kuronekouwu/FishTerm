<script lang="ts">
import { base16 } from "#preload"

import Title from "../Title.vue";
import Text from "../input/text.vue";
import Select from "../input/select.vue"
import File from "../input/file.vue"
import Button from "../Button.vue";

import { defineComponent, reactive, ref, watch } from "vue";

export default defineComponent({
    name: "SettingDialog",
    components: {
        Title,

        Text,
        Select,
        File,
        Button
    },
    setup() {
        const val = ref("tests");

        // Settings
        const config = reactive({
            name: "M-307 Server",
            host: "root@127.0.0.1",
            loginType: '1',
            password: "864736D64656E6275747E655",
            privateKey: "",
        })

        const selectAuthType = ref([{
            name: "Password",
            value: '1',
            icon: "key"
        },
        {
            name: "Certificate File",
            value: '2',
            icon: "file-text"
        }])

        // Function
        const passwordPreview = base16.decode(config.password.split("").reverse().join(""));

        return {
            config,

            passwordPreview,
            selectAuthType,
        };
    }
});
</script>

<template>
    <Title title="Setting" icon="settings" />
    <hr class="m-3" />
    <Text v-model="config.name" name="Name host" placeholder="Ex. My awsome SSH server 😎" />
    <Text v-model="config.host" name="SSH Host"  placeholder="root@localhost" />
    <Select v-model="config.loginType" name="Login type" :data="selectAuthType" />
    <Text v-model="passwordPreview" type="password" name="Password" v-if="config.loginType === '1'" />
    <File v-model="config.privateKey" name="Certificate" text="Certificate File (id_rsa, cert.pem, etc.)" v-if="config.loginType === '2'" />
    <Button class="mr-2 mt-3 mb-2 w-full">
        <!-- <vue-feather type="plus" class="mr-2" size="16" /> -->
        Add terminal
    </Button>
</template>
