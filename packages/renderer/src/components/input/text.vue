<script lang="ts" setup>
import { defineProps } from "vue";

const props = defineProps(["name","type","placeholder","modelValue", "required"])
const emit = defineEmits(["update:modelValue"])


function onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    emit("update:modelValue", target.value);
}
</script>

<template>
    <div>
        <label
            class="block text-md font-medium text-gray-700 dark:text-white mb-2"
            v-text="props.name"
        />
        <input
            @input="onInput($event)"
            :type="type"
            :value="props.modelValue"
            :placeholder="props.placeholder"
            :required="props.required"
            class="mt-1 border-[1px] block w-full shadow-sm sm:text-sm border-gray-300 dark:border-slate-600 rounded-md px-3 py-3 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-800 dark:text-white focus:outline-none"
        />
    </div>
</template>
