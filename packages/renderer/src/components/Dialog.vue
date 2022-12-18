<script lang="ts">
import { defineComponent, ref, watch } from "vue";

import useClickOutside from "../plugins/useClickOutside";
const { onClickOutside } = useClickOutside();

import Button from "./Button.vue";


const props = {
    show: {
        type: Boolean,
        default: false,
    },
};

export default defineComponent({
    components: { Button },
    name: "ModalDialog",
    props,
    emits: [
        'close'
    ],
    setup(props, context) {
        const showModal = ref(false);
        const modal = ref(null);

        watch(
            () => props.show,
            (show) => {
                showModal.value = show;
            }
        );

        function closeModal() {
            context.emit('close');
            showModal.value = false;
        }

        // Plugin
        onClickOutside(modal, () => {
            if (showModal.value === true) {
                closeModal();
            }
        })

        return {
            closeModal,
            showModal,
            
            modal
        };
    },
});
</script>

<template>
    <teleport to="body">
        <transition
            enter-active-class="transition ease-out duration-200 transform"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition ease-in duration-200 transform"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                ref="modal-backdrop"
                class="modal-backdrop fixed bg-black w-full h-full bg-opacity-20 inset-0 max-h-screen"
                v-show="showModal"
            >
                <div
                    class="flex items-start justify-center min-h-screen pt-24 max-h-screen sm:pt-3 md:pt-5 lg:pt-[16] text-center"
                >
                        <transition
                            enter-active-class="transition ease-out duration-300 transform"
                            enter-from-class="opacity-0 translate-y-10 scale-95"
                            enter-to-class="opacity-100 translate-y-0 scale-100"
                            leave-active-class="ease-in duration-200"
                            leave-from-class="opacity-100 translate-y-0 scale-100"
                            leave-to-class="opacity-0 translate-y-10 translate-y-0 scale-95"
                        >
                            <div
                                class=" sm:max-h-screen overflow-y-auto relative bg-white rounded-lg text-left shadow-xl p-8 w-[80%] lg:w-1/2"
                                role="dialog"
                                ref="modal"
                                aria-modal="true"
                                v-show="showModal"
                                aria-labelledby="modal-headline"
                            >
                                <button
                                    class="absolute right-2 top-2"
                                    @click="closeModal"
                                >
                                    <!-- <vue-feather type="x" /> -->
                                </button>
                                <slot />
                            </div>
                        </transition>
                </div>
            </div>
        </transition>
    </teleport>
</template>
