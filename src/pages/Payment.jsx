import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import api from '../service/api'
import { useLanguage } from '../context/LanguageContext'
import { useCart } from '../context/CartContext'
import './Payment.css'

// Data source — false: local cart, true: live API
const USE_API = false

const figmaAddresses = [
    { id: 'a1', label: 'Damascus — Mazzeh, Street 12' },
    { id: 'a2', label: 'Aleppo — Al-Furqan, Building 4' },
]

const figmaOrders = [
    { id: 'o1', number: '#1024', date: '2026-10-08', total: 114, status: 'pending', count: 3 },
    { id: 'o2', number: '#1019', date: '2026-10-02', total: 58, status: 'delivered', count: 1 },
]

const TAX = 4

// ===== Server data helpers =====
const ORIGIN = 'https://training.tamkeen-dev.com/tamkeenstore/public'

const fullImage = (value) => {
    if (value && typeof value === 'object') {
        value = value.url || value.path || value.image || ''
    }
    if (!value) return '/images/watch.png'
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

const normalizeCartItem = (c, i) => {
    const p = c.product ?? c

    return {
        id: c.id ?? c.cart_id ?? p.id ?? i,
        name: p.name ?? p.title ?? 'Product',
        desc: p.description ?? p.desc ?? '',
        qty: Number(c.quantity ?? c.qty ?? 1),
        price: Number(p.price ?? p.final_price ?? 0),
        image: fullImage(
            p.image ?? p.img ?? p.thumbnail ?? p.main_image ??
            (Array.isArray(p.images) ? p.images[0] : null)
        ),
    }
}

// builds the address text, and takes the city name from the cities list
const normalizeAddress = (a, cities) => {
    const cityId = a.city_id ?? a.city?.id
    const cityName =
        a.city?.name ??
        cities.find((c) => c.id === cityId)?.name ??
        ''

    const street = a.address ?? a.street ?? a.details ?? a.name ?? `Address #${a.id}`

    return {
        id: a.id ?? a.address_id,
        label: cityName ? `${cityName} — ${street}` : street,
    }
}

const normalizeOrder = (o) => ({
    id: o.id ?? o.order_id,
    number: '#' + (o.order_number ?? o.number ?? o.id),
    date: String(o.created_at ?? o.date ?? '').slice(0, 10),
    total: Number(o.total ?? o.net_total ?? o.amount ?? 0),
    status: String(o.status ?? 'pending').toLowerCase(),
    count: o.items_count ?? o.products?.length ?? o.items?.length ?? 0,
})

const readError = (err, fallback) => {
    const fieldErrors = err.response?.data?.errors
    const firstField = fieldErrors && Object.values(fieldErrors)[0]
    return (
        (Array.isArray(firstField) ? firstField[0] : firstField) ||
        err.response?.data?.message ||
        fallback
    )
}

function Payment() {
    const { t, lang } = useLanguage()
    const navigate = useNavigate()

    // the real cart — same items the Cart page shows
    const { items, removeAll } = useCart()

    // show the Arabic text when it exists, otherwise the English one
    const pickText = (en, ar) => (lang === 'ar' && ar ? ar : en)

    // order status: translated if we know it, otherwise as the server sent it
    const statusLabel = (s) => {
        const key = `pay.status.${s}`
        const text = t(key)
        return text === key ? s : text
    }

    const [method, setMethod] = useState('cash')
    const [coupon, setCoupon] = useState('')
    const [appliedCoupon, setAppliedCoupon] = useState('')
    const [showSuccess, setShowSuccess] = useState(false)
    const [paid, setPaid] = useState(false)

    // cart from the server (API mode only)
    const [serverItems, setServerItems] = useState(null)
    const [loading, setLoading] = useState(USE_API)

    // the list shown: server cart if we have one, otherwise the local cart
    const products = serverItems ?? items.map((item) => ({
        id: item.id,
        name: item.name,
        nameAr: item.nameAr,
        desc: item.seller ?? '',
        descAr: item.seller ?? '',
        qty: item.qty,
        price: item.price,
        image: item.img,
    }))

    // ===== addresses =====
    const [addresses, setAddresses] = useState(USE_API ? [] : figmaAddresses)
    const [addressId, setAddressId] = useState(USE_API ? '' : figmaAddresses[0].id)

    // ===== orders =====
    const [ordersOpen, setOrdersOpen] = useState(false)
    const [orders, setOrders] = useState([])
    const [ordersLoading, setOrdersLoading] = useState(false)
    const [ordersError, setOrdersError] = useState('')
    const [cancellingId, setCancellingId] = useState(null)

    const [placing, setPlacing] = useState(false)
    const [error, setError] = useState('')

    // load the cart from the server
    useEffect(() => {
        if (!USE_API) return

        let alive = true

        api.get('/cart')
            .then((res) => {
                if (!alive) return
                const list = extractList(res.data).map(normalizeCartItem)
                if (list.length > 0) setServerItems(list)
            })
            .catch(() => {
                // keep the local cart
            })
            .finally(() => {
                if (alive) setLoading(false)
            })

        return () => { alive = false }
    }, [])

    // load the cities and the addresses together
    useEffect(() => {
        if (!USE_API) return

        let alive = true

        Promise.all([
            api.get('/city').catch(() => ({ data: [] })),   // cities are optional
            api.get('/address'),
        ])
            .then(([cityRes, addrRes]) => {
                if (!alive) return

                const cities = extractList(cityRes.data).map((c) => ({
                    id: c.id,
                    name: c.name ?? c.title ?? '',
                }))

                const list = extractList(addrRes.data).map((a) => normalizeAddress(a, cities))
                setAddresses(list)
                if (list.length > 0) setAddressId(list[0].id)
            })
            .catch(() => {
                // no addresses — the user is told when confirming
            })

        return () => { alive = false }
    }, [])

    // ===== totals: price × quantity for every item =====
    const total = products.reduce((sum, p) => sum + p.price * p.qty, 0)
    const discount = 0
    const tax = products.length > 0 ? TAX : 0
    const netTotal = total - discount + tax

    // ===== coupon =====
    const handleCheck = () => {
        const code = coupon.trim()

        if (!code) {
            setError(t('pay.errCoupon'))
            return
        }

        setError('')
        setAppliedCoupon(code)
    }

    // ===== place the order — POST /order =====
    const handleConfirm = async () => {
        setError('')

        if (products.length === 0) {
            setError(t('pay.errEmpty'))
            return
        }

        if (!USE_API) {
            setShowSuccess(true)
            setPaid(true)
            removeAll()          // the cart is now empty
            return
        }

        if (!addressId) {
            setError(t('pay.errAddress'))
            return
        }

        setPlacing(true)

        try {
            await api.post('/order', {
                note: '',
                payment_type: method,
                address_id: addressId,
                coupon_code: appliedCoupon,
            })

            setShowSuccess(true)
            setPaid(true)
            removeAll()
        } catch (err) {
            setError(readError(err, t('pay.errOrder')))
        } finally {
            setPlacing(false)
        }
    }

    // ===== show the orders — GET /order =====
    const openOrders = async () => {
        setOrdersOpen(true)
        setOrdersError('')

        if (!USE_API) {
            setOrders(figmaOrders)
            return
        }

        setOrdersLoading(true)

        try {
            const res = await api.get('/order')
            setOrders(extractList(res.data).map(normalizeOrder))
        } catch (err) {
            setOrdersError(readError(err, t('pay.errOrders')))
        } finally {
            setOrdersLoading(false)
        }
    }

    // ===== cancel an order — DELETE /order/{id} =====
    const cancelOrder = async (id) => {
        if (cancellingId) return

        const backup = orders
        setOrders(orders.filter((o) => o.id !== id))   // update the screen first
        setOrdersError('')

        if (!USE_API) return

        setCancellingId(id)

        try {
            await api.delete(`/order/${id}`)
        } catch (err) {
            setOrders(backup)                           // undo if it failed
            setOrdersError(readError(err, t('pay.errCancel')))
        } finally {
            setCancellingId(null)
        }
    }

    // X = close the popup only, stay on the page (to see "View ordered items")
    const closeModal = () => {
        setShowSuccess(false)
    }

    // "Continue" = close the popup and go back to shopping
    const continueShopping = () => {
        setShowSuccess(false)
        navigate('/')
    }

    return (
        <>
            <Header />

            <div className="row g-0 pay-page">

                <div className="col-12 col-lg-7 pay-left">
                    <img src="/images/login-bg.jpg" alt="" className="pay-bg" />

                    <div className="pay-card">
                        <h2 className="pay-title">{t('pay.title')}</h2>
                        <p className="pay-subtitle">{t('pay.subtitle')}</p>

                        <label className="pay-option">
                            <span className="pay-option-name">{t('pay.cash')}</span>
                            <input
                                type="radio"
                                name="method"
                                className="pay-radio"
                                checked={method === 'cash'}
                                onChange={() => setMethod('cash')}
                            />
                        </label>

                        <label className="pay-option">
                            <span className="pay-option-name">
                                <img src="/images/mtn.png" alt="" className="pay-logo" />
                                {t('pay.syriatel')}
                            </span>
                            <input
                                type="radio"
                                name="method"
                                className="pay-radio"
                                checked={method === 'syriatel'}
                                onChange={() => setMethod('syriatel')}
                            />
                        </label>

                        <label className="pay-option">
                            <span className="pay-option-name">
                                <img src="/images/syriatel.png" alt="" className="pay-logo" />
                                {t('pay.mtn')}
                            </span>
                            <input
                                type="radio"
                                name="method"
                                className="pay-radio"
                                checked={method === 'mtn'}
                                onChange={() => setMethod('mtn')}
                            />
                        </label>

                        {USE_API && (
                            <>
                                <p className="pay-label">{t('pay.address')}</p>
                                <div className="pay-address-box">
                                    <select
                                        className="pay-address"
                                        value={addressId}
                                        onChange={(e) => setAddressId(e.target.value)}
                                    >
                                        {addresses.length === 0 && <option value="">{t('pay.noAddress')}</option>}
                                        {addresses.map((a) => (
                                            <option key={a.id} value={a.id}>{a.label}</option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined pay-address-arrow">keyboard_arrow_down</span>
                                </div>
                            </>
                        )}

                        <p className="pay-label">{t('pay.discountCode')}</p>
                        <div className="pay-coupon">
                            <input
                                type="text"
                                className="pay-coupon-input"
                                placeholder="5601"
                                value={coupon}
                                onChange={(e) => setCoupon(e.target.value)}
                            />
                            <button type="button" className="pay-check" onClick={handleCheck}>
                                <span className="material-symbols-outlined">rotate_left</span>
                                {t('pay.check')}
                            </button>
                        </div>

                        {appliedCoupon && !error && (
                            <p className="pay-note">
                                {t('pay.codeNote1')} <bdi>{appliedCoupon}</bdi> {t('pay.codeNote2')}
                            </p>
                        )}

                        {error && <p className="pay-error">{error}</p>}

                        {paid && (
                            <button type="button" className="pay-view" onClick={openOrders}>
                                {t('pay.viewOrders')}
                            </button>
                        )}
                    </div>
                </div>

                <div className={`col-12 col-lg-5 pay-right ${showSuccess ? 'pay-right-paid' : ''}`}>
                    <div className="pay-summary">

                        <div className={showSuccess ? 'pay-items pay-items-hidden' : 'pay-items'}>

                            {loading && <p className="pay-state">{t('pay.loading')}</p>}

                            {!loading && products.length === 0 && (
                                <p className="pay-state">{t('cart.empty')}</p>
                            )}

                            {products.map((item) => (
                                <div className="pay-item" key={item.id}>
                                    <img src={item.image} alt={item.name} className="pay-item-img" />
                                    <div className="pay-item-info">
                                        <h3 className="pay-item-name">{pickText(item.name, item.nameAr)}</h3>
                                        <p className="pay-item-desc">{pickText(item.desc, item.descAr)}</p>
                                    </div>
                                    <span className="pay-item-qty">{item.qty}</span>
                                    {/* price × quantity */}
                                    <span className="pay-item-price">
                                        <bdi>${(item.price * item.qty).toFixed(2)}</bdi>
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="pay-row">
                            <span>{t('pay.total')}</span>
                            <span><bdi>${total.toFixed(2)}</bdi></span>
                        </div>

                        <div className="pay-row">
                            <span>{t('pay.discount')}</span>
                            <span><bdi>${discount.toFixed(2)}</bdi></span>
                        </div>

                        <div className="pay-row">
                            <span>{t('pay.tax')}</span>
                            <span><bdi>${tax.toFixed(2)}</bdi></span>
                        </div>

                        <div className="pay-divider"></div>

                        <div className="pay-row pay-net">
                            <span>{t('pay.netTotal')}</span>
                            <span><bdi>${netTotal.toFixed(2)}</bdi></span>
                        </div>

                        <button
                            type="button"
                            className="btn pay-confirm"
                            onClick={handleConfirm}
                            disabled={placing || products.length === 0}
                        >
                            {placing ? t('pay.placing') : t('pay.confirm')}
                        </button>

                    </div>
                </div>

            </div>

            {/* ===== Success popup ===== */}
            {showSuccess && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="success-modal" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="success-close" onClick={closeModal} aria-label="Close">
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <img src="/images/success-badge.png" alt="" className="success-icon" />

                        <p className="success-text pre-line">{t('pay.successText')}</p>

                        <button type="button" className="btn success-btn" onClick={continueShopping}>
                            {t('pay.continue')}
                        </button>
                    </div>
                </div>
            )}

            {/* ===== Orders popup — GET + DELETE /order ===== */}
            {ordersOpen && (
                <div className="modal-overlay" onClick={() => setOrdersOpen(false)}>
                    <div className="orders-modal" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="success-close" onClick={() => setOrdersOpen(false)} aria-label="Close">
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <h3 className="orders-title">{t('pay.myOrders')}</h3>

                        {ordersLoading && <p className="pay-state">{t('pay.loading')}</p>}

                        {ordersError && <p className="pay-error">{ordersError}</p>}

                        {!ordersLoading && orders.length === 0 && !ordersError && (
                            <p className="pay-state">{t('pay.noOrders')}</p>
                        )}

                        <div className="orders-list">
                            {orders.map((o) => (
                                <div className="order-row" key={o.id}>
                                    <div className="order-info">
                                        <p className="order-number"><bdi>{o.number}</bdi></p>
                                        <p className="order-meta">
                                            <bdi>{o.date}</bdi> · {o.count} {t('pay.items')} · <bdi>${o.total.toFixed(2)}</bdi>
                                        </p>
                                    </div>

                                    <span className={`order-status status-${o.status}`}>{statusLabel(o.status)}</span>

                                    {o.status === 'pending' && (
                                        <button
                                            type="button"
                                            className="order-cancel"
                                            onClick={() => cancelOrder(o.id)}
                                            disabled={cancellingId === o.id}
                                        >
                                            {t('pay.cancel')}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Payment