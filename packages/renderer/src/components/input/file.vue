<script lang="ts" setup>
import { defineComponent, toRef, ref, defineProps, watch, onMounted} from "vue";

const props = defineProps(["name","text","path", "modalValue"])
const emit = defineEmits(["updatePath"])

const previewFile = ref('')

function onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    if(!target.files) return;
    emit("updatePath", target.files[0].path);
}

watch(() => props.path, (n: string, o: string) => {
    previewFile.value = n
})

onMounted(() => {
    previewFile.value = props.path || 'Please upload file'
})

</script>

<template>
    <div class="col-span-12 mb-2">
        <label
            class="block text-md font-medium text-gray-700 dark:text-white mb-2"
            v-text="props.name"
        />
        <div class="flex items-center justify-center w-full">
            <label
                class="flex flex-col w-full h-32 border-4 border-blue-200 dark:border-slate-500 dark:hover:bg-slate-900 border-dashed hover:bg-gray-100 hover:border-gray-300"
            >
                <div class="flex flex-col items-center justify-center pt-7">
                    <!-- <vue-feather type="upload" class="w-8 h-8 text-gray-400 group-hover:text-gray-600" v-if="!pathPreview || !tempPathPreview" /> -->
                    <!-- <vue-feather type="file" class="w-8 h-8 text-gray-400 group-hover:text-gray-600" v-else /> -->

                    <p class="pt-1 text-sm tracking-wider text-gray-400 group-hover:text-gray-600" v-text="props.text" />
                    <p class="pt-1 text-sm tracking-wider text-gray-400 group-hover:text-gray-600" v-text="previewFile" />
                </div>
                
                <input type="file" class="opacity-0" @input="onInput($event)" />
            </label>
        </div>
    </div>
</template>
