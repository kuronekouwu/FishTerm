<script lang="ts">
import {defineComponent, toRef} from 'vue';

export default defineComponent({
    props: {
        title: {
            type: String,
            required: true,
        },
        icon: {
            type: String,
            required: false,
        },
    },
    setup(props) {
        const title = toRef(props, 'title');
        const icon = toRef(props, 'icon');

        return {
            icon,
            title,
        };
    },
});
</script>

<template>
    <div class="inline-flex items-center">
        <!-- <vue-feather :type="icon" class="mr-2" v-if="icon" /> -->
        <h1
            class="ml-1 text-2xl font-bold text-gray-700 dark:text-white"
            v-text="title"
        />
    </div>
</template>
