<script lang="ts" setup>
import { reactive, ref } from "vue";
import { listenPage } from '#preload'

import Home from './views/Home.vue';
import SSH from './views/SSH.vue';

let tabIndex = ref('home');
// const terminal: TerminalTabs[] = reactive([]);
const terminal: Record<string, string> = reactive({})

listenPage({
  pageCreate: (id, type, options) => {
    let title = ''
    if(type === "ssh") title = "SSH"
    else if(type === "sftp") title = "SFTP"

    terminal[id] = title
    console.log(terminal)
    tabIndex.value = id
  },
  pageClose: (d) => {
    removeTerminal(d)
    tabIndex.value = 'home';
  }
})


function removeTerminal(key: string){
  delete terminal[key]
}

function selectTab(key: string){
  tabIndex.value = key;
}

</script>

<template>
  <nav class="flex pt-2 mx-auto bg-gray-200">
    <button class="ml-2 space-x-8 w-[250px] mt-1 text-left" @click="selectTab('home')">
      <div :class="`bg-white py-1 ${tabIndex === 'home' ? 'pt-2' : 'mt-1'} rounded-t-lg border-r-3 hover:bg-slate-50 active:bg-stone-100`">
        <p class="ml-2 inline-flex items-center">
          <!-- <vue-feather type="home" size="16" class="mr-2" /> -->
          Home
        </p>
      </div>
    </button>
 
    <button class="ml-2 space-x-8 w-[250px] text-left" v-for="(key, idx) in Object.keys(terminal)" v-bind:key="idx" @click="selectTab(key)">
      <div :class="`bg-white ${tabIndex === key ? 'pt-2 mt-1' : 'mt-2'} py-1 rounded-t-lg border-r-3 hover:bg-slate-50 active:bg-stone-100`">
        <p class="ml-2 inline-flex items-center">
          <button class="flex items-center rounded-lg hover:bg-gray-200 mr-2" @click="removeTerminal(key)">
            <!-- <vue-feather type="x" size="16" /> -->
          </button>
          {{ terminal[key] }}
        </p>
      </div>
    </button>

    <!-- <button class="ml-2 space-x-8 w-[32px] mt-1.5" @click="addTerminal()">
      <div class="bg-white py-1 rounded-t-lg rounded-lg hover:bg-slate-50 active:bg-stone-100">
        <p class="inline-flex items-center">
          <vue-feather type="plus" size="16" />
        </p>
      </div>
    </button> -->
  </nav>

  <Home v-if="tabIndex === 'home'" />
  <SSH v-for="(key, _) in Object.keys(terminal)" :hidden="tabIndex !== key" :page_id="key" />
</template>