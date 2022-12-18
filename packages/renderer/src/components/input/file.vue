<script lang="ts">
import { defineComponent, toRef, ref } from "vue";

export default defineComponent({
    props: {
        name: {
            type: String,
            required: true,
        },
        text: {
            type: String,
            default: "File",
        },
        modelValue: String,
    },
    emits: [
        "update:modelValue"
    ],
    setup(props, context) {
        const pathPreview = toRef(props, "modelValue");
        const name = toRef(props, "name")
        const text = toRef(props, "text")

        const tempPathPreview = ref("");

        function onInput(event: Event) {
            const target = event.target as HTMLInputElement;
            if(!target.files) return;
            tempPathPreview.value = target.files[0].path;
            context.emit("update:modelValue", target.files[0]);
        }

        return {
            name,
            text,
            pathPreview,

            tempPathPreview,

            onInput,
        };
    },
});
</script>

<template>
    <div class="col-span-12 mb-2">
        <label
            class="block text-md font-medium text-gray-700 mb-2"
            v-text="name"
        />
        <div class="flex items-center justify-center w-full">
            <label
                class="flex flex-col w-full h-32 border-4 border-blue-200 border-dashed hover:bg-gray-100 hover:border-gray-300"
            >
                <div class="flex flex-col items-center justify-center pt-7">
                    <!-- <vue-feather type="upload" class="w-8 h-8 text-gray-400 group-hover:text-gray-600" v-if="!pathPreview || !tempPathPreview" /> -->
                    <!-- <vue-feather type="file" class="w-8 h-8 text-gray-400 group-hover:text-gray-600" v-else /> -->

                    <p class="pt-1 text-sm tracking-wider text-gray-400 group-hover:text-gray-600" v-text="text" />
                    <p class="pt-1 text-sm tracking-wider text-gray-400 group-hover:text-gray-600" v-text="pathPreview ? `(${tempPathPreview})` : undefined" />
                </div>
                
                <input type="file" class="opacity-0" @input="onInput($event)" />
            </label>
        </div>
    </div>
</template>
