import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Newsletter from '../components/Newsletter'
import Footer from '../components/Footer'
import Promo from '../components/Promo'
import api from '../service/api'
import { useLanguage } from '../context/LanguageContext'
import './Cart.css'

// Data source — false: Figma sample data, true: live API
const USE_API = false

// ===== Figma sample data — English + Arabic =====
const initialItems = [
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

// saved items now have an id, so we can move them
const initialSaved = [
    { id: 's1', img: '/images/tablet.png', price: 99.5, seller: 'Artel Market', name: 'GoPro HERO6 4K Action Camera - Black', nameAr: 'كاميرا GoPro HERO6 4K - سوداء' },
    { id: 's2', img: '/images/phone3.png', price: 99.5, seller: 'Artel Market', name: 'GoPro HERO6 4K Action Camera - Black', nameAr: 'كاميرا GoPro HERO6 4K - سوداء' },
    { id: 's3', img: '/images/watch.png', price: 99.5, seller: 'Artel Market', name: 'GoPro HERO6 4K Action Camera - Black', nameAr: 'كاميرا GoPro HERO6 4K - سوداء' },
    { id: 's4', img: '/images/laptop.png', price: 99.5, seller: 'Artel Market', name: 'GoPro HERO6 4K Action Camera - Black', nameAr: 'كاميرا GoPro HERO6 4K - سوداء' },
]

const benefits = [
    { icon: 'lock', title: 'cart.b1Title' },
    { icon: 'chat', title: 'cart.b2Title' },
    { icon: 'local_shipping', title: 'cart.b3Title' },
]

// ===== Server data helpers =====
const ORIGIN = 'https://training.tamkeen-dev.com/tamkeenstore/public'

const fullImage = (value) => {
    if (value && typeof value === 'object') {
        value = value.url || value.path || value.image || ''
    }
    if (!value) return '/images/tshirt.png'
    if (String(value).startsWith('http')) return value
    return ORIGIN + '/' + String(value).replace(/^\/+/, '')
}

const extractList = (raw) => {
    if (Array.isArray(raw)) return raw
    if (Array.isArray(raw?.data)) return raw.data
    if (Array.isArray(raw?.data?.data)) return raw.data.data
    if (Array.isArray(raw?.data?.items)) return raw.data.items
    if (Array.isArray(raw?.items)) return raw.items
    return []
}

// each cart row usually has the product inside it
const normalizeCartItem = (c) => {
    const p = c.product ?? c

    return {
        id: c.id ?? c.cart_id ?? p.id,
        productId: p.id ?? c.product_id,
        img: fullImage(
            p.image ?? p.img ?? p.thumbnail ?? p.main_image ??
            (Array.isArray(p.images) ? p.images[0] : null)
        ),
        name: p.name ?? p.title ?? 'Product',
        seller: p.seller?.name ?? p.store?.name ?? 'Artel Market',
        price: Number(p.price ?? p.final_price ?? 0),
        qty: Number(c.quantity ?? c.qty ?? 1),
    }
}

// options 1–10, plus the current quantity if it is bigger
const qtyOptions = (q) => {
    const base = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    return base.includes(q) ? base : [...base, q].sort((a, b) => a - b)
}

function Cart() {
    const navigate = useNavigate()
    const { t, lang } = useLanguage()

    // show the Arabic text when it exists, otherwise the English one
    const pickText = (en, ar) => (lang === 'ar' && ar ? ar : en)

    const [items, setItems] = useState(USE_API ? [] : initialItems)
    const [saved, setSaved] = useState(initialSaved)
    const [loading, setLoading] = useState(USE_API)
    const [notice, setNotice] = useState('')
    const [flash, setFlash] = useState('')   // short success message

    // hide the success message after 2.5 seconds
    useEffect(() => {
        if (!flash) return
        const timer = setTimeout(() => setFlash(''), 2500)
        return () => clearTimeout(timer)
    }, [flash])

    // load the cart
    useEffect(() => {
        if (!USE_API) return

        let alive = true

        api.get('/cart')
            .then((res) => {
                if (!alive) return
                setItems(extractList(res.data).map(normalizeCartItem))
            })
            .catch(() => {
                if (!alive) return
                setItems(initialItems)
                setNotice(t('cart.offline'))
            })
            .finally(() => {
                if (alive) setLoading(false)
            })

        return () => { alive = false }
    }, [])

    // remove one item (optimistic update + rollback)
    const removeItem = async (id) => {
        const backup = items
        setItems(items.filter((item) => item.id !== id))
        setNotice('')

        if (!USE_API) return

        try {
            await api.delete(`/cart/${id}`)
        } catch {
            setItems(backup)
            setNotice(t('cart.errRemove'))
        }
    }

    // empty the cart
    const removeAll = async () => {
        const backup = items
        setItems([])
        setNotice('')

        if (!USE_API) return

        try {
            await Promise.all(backup.map((item) => api.delete(`/cart/${item.id}`)))
        } catch {
            setItems(backup)
            setNotice(t('cart.errEmpty'))
        }
    }

    // change the quantity
    const changeQty = async (id, value) => {
        const qty = Number(value)
        const backup = items
        const target = items.find((item) => item.id === id)

        setItems(items.map((item) => (item.id === id ? { ...item, qty } : item)))
        setNotice('')

        if (!USE_API) return

        try {
            await api.post('/cart', {
                product_id: target?.productId ?? id,
                quantity: qty,
            })
        } catch {
            setItems(backup)
            setNotice(t('cart.errQty'))
        }
    }

    // ===== "Move to cart": saved → cart =====
    const moveToCart = async (savedItem) => {
        const backupItems = items
        const backupSaved = saved

        // already in the cart? add 1 to its quantity, otherwise add it with qty 1
        const exists = items.find((item) => item.id === savedItem.id)
        const nextItems = exists
            ? items.map((item) => (item.id === savedItem.id ? { ...item, qty: item.qty + 1 } : item))
            : [...items, { ...savedItem, qty: 1 }]

        setItems(nextItems)
        setSaved(saved.filter((s) => s.id !== savedItem.id))
        setNotice('')
        setFlash(t('cart.moved'))

        if (!USE_API) return

        try {
            await api.post('/cart', {
                product_id: savedItem.productId ?? savedItem.id,
                quantity: exists ? exists.qty + 1 : 1,
            })
        } catch {
            setItems(backupItems)
            setSaved(backupSaved)
            setFlash('')
            setNotice(t('cart.errMove'))
        }
    }

    // ===== "Save for later": cart → saved =====
    const saveForLater = async (cartItem) => {
        const backupItems = items
        const backupSaved = saved

        setItems(items.filter((item) => item.id !== cartItem.id))
        setSaved([...saved, cartItem])
        setNotice('')
        setFlash(t('cart.savedMsg'))

        if (!USE_API) return

        try {
            await api.delete(`/cart/${cartItem.id}`)
        } catch {
            setItems(backupItems)
            setSaved(backupSaved)
            setFlash('')
            setNotice(t('cart.errRemove'))
        }
    }

    // totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
    const discount = items.length > 0 ? 60 : 0
    const tax = items.length > 0 ? 14 : 0
    const total = subtotal - discount + tax

    return (
        <>
            <Header simple />

            <div className="cart-page">

                <h2 className="cart-title">{t('cart.title')} ({items.length})</h2>

                {notice && <p className="cart-notice">{notice}</p>}

                {flash && (
                    <p className="cart-flash">
                        <span className="material-symbols-outlined">check_circle</span>
                        {flash}
                    </p>
                )}

                <div className="cart-row">

                    <div className="cart-card">
                        <div className="cart-items">

                            {loading && <p className="cart-state">{t('cart.loading')}</p>}

                            {!loading && items.length === 0 && (
                                <p className="cart-state">{t('cart.empty')}</p>
                            )}

                            {items.map((item) => (
                                <div className="cart-item" key={item.id}>
                                    <div className="cart-thumb">
                                        <img src={item.img} alt={item.name} />
                                    </div>

                                    <div className="cart-info">
                                        <p className="cart-name">{pickText(item.name, item.nameAr)}</p>
                                        <p className="cart-meta">{t('cart.meta')}</p>
                                        <p className="cart-seller">{t('cart.seller')} {item.seller}</p>
                                        <div className="cart-actions">
                                            <button className="btn-remove" onClick={() => removeItem(item.id)}>
                                                {t('cart.remove')}
                                            </button>
                                            <button className="btn-save" onClick={() => saveForLater(item)}>
                                                {t('cart.saveLater')}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="cart-right">
                                        <p className="cart-price"><bdi>${item.price.toFixed(2)}</bdi></p>
                                        <select
                                            className="qty-select"
                                            value={item.qty}
                                            onChange={(e) => changeQty(item.id, e.target.value)}
                                        >
                                            {qtyOptions(item.qty).map((n) => (
                                                <option key={n} value={n}>{t('cart.qty')} {n}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="cart-foot">
                            <button className="btn-back" onClick={() => navigate('/products')}>
                                <span className="material-symbols-outlined">
                                    {lang === 'ar' ? 'arrow_forward' : 'arrow_back'}
                                </span>
                                {t('cart.back')}
                            </button>
                            <button className="btn-removeall" onClick={removeAll}>{t('cart.removeAll')}</button>
                        </div>
                    </div>

                    <div className="cart-side">
                        <div className="coupon-card">
                            <p className="coupon-title">{t('cart.couponTitle')}</p>
                            <div className="coupon-row">
                                <input className="coupon-input" type="text" placeholder={t('cart.couponPh')} />
                                <button className="coupon-btn">{t('cart.apply')}</button>
                            </div>
                        </div>

                        <div className="total-card">
                            <div className="total-row">
                                <span className="total-label">{t('cart.subtotal')}</span>
                                <span className="total-value"><bdi>${subtotal.toFixed(2)}</bdi></span>
                            </div>
                            <div className="total-row">
                                <span className="total-label">{t('cart.discount')}</span>
                                <span className="value-red"><bdi>- ${discount.toFixed(2)}</bdi></span>
                            </div>
                            <div className="total-row">
                                <span className="total-label">{t('cart.tax')}</span>
                                <span className="value-green"><bdi>+ ${tax.toFixed(2)}</bdi></span>
                            </div>

                            <div className="total-line"></div>

                            <div className="total-final">
                                <span>{t('cart.total')}</span>
                                <span>
                                    <bdi>${total.toFixed(2)}</bdi>
                                    {discount > 0 && (
                                        <span className="total-old"><bdi>${(total + discount).toFixed(2)}</bdi></span>
                                    )}
                                </span>
                            </div>

                            <button
                                className="btn-checkout"
                                onClick={() => navigate('/payment')}
                                disabled={items.length === 0}
                            >
                                {t('cart.checkout')}
                            </button>

                            <div className="pay-icons">
                                <img src="/images/pay-amex.png" alt="American Express" />
                                <img src="/images/pay-mastercard.png" alt="Mastercard" />
                                <img src="/images/pay-paypal.png" alt="PayPal" />
                                <img src="/images/pay-visa.png" alt="Visa" />
                                <img src="/images/pay-applepay.png" alt="Apple Pay" />
                            </div>
                        </div>
                    </div>

                </div>

                <div className="benefits">
                    {benefits.map((b) => (
                        <div className="benefit" key={b.title}>
                            <span className="benefit-icon material-symbols-outlined">{b.icon}</span>
                            <div>
                                <p className="benefit-title">{t(b.title)}</p>
                                <p className="benefit-text">{t('cart.bText')}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="saved-card">
                    <h3 className="saved-title">{t('cart.savedTitle')} ({saved.length})</h3>

                    {saved.length === 0 && <p className="cart-state">{t('cart.savedEmpty')}</p>}

                    <div className="saved-grid">
                        {saved.map((p) => (
                            <div className="saved-item" key={p.id}>
                                <div className="saved-thumb">
                                    <img src={p.img} alt={p.name} />
                                </div>
                                <p className="saved-price"><bdi>${p.price.toFixed(2)}</bdi></p>
                                <p className="saved-name">{pickText(p.name, p.nameAr)}</p>
                                <button className="saved-btn" onClick={() => moveToCart(p)}>
                                    <span className="material-symbols-outlined">shopping_cart</span>
                                    {t('cart.moveToCart')}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <Promo flatLeft />

            </div>

            <Newsletter />
            <Footer />
        </>
    )
}

export default Cart