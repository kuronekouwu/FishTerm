import { watch, unref, onUnmounted } from "vue";

const EVENTS = [
    "mousedown", 
    "touchstart", 
    "pointerdown"
];


function unrefElement(target: any) {
    return unref(target)?.$el ?? unref(target);
}

function useEventListener(target: Window, event: any, listener: any, options: Object) {
    if (!target) return;

    let cleanup = () => {}

    watch(
        () => unref(target),
        el => {
            cleanup();
            if (!el) return;

            // Add event listener
            el.addEventListener(event, listener, options);
            cleanup = () => {
                el.removeEventListener(event, listener, options);
            }
        },
        {
            immediate: true
        }
    )

    onUnmounted(stop);

    return stop;
}

export default function useClickOutside() {
    function onClickOutside(target: any, callback: Function){
        const listener = (event: any) => {
            // Unreferenced element can be removed from DOM
            const el = unrefElement(target);
            if(!el) return;
            if(el === event.target || event.composedPath().includes(el)) return;

            callback(event);
        }

        let disposables = EVENTS.map(_event => {
            useEventListener(window, _event, listener, { capture: true });
        });

        const stop = () => {
            disposables.forEach((stop: any) => {
                try {
                    stop()
                } catch(e) {}
            });
            disposables = [];
        }

        onUnmounted(stop);

        return stop;
    }

    return {
        onClickOutside
    }
}
