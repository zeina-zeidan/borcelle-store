import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import CategoryBar from '../components/CategoryBar'
import Newsletter from '../components/Newsletter'
import Footer from '../components/Footer'
import api from '../service/api'
import { useLanguage } from '../context/LanguageContext'
import './Products.css'

// Data source — false: Figma sample data, true: live API
const USE_API = true

// category "name" stays English (used for filtering), "key" = translated label
const categoryList = [
    { name: 'Mobile accessory', key: 'cat.mobile' },
    { name: 'Electronics', key: 'cat.electronics' },
    { name: 'Smartphones', key: 'cat.smartphones' },
    { name: 'Modern tech', key: 'cat.modernTech' },
]

// find the translation key of a category name (for the title and breadcrumb)
const categoryKey = (name) => categoryList.find((c) => c.name === name)?.key

const brandList = ['brand.samsung', 'brand.apple', 'brand.huawei', 'brand.poco', 'brand.lenovo']
const featureList = ['prod.f.metallic', 'prod.f.plastic', 'prod.f.ram', 'prod.f.power', 'prod.f.memory']
const conditionList = ['prod.c.any', 'prod.c.refurbished', 'prod.c.new', 'prod.c.old']
const ratingList = [5, 4, 3, 2]

// chips: translation key or star rating
const chips = [
    { key: 'brand.samsung' },
    { key: 'brand.apple' },
    { key: 'brand.poco' },
    { key: 'prod.f.metallic' },
    { stars: 4 },
    { stars: 3 },
]

// ===== Figma sample data — English + Arabic =====
const figmaProducts = [
    {
        id: 'f1',
        name: 'Canon Cmera EOS 2000, Black 10x zoom',
        nameAr: 'كاميرا كانون EOS 2000 سوداء بزوم 10x',
        price: '$998.00', oldPrice: '$1128.00', rate: '7.5', orders: 154,
        desc: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
        descAr: 'كاميرا احترافية بجودة عالية وتصميم خفيف، مناسبة للتصوير اليومي والسفر.',
        img: '/images/phone2.png',
    },
    {
        id: 'f2',
        name: 'GoPro HERO6 4K Action Camera - Black',
        nameAr: 'كاميرا GoPro HERO6 4K للمغامرات - سوداء',
        price: '$998.00', oldPrice: '', rate: '7.5', orders: 154,
        desc: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit',
        descAr: 'كاميرا صغيرة ومقاومة، تصوّر فيديو بدقة 4K وتناسب الرياضة والرحلات.',
        img: '/images/phone.png',
    },
    {
        id: 'f3',
        name: 'GoPro HERO6 4K Action Camera - Black',
        nameAr: 'كاميرا GoPro HERO6 4K للمغامرات - سوداء',
        price: '$998.00', oldPrice: '', rate: '7.5', orders: 154,
        desc: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit',
        descAr: 'كاميرا صغيرة ومقاومة، تصوّر فيديو بدقة 4K وتناسب الرياضة والرحلات.',
        img: '/images/tablet.png',
    },
    {
        id: 'f4',
        name: 'GoPro HERO6 4K Action Camera - Black',
        nameAr: 'كاميرا GoPro HERO6 4K للمغامرات - سوداء',
        price: '$998.00', oldPrice: '', rate: '7.5', orders: 154,
        desc: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit',
        descAr: 'كاميرا صغيرة ومقاومة، تصوّر فيديو بدقة 4K وتناسب الرياضة والرحلات.',
        img: '/images/laptop.png',
    },
    {
        id: 'f5',
        name: 'GoPro HERO6 4K Action Camera - Black',
        nameAr: 'كاميرا GoPro HERO6 4K للمغامرات - سوداء',
        price: '$998.00', oldPrice: '$1128.00', rate: '7.5', orders: 154,
        desc: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit',
        descAr: 'كاميرا صغيرة ومقاومة، تصوّر فيديو بدقة 4K وتناسب الرياضة والرحلات.',
        img: '/images/watch.png',
    },
    {
        id: 'f6',
        name: 'GoPro HERO6 4K Action Camera - Black',
        nameAr: 'كاميرا GoPro HERO6 4K للمغامرات - سوداء',
        price: '$998.00', oldPrice: '', rate: '7.5', orders: 154,
        desc: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit',
        descAr: 'كاميرا صغيرة ومقاومة، تصوّر فيديو بدقة 4K وتناسب الرياضة والرحلات.',
        img: '/images/headphone2.png',
    },
]

// ===== Server data helpers =====
const ORIGIN = 'https://training.tamkeen-dev.com/tamkeenstore/public'

const fullImage = (value) => {
    if (value && typeof value === 'object') {
        value = value.url || value.path || value.image || ''
    }
    if (!value) return '/images/phone2.png'
    if (String(value).startsWith('http')) return value
    return ORIGIN + '/' + String(value).replace(/^\/+/, '')
}

const money = (value) => {
    if (value === null || value === undefined || value === '') return ''
    const n = Number(value)
    return Number.isNaN(n) ? String(value) : '$' + n.toFixed(2)
}

const normalize = (p) => ({
    id: p.id ?? p.product_id,
    name: p.name ?? p.title ?? 'Unnamed product',
    price: money(p.price ?? p.final_price ?? p.product_price),
    oldPrice: money(p.old_price ?? p.price_before_discount),
    rate: p.rate ?? p.rating ?? p.average_rate ?? '7.5',
    orders: p.orders_count ?? p.sold_count ?? p.sales ?? 0,
    desc: p.description ?? p.desc ?? p.details ?? '',
    img: fullImage(
        p.image ?? p.img ?? p.thumbnail ?? p.main_image ??
        (Array.isArray(p.images) ? p.images[0] : null)
    ),
})

const extractList = (raw) => {
    if (Array.isArray(raw)) return raw
    if (Array.isArray(raw?.data)) return raw.data
    if (Array.isArray(raw?.data?.data)) return raw.data.data
    if (Array.isArray(raw?.products)) return raw.products
    return []
}

// takes the /favorite response and returns product ids only
const extractFavIds = (raw) => {
    return extractList(raw).map((f) => {
        const p = f.product ?? f
        return p.id ?? f.product_id ?? f.id
    })
}

function Products() {
    const { t, lang } = useLanguage()

    // show the Arabic text when it exists, otherwise the English one
    const pickText = (en, ar) => (lang === 'ar' && ar ? ar : en)

    // arrows point the other way in Arabic
    const nextIcon = lang === 'ar' ? 'chevron_left' : 'chevron_right'
    const prevIcon = lang === 'ar' ? 'chevron_right' : 'chevron_left'

    // category coming from CategoryBar
    const location = useLocation()
    const activeCategory = location.state?.category ?? 'Mobile accessory'
    const activeKey = categoryKey(activeCategory)
    const activeLabel = activeKey ? t(activeKey) : activeCategory

    const [view, setView] = useState('list')

    // selected filter chips — the "x" removes one, "Clear all" removes all
    const [activeChips, setActiveChips] = useState(chips)
    const [cleared, setCleared] = useState(false)

    const removeChip = (index) => {
        setActiveChips(activeChips.filter((_, i) => i !== index))
    }

    const clearChips = (e) => {
        e.preventDefault()   // the link should not jump to the top
        setActiveChips([])
        setCleared(true)
    }

    // hide the "cleared" message after 2.5 seconds
    useEffect(() => {
        if (!cleared) return
        const id = setTimeout(() => setCleared(false), 2500)
        return () => clearTimeout(id)
    }, [cleared])

    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    // favorites: ids of saved products
    const [favorites, setFavorites] = useState([])
    const [favBusy, setFavBusy] = useState(null)

    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(6)

    const [open, setOpen] = useState({
        category: true,
        brands: true,
        features: true,
        price: false,
        condition: false,
        ratings: false,
    })

    const toggle = (key) => setOpen({ ...open, [key]: !open[key] })

    const totalPages = Math.max(1, Math.ceil(products.length / perPage))
    const start = (page - 1) * perPage
    const visible = products.slice(start, start + perPage)

    const goPage = (n) => {
        setPage(n)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // back to page 1 when the category changes
    useEffect(() => {
        setPage(1)
    }, [activeCategory])

    // load products
    useEffect(() => {
        if (!USE_API) {
            setProducts(figmaProducts)
            setLoading(false)
            return
        }

        let alive = true

        api.get('/product')
            .then((res) => {
                if (!alive) return
                const list = extractList(res.data).map(normalize)
                setProducts(list.length > 0 ? list : figmaProducts)
            })
            .catch(() => {
                if (!alive) return
                setProducts(figmaProducts)
            })
            .finally(() => {
                if (alive) setLoading(false)
            })

        return () => { alive = false }
    }, [])

    // load favorites
    useEffect(() => {
        if (!USE_API) return

        let alive = true

        api.get('/favorite')
            .then((res) => {
                if (!alive) return
                setFavorites(extractFavIds(res.data))
            })
            .catch(() => {
                // no favorites shown
            })

        return () => { alive = false }
    }, [])

    // add / remove a favorite (optimistic update + rollback)
    const toggleFavorite = async (id) => {
        if (favBusy === id) return

        const wasFav = favorites.includes(id)
        const backup = favorites

        setFavorites(wasFav
            ? favorites.filter((f) => f !== id)
            : [...favorites, id]
        )

        if (!USE_API) return

        setFavBusy(id)

        try {
            if (wasFav) {
                await api.delete(`/favorite/${id}`)
            } else {
                await api.post('/favorite', { product_id: id })
            }
        } catch {
            setFavorites(backup)
        } finally {
            setFavBusy(null)
        }
    }

    const isFav = (id) => favorites.includes(id)

    // chip text: translated key, or "4 stars"
    const chipLabel = (c) => (c.key ? t(c.key) : `${c.stars} ${t('prod.star')}`)

    return (
        <>
            <Header />
            <CategoryBar />

            <div className="prod-page">

                {/* ===== Breadcrumb ===== */}
                <nav className="crumb">
                    <Link to="/">{t('prod.home')}</Link>
                    <span className="material-symbols-outlined">{nextIcon}</span>
                    <a href="#">{t('prod.clothings')}</a>
                    <span className="material-symbols-outlined">{nextIcon}</span>
                    <a href="#">{t('prod.mensWear')}</a>
                    <span className="material-symbols-outlined">{nextIcon}</span>
                    <a href="#">{activeLabel}</a>
                </nav>

                <div className="prod-layout">

                    {/* ===== Filters ===== */}
                    <aside className="filters">

                        <div className="filter-box">
                            <div className="filter-head" onClick={() => toggle('category')}>
                                {t('prod.category')}
                                <span className="material-symbols-outlined">
                                    {open.category ? 'expand_less' : 'expand_more'}
                                </span>
                            </div>
                            {open.category && (
                                <>
                                    <ul className="filter-list">
                                        {categoryList.map((c) => (
                                            <li key={c.name}>
                                                <Link
                                                    to="/products"
                                                    state={{ category: c.name }}
                                                    className={c.name === activeCategory ? 'cat-active' : ''}
                                                >
                                                    {t(c.key)}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                    <a className="see-all" href="#">{t('prod.seeAll')}</a>
                                </>
                            )}
                        </div>

                        <div className="filter-box">
                            <div className="filter-head" onClick={() => toggle('brands')}>
                                {t('prod.brands')}
                                <span className="material-symbols-outlined">
                                    {open.brands ? 'expand_less' : 'expand_more'}
                                </span>
                            </div>
                            {open.brands && (
                                <>
                                    {brandList.map((key) => (
                                        <label key={key} className="check-row">
                                            <input type="checkbox" />
                                            {t(key)}
                                        </label>
                                    ))}
                                    <a className="see-all" href="#">{t('prod.seeAll')}</a>
                                </>
                            )}
                        </div>

                        <div className="filter-box">
                            <div className="filter-head" onClick={() => toggle('features')}>
                                {t('prod.features')}
                                <span className="material-symbols-outlined">
                                    {open.features ? 'expand_less' : 'expand_more'}
                                </span>
                            </div>
                            {open.features && (
                                <>
                                    {featureList.map((key) => (
                                        <label key={key} className="check-row">
                                            <input type="checkbox" />
                                            {t(key)}
                                        </label>
                                    ))}
                                    <a className="see-all" href="#">{t('prod.seeAll')}</a>
                                </>
                            )}
                        </div>

                        <div className="filter-box">
                            <div className="filter-head" onClick={() => toggle('price')}>
                                {t('prod.priceRange')}
                                <span className="material-symbols-outlined">
                                    {open.price ? 'expand_less' : 'expand_more'}
                                </span>
                            </div>
                            {open.price && (
                                <>
                                    <div className="price-slider">
                                        <span className="price-fill"></span>
                                        <span className="price-thumb price-thumb-1"></span>
                                        <span className="price-thumb price-thumb-2"></span>
                                    </div>

                                    <div className="price-row">
                                        <div className="price-field">
                                            <span>{t('prod.min')}</span>
                                            <input type="text" defaultValue="0" />
                                        </div>
                                        <div className="price-field">
                                            <span>{t('prod.max')}</span>
                                            <input type="text" defaultValue="999999" />
                                        </div>
                                    </div>

                                    <button className="price-apply" type="button">{t('prod.apply')}</button>
                                </>
                            )}
                        </div>

                        <div className="filter-box">
                            <div className="filter-head" onClick={() => toggle('condition')}>
                                {t('prod.condition')}
                                <span className="material-symbols-outlined">
                                    {open.condition ? 'expand_less' : 'expand_more'}
                                </span>
                            </div>
                            {open.condition && conditionList.map((key, i) => (
                                <label key={key} className="radio-row">
                                    <input type="radio" name="condition" defaultChecked={i === 0} />
                                    {t(key)}
                                </label>
                            ))}
                        </div>

                        <div className="filter-box">
                            <div className="filter-head" onClick={() => toggle('ratings')}>
                                {t('prod.ratings')}
                                <span className="material-symbols-outlined">
                                    {open.ratings ? 'expand_less' : 'expand_more'}
                                </span>
                            </div>
                            {open.ratings && ratingList.map((r) => (
                                <label key={r} className="check-row rating-row">
                                    <input type="checkbox" />
                                    <span className="rating-stars">
                                        {'★'.repeat(r)}
                                        <span className="rating-empty">{'★'.repeat(5 - r)}</span>
                                    </span>
                                </label>
                            ))}
                        </div>

                    </aside>

                    {/* ===== Product list ===== */}
                    <div className="prod-main">

                        <div className="prod-bar">
                            <span className="prod-count">
                                {products.length} {t('prod.itemsIn')} <b>{activeLabel}</b>
                            </span>

                            <label className="prod-verified">
                                <input type="checkbox" defaultChecked />
                                {t('prod.verified')}
                            </label>

                            <div className="prod-sort-box">
                                <select className="prod-sort">
                                    <option>{t('prod.sortFeatured')}</option>
                                    <option>{t('prod.sortNewest')}</option>
                                    <option>{t('prod.sortPrice')}</option>
                                </select>
                                <span className="material-symbols-outlined prod-sort-arrow">keyboard_arrow_down</span>
                            </div>

                            <div className="prod-view">
                                <span
                                    className={view === 'grid' ? 'material-symbols-outlined active' : 'material-symbols-outlined'}
                                    onClick={() => setView('grid')}
                                >
                                    grid_view
                                </span>
                                <span
                                    className={view === 'list' ? 'material-symbols-outlined active' : 'material-symbols-outlined'}
                                    onClick={() => setView('list')}
                                >
                                    format_list_bulleted
                                </span>
                            </div>
                        </div>

                        {/* ===== Selected filters ===== */}
                        {view === 'grid' && activeChips.length > 0 && (
                            <div className="chips">
                                {activeChips.map((c, i) => (
                                    <span key={c.key ?? `star-${c.stars}`} className="chip">
                                        {chipLabel(c)}
                                        <button
                                            type="button"
                                            className="chip-x-btn"
                                            onClick={() => removeChip(i)}
                                            aria-label="Remove filter"
                                        >
                                            <span className="material-symbols-outlined chip-x">close</span>
                                        </button>
                                    </span>
                                ))}
                                <a className="chip-clear" href="#" onClick={clearChips}>{t('prod.clearAll')}</a>
                            </div>
                        )}

                        {/* message after "Clear all" */}
                        {view === 'grid' && cleared && activeChips.length === 0 && (
                            <p className="chips-msg">
                                <span className="material-symbols-outlined">check_circle</span>
                                {t('prod.cleared')}
                            </p>
                        )}

                        {loading && <p className="prod-state">{t('prod.loading')}</p>}

                        {/* ===== List or grid view ===== */}
                        {!loading && products.length > 0 && (
                            view === 'list' ? (
                                visible.map((p, i) => (
                                    <div key={p.id ?? i} className="prod-card">
                                        <img className="prod-img" src={p.img} alt={p.name} />

                                        <div className="prod-info">
                                            <h3 className="prod-name">{pickText(p.name, p.nameAr)}</h3>

                                            <div className="prod-price-row">
                                                <span className="prod-price"><bdi>{p.price}</bdi></span>
                                                {p.oldPrice && <span className="prod-old"><bdi>{p.oldPrice}</bdi></span>}
                                            </div>

                                            <div className="prod-meta">
                                                <span className="prod-stars">★★★★☆</span>
                                                <span className="prod-rate">{p.rate}</span>
                                                <span className="dot">•</span>
                                                <span>{p.orders} {t('prod.orders')}</span>
                                                <span className="dot">•</span>
                                                <span className="prod-ship">{t('prod.freeShipping')}</span>
                                            </div>

                                            <p className="prod-desc">{pickText(p.desc, p.descAr)}</p>

                                            <Link className="prod-link" to={`/detail/${p.id}`}>{t('prod.viewDetails')}</Link>
                                        </div>

                                        <button
                                            className={isFav(p.id) ? 'prod-fav is-fav' : 'prod-fav'}
                                            type="button"
                                            onClick={() => toggleFavorite(p.id)}
                                            aria-label={isFav(p.id) ? 'Remove from favorites' : 'Add to favorites'}
                                        >
                                            <span className="material-symbols-outlined">favorite</span>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="grid-wrap">
                                    {visible.map((p, i) => (
                                        <div key={p.id ?? i} className="grid-card">
                                            <img className="grid-img" src={p.img} alt={p.name} />

                                            <div className="grid-price-row">
                                                <span className="grid-price"><bdi>{p.price}</bdi></span>
                                                {p.oldPrice && <span className="grid-old"><bdi>{p.oldPrice}</bdi></span>}

                                                <button
                                                    className={isFav(p.id) ? 'grid-fav is-fav' : 'grid-fav'}
                                                    type="button"
                                                    onClick={() => toggleFavorite(p.id)}
                                                    aria-label={isFav(p.id) ? 'Remove from favorites' : 'Add to favorites'}
                                                >
                                                    <span className="material-symbols-outlined">favorite</span>
                                                </button>
                                            </div>

                                            <div className="grid-meta">
                                                <span className="rating-stars">★★★★<span className="rating-empty">★</span></span>
                                                <span className="grid-rate">{p.rate}</span>
                                            </div>

                                            <p className="grid-name">{pickText(p.name, p.nameAr)}</p>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {/* ===== Pagination ===== */}
                        <div className="pager">
                            <div className="pager-show-box">
                                <select
                                    className="pager-show"
                                    value={perPage}
                                    onChange={(e) => {
                                        setPerPage(Number(e.target.value))
                                        setPage(1)
                                    }}
                                >
                                    {[6, 10, 20, 50].map((n) => (
                                        <option key={n} value={n}>{t('prod.show')} {n}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined pager-show-arrow">keyboard_arrow_down</span>
                            </div>

                            <div className="pager-nav">
                                <button
                                    className="pager-btn"
                                    type="button"
                                    onClick={() => goPage(page - 1)}
                                    disabled={page === 1}
                                    aria-label="Previous page"
                                >
                                    <span className="material-symbols-outlined">{prevIcon}</span>
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                                    <button
                                        key={n}
                                        type="button"
                                        className={n === page ? 'pager-btn active' : 'pager-btn'}
                                        onClick={() => goPage(n)}
                                    >
                                        {n}
                                    </button>
                                ))}

                                <button
                                    className="pager-btn"
                                    type="button"
                                    onClick={() => goPage(page + 1)}
                                    disabled={page === totalPages}
                                    aria-label="Next page"
                                >
                                    <span className="material-symbols-outlined">{nextIcon}</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <Newsletter />
            <Footer />
        </>
    )
}

export default Products