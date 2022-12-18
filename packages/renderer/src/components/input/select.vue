<script lang="ts">
import { defineComponent, toRef, ref, PropType, nextTick } from "vue";

import useClickOutside from "../../plugins/useClickOutside";
const { onClickOutside } = useClickOutside();

interface SelectData {
    name: string;
    value: string | number;
    icon?: string;
    selected?: boolean;
}

export default defineComponent({
    /**
     * Select
     * Format:
     * [{
     *  name: string,
     *  value: string,
     *  icon?: string,
     *  selected?: boolean
     * }]
     */
    props: {
        name: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            default: "text",
        },
        data: {
            type: Array as PropType<SelectData[]>,
            default: [],
        },
        modelValue: String,
    },
    emits: ["update:modelValue"],
    setup(props, context) {
        const name = toRef(props, "name");
        const type = toRef(props, "type");
        const data = toRef(props, "data");

        // Select label
        const SLabel_isOpen = ref(false);
        const SLabel_dataPreview = ref({} as SelectData);

        // Select Box
        const SBox = ref(null);
        const SBox_Size = ref(0);

        // Variable
        let isClickedOutside = false;

        // Function
        function resizeSelectBox() {
            const doc = document.getElementById("selectBox-label");
            if (!doc) return;

            SBox_Size.value = doc.getBoundingClientRect().width;
        }

        function clickSelectTextBox() {
            nextTick(function () {
                if (!isClickedOutside)
                    SLabel_isOpen.value = !SLabel_isOpen.value;
                else isClickedOutside = false;

                if (SLabel_isOpen.value) {
                    resizeSelectBox();
                }
            });
        }

        function SelectItem(data: SelectData) {
            SLabel_isOpen.value = false;

            context.emit("update:modelValue", data.value.toString());
        }

        function isSelected(value: string | number) {
            const isSelectedVal = value === props.modelValue;
            if(isSelectedVal) {
                SLabel_dataPreview.value = data.value.find(item => item.value === value) || {name: "", value: ""};
            }

            return isSelectedVal;
        }

        // Plugins
        onClickOutside(SBox, () => {
            if (SLabel_isOpen.value === true) {
                isClickedOutside = true;
                SLabel_isOpen.value = false;
            }
        });

        // Event
        window.addEventListener("resize", function () {
            resizeSelectBox();
        });

        return {
            // Props
            name,
            type,
            data,

            // Select Box
            SBox,
            SBox_Size,

            // Select label
            SLabel_isOpen,
            SLabel_dataPreview,

            // Function
            SelectItem,
            clickSelectTextBox,
            isSelected,
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

        <div class="relative">
            <span class="inline-block w-full rounded-md shadow-sm">
                <button
                    type="button"
                    @click="clickSelectTextBox"
                    aria-haspopup="listbox"
                    aria-expanded="true"
                    aria-labelledby="listbox-label"
                    id="selectBox-label"
                    class="cursor-pointer relative w-full rounded-md border border-gray-300 bg-white pl-3 pr-10 py-2 text-left focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition ease-in-out duration-150 sm:text-sm sm:leading-5"
                >
                    <div class="flex items-center space-x-3" v-if="SLabel_dataPreview.name">
                        <!-- <vue-feather :type="SLabel_dataPreview.icon" v-if="SLabel_dataPreview.icon" /> -->
                        <span class="block truncate" v-text="SLabel_dataPreview.name" />
                    </div>
                    <div class="flex items-center space-x-3" v-else>
                        <span class="block truncate" v-text="`Please select login type`"  />
                    </div>
                    <span
                        class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"
                    >
                        <!-- <vue-feather type="chevron-down" class="gray-400" /> -->
                    </span>
                </button>
            </span>
            <transition
                enter-active-class="transition duration-150 transform"
                enter-from-class="opacity-0"
                enter-to-class="opacity-100"
                leave-active-class="transition duration-150 transform"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
            >
                <div
                    v-show="SLabel_isOpen"
                    class="fixed mt-1 rounded-md bg-white shadow-lg"
                    :style="`width: ${SBox_Size}px;`"
                >
                    <ul
                        tabindex="-1"
                        ref="SBox"
                        role="listbox"
                        aria-labelledby="listbox-label"
                        aria-activedescendant="listbox-item-3"
                        class="bg-white max-h-56 rounded-md py-1 text-base leading-6 shadow-xs overflow-auto focus:outline-none sm:text-sm sm:leading-5"
                    >
                        <li
                            tabindex="0"
                            @click="SelectItem(d)"
                            id="listbox-item-0"
                            role="option"
                            v-for="(d, idx) in data"
                            :key="idx"
                            class="text-gray-900 select-none relative py-2 pl-3 pr-9 cursor-pointer hover:text-white hover:bg-indigo-600 focus:outline-none focus:text-white focus:bg-indigo-600"
                        >
                            <div class="flex items-center space-x-3">
                                <!-- <vue-feather :type="d.icon" v-if="d.icon" /> -->
                                <span class="block truncate" v-text="d.name" />
                            </div>
                            <span
                                class="absolute inset-y-0 right-0 flex items-center pr-4"
                                :class="{
                                    'font-normal': !isSelected(d.value),
                                    'font-semibold': isSelected(d.value),
                                }"
                            >
                                <!-- <vue-feather
                                    type="check"
                                    v-if="isSelected(d.value)"
                                /> -->
                            </span>
                        </li>
                    </ul>
                </div>
            </transition>
        </div>
    </div>
</template>
