import {createApp} from 'vue';
import App from '/@/App.vue';
import './style.css'
import 'xterm/css/xterm.css'
import '../assets/style.css'
import 'sweetalert2/dist/sweetalert2.css'

import FontAwesome from './font-awesome'

createApp(App)
.component('Icon', FontAwesome)
.mount('#app');
