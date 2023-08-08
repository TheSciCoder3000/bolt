import { RefObject, useEffect } from "react";


export const useContextMenu = <T extends HTMLElement = HTMLElement> (
    ref: RefObject<T>,
    handler: (event: Event) => void
) => {
    useEffect(() => {
        const listener = (event: Event) => {
            const el = ref?.current
            if (!el || el.contains((event?.target as Node) || null)) return
            handler(event)
        }

        const keyHandler = (e: KeyboardEvent) => {
            if (e.key == "Escape") handler(e);
        }

        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);
        document.addEventListener("keydown", keyHandler);

        () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
            document.removeEventListener("keydown", keyHandler);
        }
    }, [ref, handler])
}