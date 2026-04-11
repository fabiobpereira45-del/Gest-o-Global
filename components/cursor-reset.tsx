"use client"

import { useEffect } from "react"

export function CursorReset() {
    useEffect(() => {
        // Force the body cursor to default on mount and after a short delay
        // as a safety measure against stuck "busy" states from massive network traffic
        const reset = () => {
            if (typeof document !== "undefined") {
                document.body.style.cursor = "default"
                document.documentElement.style.cursor = "default"
            }
        }

        reset()
        const timer = setTimeout(reset, 1000)
        return () => clearTimeout(timer)
    }, [])

    return null
}
