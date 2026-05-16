import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  productId: string
  variantId?: string
  name: string
  variantName?: string
  price: number
  image?: string
  quantity: number
}

interface CartState {
  items: CartItem[]
  hasHydrated: boolean
  setHasHydrated: (hasHydrated: boolean) => void
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,

      setHasHydrated: (hasHydrated) => {
        set({ hasHydrated })
      },

      addItem: (item) => {
        const { items } = get()
        const id = item.variantId
          ? `${item.productId}-${item.variantId}`
          : item.productId

        const existingItem = items.find((i) => i.id === id)

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.id === id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          })
        } else {
          set({
            items: [...items, { ...item, id }],
          })
        }
      },

      removeItem: (id) => {
        set({
          items: get().items.filter((i) => i.id !== id),
        })
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }

        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        })
      },

      clearCart: () => {
        set({ items: [] })
      },

      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        )
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
    }),
    {
      name: 'bepa-cart',
      skipHydration: true,
      onRehydrateStorage: () => (state, error) => {
        if (!error) {
          state?.setHasHydrated(true)
        }
      },
    }
  )
)
