<script lang="ts">
import { defineComponent, toRef, watch, } from "vue";

export default defineComponent({
    props: {
        name: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            default: "text",
        },
        placeholder: {
            type: String,
            default: "",
        },
        modelValue: String
    },
    emits: [
        "update:modelValue"
    ],
    setup(props, context) {
        const name = toRef(props, "name");
        const type = toRef(props, "type");
        const placeholder = toRef(props, "placeholder");


        function onInput(event: Event) {
            const target = event.target as HTMLInputElement;
            context.emit("update:modelValue", target.value);
        }

        return {
            name,
            type,
            placeholder,

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
        <input
            @input="onInput($event)"
            :type="type"
            :value="modelValue"
            :placeholder="placeholder"
            class="mt-1 border-[1px] block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-3 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
        />
    </div>
</template>
