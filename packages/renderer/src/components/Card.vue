<script lang="ts">
// Components
import Container from "../components/Container.vue";

import { defineComponent } from "vue";

export default defineComponent({
    components: {
        Container,
    },
});
</script>

<template>
    <div class="shadow-lg flex bg-white rounded-lg p-6 leading-normal relative">
        <div class="absolute top-2 right-2">
            <slot name="tags" />
        </div>
        <slot />
    </div>
</template>
