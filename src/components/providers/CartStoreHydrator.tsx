'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/store/cart'

export function CartStoreHydrator() {
  useEffect(() => {
    if (!useCartStore.persist.hasHydrated()) {
      void useCartStore.persist.rehydrate()
    }
  }, [])

  return null
}
