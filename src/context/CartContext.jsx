import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'cart_items'

// Figma sample items — shown the first time only
const defaultItems = [
    {
        id: 'c1',
        img: '/images/tshirt.png',
        name: 'T-shirts with multiple colors, for men and lady',
        nameAr: 'تيشيرتات بألوان متعددة للرجال والنساء',
        seller: 'Artel Market',
        price: 78.99,
        qty: 9,
    },
    {
        id: 'c2',
        img: '/images/backpack.png',
        name: 'T-shirts with multiple colors, for men and lady',
        nameAr: 'تيشيرتات بألوان متعددة للرجال والنساء',
        seller: 'Best factory LLC',
        price: 39.0,
        qty: 3,
    },
    {
        id: 'c3',
        img: '/images/sofa.png',
        name: 'T-shirts with multiple colors, for men and lady',
        nameAr: 'تيشيرتات بألوان متعددة للرجال والنساء',
        seller: 'Artel Market',
        price: 170.5,
        qty: 1,
    },
]

// read the saved cart; first visit → the sample items
const readStored = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : defaultItems
    } catch {
        return defaultItems
    }
}

export function CartProvider({ children }) {
    const [items, setItems] = useState(readStored)

    // save the cart on every change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
        } catch {
            // storage blocked — the cart still works in this session
        }
    }, [items])

    // add a product; if it is already there, add to its quantity
    const addItem = (product, qty = 1) => {
        setItems((list) => {
            const found = list.find((i) => i.id === product.id)

            if (found) {
                return list.map((i) =>
                    i.id === product.id ? { ...i, qty: i.qty + qty } : i
                )
            }

            return [...list, { ...product, qty }]
        })
    }

    const removeItem = (id) => setItems((list) => list.filter((i) => i.id !== id))

    const removeAll = () => setItems([])

    const changeQty = (id, qty) =>
        setItems((list) =>
            list.map((i) => (i.id === id ? { ...i, qty: Number(qty) } : i))
        )

    // replace the whole cart (used to undo a failed request)
    const setAll = (list) => setItems(list)

    // numbers every page can use
    const count = items.reduce((n, i) => n + i.qty, 0)
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)

    return (
        <CartContext.Provider
            value={{ items, addItem, removeItem, removeAll, changeQty, setAll, count, subtotal }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    return useContext(CartContext)
}