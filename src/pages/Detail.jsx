import { useState, useEffect } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import CategoryBar from '../components/CategoryBar'
import Newsletter from '../components/Newsletter'
import Footer from '../components/Footer'
import Promo from '../components/Promo'
import api from '../service/api'
import { useLanguage } from '../context/LanguageContext'
import './Detail.css'

// Data source — false: Figma sample data, true: live API
const USE_API = true

const DEFAULT_MAIN = '/images/polo-main.png'

const thumbs = [
    '/images/polo-1.png',
    '/images/polo-2.png',
    '/images/polo-3.png',
    '/images/polo-4.png',
    '/images/polo-5.png',
    '/images/polo-6.png',
]

// price tiers — the quantity is number + translated "pcs"
const tiers = [
    { price: '$98.00', qty: '50-100' },
    { price: '$90.00', qty: '100-700' },
    { price: '$78.00', qty: '700+' },
]

const specs = [
    { label: 'detail.sPrice', value: 'detail.vNegotiable', line: true },
    { label: 'detail.sType', value: 'detail.vClassicShoes' },
    { label: 'detail.sMaterial', value: 'detail.vPlastic' },
    { label: 'detail.sDesign', value: 'detail.vModern', line: true },
    { label: 'detail.sCustom', value: 'detail.vCustom' },
    { label: 'detail.sProtection', value: 'detail.vRefund' },
    { label: 'detail.sWarranty', value: 'detail.vWarranty', line: true },
]

// tab ids stay fixed, only the label is translated
const tabs = ['description', 'reviews', 'shipping', 'seller']

// table: label key + value (codes and sizes are not translated)
const tableRows = [
    { key: 'detail.tModel', value: '#8786867' },
    { key: 'detail.tStyle', valueKey: 'detail.tClassic' },
    { key: 'detail.tCertificate', value: 'ISO-898921212' },
    { key: 'detail.tSize', value: '34mm x 450mm x 19mm' },
    { key: 'detail.tMemory', value: '36GB RAM' },
]

const features = ['detail.feat1', 'detail.feat2', 'detail.feat3', 'detail.feat1']

const youMayLike = [
    { img: '/images/like1.png', name: 'Men Blazers Sets Elegant Formal', nameAr: 'بدلة رجالية رسمية أنيقة', price: '$7.00 - $99.50' },
    { img: '/images/like2.png', name: 'Men Shirt Sleeve Polo Contrast', nameAr: 'قميص بولو رجالي', price: '$7.00 - $99.50' },
    { img: '/images/like3.png', name: 'Apple Watch Series Space Gray', nameAr: 'ساعة Apple رمادية', price: '$7.00 - $99.50' },
    { img: '/images/like4.png', name: 'Basketball Crew Socks Long Stuff', nameAr: 'جوارب رياضية طويلة', price: '$7.00 - $99.50' },
    { img: '/images/like5.png', name: "New Summer Men's castrol T-Shirts", nameAr: 'تيشيرتات رجالية صيفية', price: '$7.00 - $99.50' },
]

const related = [
    { img: '/images/rel1.png', name: 'Xiaomi Redmi 8 Original', nameAr: 'شاومي ريدمي 8 أصلي', price: '$32.00-$40.00' },
    { img: '/images/rel2.png', name: 'Xiaomi Redmi 8 Original', nameAr: 'شاومي ريدمي 8 أصلي', price: '$32.00-$40.00' },
    { img: '/images/rel3.png', name: 'Xiaomi Redmi 8 Original', nameAr: 'شاومي ريدمي 8 أصلي', price: '$32.00-$40.00' },
    { img: '/images/rel4.png', name: 'Xiaomi Redmi 8 Original', nameAr: 'شاومي ريدمي 8 أصلي', price: '$32.00-$40.00' },
    { img: '/images/rel5.png', name: 'Xiaomi Redmi 8 Original', nameAr: 'شاومي ريدمي 8 أصلي', price: '$32.00-$40.00' },
    { img: '/images/rel6.jpg', name: 'Xiaomi Redmi 8 Original', nameAr: 'شاومي ريدمي 8 أصلي', price: '$32.00-$40.00' },
]

// ===== Server data helpers =====
const ORIGIN = 'https://training.tamkeen-dev.com/tamkeenstore/public'

const fullImage = (value) => {
    if (value && typeof value === 'object') {
        value = value.url || value.path || value.image || ''
    }
    if (!value) return ''
    if (String(value).startsWith('http')) return value
    return ORIGIN + '/' + String(value).replace(/^\/+/, '')
}

const money = (value) => {
    if (value === null || value === undefined || value === '') return ''
    const n = Number(value)
    return Number.isNaN(n) ? String(value) : '$' + n.toFixed(2)
}

// finds the product object however it is wrapped
const extractOne = (raw) => raw?.data?.data ?? raw?.data ?? raw ?? null

// collects all product images in one array
const collectImages = (p) => {
    if (!p) return []
    const out = []
    const push = (v) => {
        const u = fullImage(v)
        if (u && !out.includes(u)) out.push(u)
    }

    push(p.image ?? p.main_image ?? p.thumbnail)
    if (Array.isArray(p.images)) p.images.forEach(push)
    if (Array.isArray(p.gallery)) p.gallery.forEach(push)

    return out
}

function Detail() {
    const { id } = useParams()   // product id from the URL
    const location = useLocation()
    const { t, lang } = useLanguage()

    // product sent from Home (name, price, image) — shown right away
    const preview = location.state?.product ?? null

    // show the Arabic text when it exists, otherwise the English one
    const pickText = (en, ar) => (lang === 'ar' && ar ? ar : en)
    const nextIcon = lang === 'ar' ? 'chevron_left' : 'chevron_right'

    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(USE_API)
    const [offline, setOffline] = useState(false)

    const [mainImg, setMainImg] = useState(preview?.img || DEFAULT_MAIN)
    const [tab, setTab] = useState('description')

    // "Save for later" = add / remove from favorites
    const [saved, setSaved] = useState(false)
    const [saving, setSaving] = useState(false)

    // opening another product → reset the image and the saved state
    useEffect(() => {
        setMainImg(preview?.img || DEFAULT_MAIN)
        setSaved(false)
        setProduct(null)
        window.scrollTo(0, 0)
    }, [id, preview?.img])

    const toggleSave = async () => {
        if (saving) return   // ignore double clicks

        const wasSaved = saved
        setSaved(!wasSaved)  // update the screen right away

        if (!USE_API || !id) return

        setSaving(true)
        try {
            if (wasSaved) {
                await api.delete(`/favorite/${id}`)
            } else {
                await api.post('/favorite', { product_id: id })
            }
        } catch {
            setSaved(wasSaved)   // undo if the request failed
        } finally {
            setSaving(false)
        }
    }

    // load the product
    useEffect(() => {
        if (!USE_API || !id) {
            setLoading(false)
            return
        }

        let alive = true
        setLoading(true)
        setOffline(false)

        api.get(`/product/${id}`)
            .then((res) => {
                if (!alive) return
                const p = extractOne(res.data)
                setProduct(p)

                const imgs = collectImages(p)
                if (imgs.length > 0) setMainImg(imgs[0])
            })
            .catch(() => {
                if (!alive) return
                setOffline(true)
            })
            .finally(() => {
                if (alive) setLoading(false)
            })

        return () => { alive = false }
    }, [id])   // reload when the id changes

    // shown values: server first, then the product sent from Home, then Figma
    const apiImages = collectImages(product)
    const gallery =
        apiImages.length > 0 ? apiImages
            : preview?.img ? [preview.img]
                : thumbs

    const name =
        product?.name ?? product?.title ??
        (preview ? pickText(preview.name, preview.nameAr) : t('detail.defaultName'))

    const desc = product?.description ?? product?.details ?? t('detail.defaultDesc')

    const shownPrice = money(product?.price ?? product?.final_price) || preview?.price || ''
    const priceTiers = shownPrice
        ? [{ price: shownPrice, qty: tiers[0].qty }, ...tiers.slice(1)]
        : tiers

    return (
        <>
            <Header />
            <CategoryBar />

            <div className="detail-page">

                <div className="crumbs">
                    <Link to="/">{t('prod.home')}</Link>
                    <span className="material-symbols-outlined">{nextIcon}</span>
                    <span>{t('prod.clothings')}</span>
                    <span className="material-symbols-outlined">{nextIcon}</span>
                    <span>{t('prod.mensWear')}</span>
                    <span className="material-symbols-outlined">{nextIcon}</span>
                    <span>{t('detail.summer')}</span>
                </div>

                {loading && <p className="detail-state">{t('detail.loading')}</p>}

                {!loading && offline && (
                    <p className="detail-state-note">{t('detail.offline')}</p>
                )}

                <div className="detail-card">

                    <div className="gallery">
                        <div className="gallery-main">
                            <img src={mainImg} alt={name} />
                        </div>
                        <div className="gallery-thumbs">
                            {gallery.map((img) => (
                                <div
                                    key={img}
                                    className={mainImg === img ? 'thumb active' : 'thumb'}
                                    onClick={() => setMainImg(img)}
                                >
                                    <img src={img} alt="" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="detail-info">
                        <p className="stock">
                            <span className="material-symbols-outlined">check</span>
                            {t('detail.inStock')}
                        </p>

                        <h2 className="detail-name">{name}</h2>

                        <p className="detail-rate">
                            <span className="stars">★★★★☆</span>
                            <span className="score">9.3</span> ·
                            <span className="material-symbols-outlined">chat</span> 32 {t('detail.reviews')} ·
                            <span className="material-symbols-outlined">sell</span> 154 {t('detail.sold')}
                        </p>

                        <div className="price-box">
                            {priceTiers.map((tier) => (
                                <div className="price-tier" key={tier.qty}>
                                    <p className="tier-price"><bdi>{tier.price}</bdi></p>
                                    <p className="tier-qty"><bdi>{tier.qty}</bdi> {t('detail.pcs')}</p>
                                </div>
                            ))}
                        </div>

                        {specs.map((s) => (
                            <div className={s.line ? 'spec-row has-line' : 'spec-row'} key={s.label}>
                                <span className="spec-label">{t(s.label)}</span>
                                <span className="spec-value">{t(s.value)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="detail-right">
                        <div className="supplier">
                            <div className="supplier-top">
                                <div className="supplier-avatar">R</div>
                                <div>
                                    <p className="supplier-label">{t('detail.supplier')}</p>
                                    <p className="supplier-name">Guanjoi Trading LLC</p>
                                </div>
                            </div>

                            <div className="sup-row">
                                <img className="supplier-flag" src="/images/flag-de.png" alt="" />
                                <span>{t('detail.location')}</span>
                            </div>
                            <div className="sup-row">
                                <span className="material-symbols-outlined sup-icon">verified_user</span>
                                <span>{t('detail.verified')}</span>
                            </div>
                            <div className="sup-row">
                                <span className="material-symbols-outlined sup-icon">language</span>
                                <span>{t('detail.worldwide')}</span>
                            </div>

                            <button className="sup-btn-main">{t('detail.inquiry')}</button>
                            <button className="sup-btn-alt">{t('detail.sellerProfile')}</button>
                        </div>

                        <button
                            type="button"
                            className={saved ? 'save-later is-saved' : 'save-later'}
                            onClick={toggleSave}
                            disabled={saving}
                        >
                            <span className="material-symbols-outlined">favorite</span>
                            {saved ? t('detail.saved') : t('detail.saveLater')}
                        </button>
                    </div>

                </div>
            </div>

            <div className="tabs-row">

                <div className="tabs-card">
                    <div className="tab-bar">
                        {tabs.map((tabId) => (
                            <button
                                key={tabId}
                                className={tab === tabId ? 'tab-item active' : 'tab-item'}
                                onClick={() => setTab(tabId)}
                            >
                                {t(`detail.tab.${tabId}`)}
                            </button>
                        ))}
                    </div>

                    {tab === 'description' && (
                        <div className="tab-body">
                            <p className="tab-text">{desc}</p>

                            <table className="spec-table">
                                <tbody>
                                    {tableRows.map((row) => (
                                        <tr key={row.key}>
                                            <td className="spec-key">{t(row.key)}</td>
                                            <td className="spec-val">
                                                {row.valueKey ? t(row.valueKey) : <bdi>{row.value}</bdi>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <ul className="feature-list">
                                {features.map((key, i) => (
                                    <li key={i}>
                                        <span className="material-symbols-outlined feat-icon">check</span>
                                        {t(key)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {tab !== 'description' && (
                        <div className="tab-body">
                            <p className="tab-text">{t('detail.soon')}</p>
                        </div>
                    )}
                </div>

                <div className="like-card">
                    <h3 className="like-title">{t('detail.mayLike')}</h3>
                    {youMayLike.map((p) => (
                        <div className="like-item" key={p.name}>
                            <img src={p.img} alt={p.name} />
                            <div>
                                <p className="like-name">{pickText(p.name, p.nameAr)}</p>
                                <p className="like-price"><bdi>{p.price}</bdi></p>
                            </div>
                        </div>
                    ))}
                </div>

            </div>

            <div className="related">
                <h3 className="related-title">{t('detail.related')}</h3>
                <div className="related-grid">
                    {related.map((p, i) => (
                        <div className="related-item" key={i}>
                            <div className="related-thumb">
                                <img src={p.img} alt={p.name} />
                            </div>
                            <p className="related-name">{pickText(p.name, p.nameAr)}</p>
                            <p className="related-price"><bdi>{p.price}</bdi></p>
                        </div>
                    ))}
                </div>
            </div>

            <Promo />

            <Newsletter />
            <Footer />
        </>
    )
}

export default Detail