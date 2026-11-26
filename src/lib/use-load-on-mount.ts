'use client'

import { useEffect } from 'react'

/** Avoid stale results and duplicate initial loads on React Strict Mode remounts. */
export function useLoadOnMount(load: (signal: AbortSignal) => Promise<void>) {
  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => {
      if (!controller.signal.aborted) void load(controller.signal)
    })
    return () => controller.abort()
  }, [load])
}
