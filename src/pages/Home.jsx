import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import CategoryBar from '../components/CategoryBar'
import Newsletter from '../components/Newsletter'
import Footer from '../components/Footer'
import api from '../service/api'
import { useLanguage } from '../context/LanguageContext'
import './Home.css'

// Data source — false: Figma sample data, true: live API
const USE_API = false

// ===== Left categories =====
// key: translated label — name: English name Products filters by
const categories = [
    { key: 'home.cat.auto', name: 'Automobiles' },
    { key: 'home.cat.clothes', name: 'Clothes and wear' },
    { key: 'home.cat.interiors', name: 'Home interiors' },
    { key: 'home.cat.tech', name: 'Computer and tech' },
    { key: 'home.cat.tools', name: 'Tools, equipments' },
    { key: 'home.cat.sports', name: 'Sports and outdoor' },
    { key: 'home.cat.pets', name: 'Animal and pets' },
    { key: 'home.cat.machinery', name: 'Machinery tools' },
    { key: 'home.cat.more', name: '' }, // "More category" → all products
]

// Figma slide — empty texts = use the translated defaults
const figmaSlides = [{ id: 's1', small: '', title: '', button: '', image: '' }]

const timer = [
    { num: '04', label: 'home.days' },
    { num: '13', label: 'home.hour' },
    { num: '34', label: 'home.min' },
    { num: '56', label: 'home.sec' },
]

const services = [
    { title: 'home.serv1', icon: 'search', img: '/images/service1.png' },
    { title: 'home.serv2', icon: 'inventory_2', img: '/images/service2.png' },
    { title: 'home.serv3', icon: 'send', img: '/images/service3.png' },
    { title: 'home.serv4', icon: 'verified_user', img: '/images/service4.png' },
]

const units = ['home.unitPcs', 'home.unitKg', 'home.unitBox']

// ===== Sample product data — English + Arabic =====
// (server data comes in one language → the English field is shown)
const deals = [
    { name: 'Smart watch', nameAr: 'ساعة ذكية', off: '-25%', img: '/images/watch.png' },
    { name: 'Laptop', nameAr: 'لابتوب', off: '-15%', img: '/images/laptop.png' },
    { name: 'GoPro camera', nameAr: 'كاميرا GoPro', off: '-40%', img: '/images/camera.png' },
    { name: 'Headphones', nameAr: 'سماعات', off: '-25%', img: '/images/headphone.png' },
    { name: 'Canon camera', nameAr: 'كاميرا كانون', off: '-25%', img: '/images/phone.png' },
]

const blocks = [
    {
        title: 'home.block1',
        bg: '/images/home-bg.png',
        items: [
            { name: 'Soft chairs', nameAr: 'كراسي مريحة', price: 'USD 19', img: '/images/chair.png' },
            { name: 'Sofa & chair', nameAr: 'كنب وكراسي', price: 'USD 19', img: '/images/sofa.png' },
            { name: 'Kitchen dishes', nameAr: 'أطباق المطبخ', price: 'USD 19', img: '/images/dishes.png' },
            { name: 'Smart watches', nameAr: 'ساعات ذكية', price: 'USD 19', img: '/images/pot.png' },
            { name: 'Kitchen mixer', nameAr: 'خلاط المطبخ', price: 'USD 100', img: '/images/mixer.png' },
            { name: 'Blenders', nameAr: 'خلاطات', price: 'USD 39', img: '/images/blender.png' },
            { name: 'Home appliance', nameAr: 'أجهزة منزلية', price: 'USD 19', img: '/images/appliance.png' },
            { name: 'Coffee maker', nameAr: 'آلة قهوة', price: 'USD 10', img: '/images/plant.png' },
        ],
    },
    {
        title: 'home.block2',
        bg: '/images/electronics-bg.png',
        items: [
            { name: 'Smart watches', nameAr: 'ساعات ذكية', price: 'USD 19', img: '/images/watch.png' },
            { name: 'Cameras', nameAr: 'كاميرات', price: 'USD 89', img: '/images/camera2.png' },
            { name: 'Headphones', nameAr: 'سماعات', price: 'USD 10', img: '/images/headphone2.png' },
            { name: 'Smart watches', nameAr: 'ساعات ذكية', price: 'USD 90', img: '/images/kettle.png' },
            { name: 'Gaming set', nameAr: 'أدوات الألعاب', price: 'USD 35', img: '/images/gaming.png' },
            { name: 'Laptops & PC', nameAr: 'لابتوبات وكمبيوترات', price: 'USD 340', img: '/images/laptop2.png' },
            { name: 'Smartphones', nameAr: 'هواتف ذكية', price: 'USD 19', img: '/images/tablet.png' },
            { name: 'Electric kettle', nameAr: 'غلاية كهربائية', price: 'USD 240', img: '/images/kettle2.png' },
        ],
    },
]

const recommended = [
    { price: '$10.30', desc: 'T-shirts with multiple colors, for men', descAr: 'قمصان رجالية بألوان متعددة', img: '/images/tshirt.png' },
    { price: '$10.30', desc: 'Jeans shorts for men blue color', descAr: 'شورت جينز رجالي أزرق', img: '/images/jacket.png' },
    { price: '$12.50', desc: 'Brown winter coat medium size', descAr: 'معطف شتوي بني مقاس وسط', img: '/images/suit.png' },
    { price: '$34.00', desc: 'Jeans bag for travel for men', descAr: 'حقيبة جينز للسفر', img: '/images/wallet.png' },
    { price: '$99.00', desc: 'Leather wallet', descAr: 'محفظة جلدية', img: '/images/backpack.png' },
    { price: '$9.99', desc: 'Canon camera black, 100x zoom', descAr: 'كاميرا كانون سوداء بزوم 100x', img: '/images/shorts.png' },
    { price: '$8.99', desc: 'Headset for gaming with mic', descAr: 'سماعة ألعاب مع مايك', img: '/images/headset.png' },
    { price: '$10.30', desc: 'Smartwatch silver color modern', descAr: 'ساعة ذكية فضية عصرية', img: '/images/backpack2.png' },
    { price: '$10.30', desc: 'Blue wallet for men leather metarfial', descAr: 'محفظة رجالية زرقاء من الجلد', img: '/images/pot2.png' },
    { price: '$80.95', desc: 'Jeans bag for travel for men', descAr: 'حقيبة جينز للسفر', img: '/images/kettle2.png' },
]

const suppliers = [
    { name: 'Arabic Emirates', nameAr: 'الإمارات', site: 'shopname.ae', flag: '/images/flag-ae.png' },
    { name: 'Australia', nameAr: 'أستراليا', site: 'shopname.ae', flag: '/images/flag-au.png' },
    { name: 'United States', nameAr: 'الولايات المتحدة', site: 'shopname.ae', flag: '/images/flag-us.png' },
    { name: 'Russia', nameAr: 'روسيا', site: 'shopname.ru', flag: '/images/flag-ru.png' },
    { name: 'Italy', nameAr: 'إيطاليا', site: 'shopname.it', flag: '/images/flag-it.png' },
    { name: 'Denmark', nameAr: 'الدنمارك', site: 'denmark.com.dk', flag: '/images/flag-dk.png' },
    { name: 'France', nameAr: 'فرنسا', site: 'shopname.com.fr', flag: '/images/flag-fr.png' },
    { name: 'Arabic Emirates', nameAr: 'الإمارات', site: 'shopname.ae', flag: '/images/flag-ae.png' },
    { name: 'China', nameAr: 'الصين', site: 'shopname.ae', flag: '/images/flag-cn.png' },
    { name: 'Great Britain', nameAr: 'بريطانيا', site: 'shopname.co.uk', flag: '/images/flag-gb.png' },
]

const cartItems = [
    { name: 'Backed Bread', nameAr: 'خبز مخبوز', desc: 'Special GoPro cameras', descAr: 'كاميرات GoPro مميزة', price: '600 AED', qty: 2, img: '/images/watch.png' },
    { name: 'Greeze Face Wipe', nameAr: 'مناديل للوجه', desc: 'Special GoPro cameras', descAr: 'كاميرات GoPro مميزة', price: '600 AED', qty: 2, img: '/images/laptop.png' },
    { name: 'GoPro Cameras', nameAr: 'كاميرات GoPro', desc: 'Special GoPro cameras', descAr: 'كاميرات GoPro مميزة', price: '600 AED', qty: 2, img: '/images/headphone.png' },
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

const extractList = (raw) => {
    if (Array.isArray(raw)) return raw
    if (Array.isArray(raw?.data)) return raw.data
    if (Array.isArray(raw?.data?.data)) return raw.data.data
    if (Array.isArray(raw?.sliders)) return raw.sliders
    return []
}

// missing texts stay empty → the translated defaults are shown
const normalizeSlide = (s, i) => ({
    id: s.id ?? i,
    small: s.subtitle ?? s.sub_title ?? s.small ?? '',
    title: s.title ?? s.name ?? s.text ?? '',
    button: s.button_text ?? s.btn ?? '',
    image: fullImage(s.image ?? s.img ?? s.photo ?? s.banner),
})

function Home() {
    const navigate = useNavigate()
    const { t, lang } = useLanguage()

    // show the Arabic text when it exists, otherwise the English one
    const pickText = (en, ar) => (lang === 'ar' && ar ? ar : en)

    // open Products filtered by a category (empty name → all products)
    const openCategory = (name) => {
        if (name) navigate('/products', { state: { category: name } })
        else navigate('/products')
    }

    const [cartOpen, setCartOpen] = useState(false)
    const isLoggedIn = Boolean(localStorage.getItem('token'))

    // ===== banner slides =====
    const [slides, setSlides] = useState(figmaSlides)
    const [current, setCurrent] = useState(0)

    useEffect(() => {
        if (!USE_API) return

        let alive = true

        api.get('/slider')
            .then((res) => {
                if (!alive) return
                const list = extractList(res.data).map(normalizeSlide)
                if (list.length > 0) setSlides(list)
            })
            .catch(() => {
                // keep the Figma slide
            })

        return () => { alive = false }
    }, [])

    // change slide every 5 seconds
    useEffect(() => {
        if (slides.length < 2) return

        const id = setInterval(() => {
            setCurrent((c) => (c + 1) % slides.length)
        }, 5000)

        return () => clearInterval(id)
    }, [slides.length])

    const slide = slides[current] ?? figmaSlides[0]

    // lock page scroll while the cart panel is open
    useEffect(() => {
        const value = cartOpen ? 'hidden' : ''
        document.body.style.overflow = value
        document.documentElement.style.overflow = value

        return () => {
            document.body.style.overflow = ''
            document.documentElement.style.overflow = ''
        }
    }, [cartOpen])

    return (
        <>
            <Header onCartClick={() => setCartOpen(true)} />
            <CategoryBar />

            <div className="home-page">

                {/* ===== 1. Banner ===== */}
                <section className="banner">
                    <ul className="banner-list">
                        {categories.map((c, i) => (
                            <li
                                key={c.key}
                                className={i === 0 ? 'banner-item active' : 'banner-item'}
                                onClick={() => openCategory(c.name)}
                            >
                                {t(c.key)}
                            </li>
                        ))}
                    </ul>

                    <div
                        className="banner-hero"
                        style={slide.image ? {
                            backgroundImage: `url(${slide.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        } : undefined}
                    >
                        <p className="banner-small">{slide.small || t('home.slideSmall')}</p>
                        <h2 className="banner-title">{slide.title || t('home.slideTitle')}</h2>
                        <button className="banner-btn" type="button">
                            {slide.button || t('home.learnMore')}
                        </button>
                    </div>

                    <div className="banner-side">
                        <div className="side-card side-user">
                            <div className="side-user-top">
                                <span className="material-symbols-outlined side-avatar">account_circle</span>
                                <p className="side-hi pre-line">
                                    {isLoggedIn ? t('home.hiBack') : t('home.hiUser')}
                                </p>
                            </div>

                            {!isLoggedIn && (
                                <>
                                    <button className="side-join" type="button" onClick={() => navigate('/login')}>
                                        {t('home.joinNow')}
                                    </button>
                                    <button className="side-login" type="button" onClick={() => navigate('/login')}>
                                        {t('home.login')}
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="side-card side-orange pre-line">{t('home.sideOrange')}</div>
                        <div className="side-card side-pink pre-line">{t('home.sidePink')}</div>
                    </div>
                </section>

                {/* ===== 2. Deals and offers ===== */}
                <section className="deals">
                    <div className="deals-left">
                        <h3 className="deals-title">{t('home.dealsTitle')}</h3>
                        <p className="deals-text">{t('home.dealsText')}</p>
                        <div className="deals-timer">
                            {timer.map((item) => (
                                <div key={item.label} className="timer-box">
                                    <span className="timer-num">{item.num}</span>
                                    <span className="timer-label">{t(item.label)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {deals.map((d) => (
                        <div key={d.name} className="deal-card">
                            <img className="deal-img" src={d.img} alt={d.name} />
                            <p className="deal-name">{pickText(d.name, d.nameAr)}</p>
                            <span className="deal-badge"><bdi>{d.off}</bdi></span>
                        </div>
                    ))}
                </section>

                {/* ===== 3 & 4. Category blocks ===== */}
                {blocks.map((block) => (
                    <section key={block.title} className="block">
                        <div className="block-left">
                            <img className="block-bg" src={block.bg} alt="" />
                            <h3 className="block-title">{t(block.title)}</h3>
                            <button className="block-btn" type="button">{t('home.sourceNow')}</button>
                        </div>

                        <div className="block-grid">
                            {block.items.map((item, i) => (
                                <div key={item.name + i} className="block-cell">
                                    <div>
                                        <p className="cell-name">{pickText(item.name, item.nameAr)}</p>
                                        <p className="cell-price">
                                            {t('home.from')} <bdi>{item.price}</bdi>
                                        </p>
                                    </div>
                                    <img className="cell-img" src={item.img} alt={item.name} />
                                </div>
                            ))}
                        </div>
                    </section>
                ))}

                {/* ===== 5. Quote request ===== */}
                <section className="quote">
                    <div className="quote-left">
                        <h2 className="quote-title pre-line">{t('home.quoteTitle')}</h2>
                        <p className="quote-text">{t('home.quoteText')}</p>
                    </div>

                    <div className="quote-form">
                        <h3 className="quote-form-title">{t('home.quoteFormTitle')}</h3>

                        <input className="quote-input" type="text" placeholder={t('home.quoteItem')} />

                        <textarea className="quote-textarea" placeholder={t('home.quoteDetails')}></textarea>

                        <div className="quote-row">
                            <input className="quote-qty" type="text" placeholder={t('home.quoteQty')} />
                            <div className="quote-select-box">
                                <select className="quote-select">
                                    {units.map((key) => (
                                        <option key={key}>{t(key)}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined quote-arrow">keyboard_arrow_down</span>
                            </div>
                        </div>

                        <button className="quote-btn" type="button">{t('home.quoteSend')}</button>
                    </div>
                </section>

                {/* ===== 6. Recommended items ===== */}
                <section className="recom">
                    <h2 className="recom-title">{t('home.recomTitle')}</h2>

                    <div className="recom-grid">
                        {recommended.map((item, i) => (
                            <div
                                key={i}
                                className="recom-card"
                                onClick={() =>
                                    navigate('/detail', {
                                        state: {
                                            product: {
                                                name: item.desc,
                                                nameAr: item.descAr,
                                                price: item.price,
                                                img: item.img,
                                            },
                                        },
                                    })
                                }
                            >
                                <div className="recom-img-box">
                                    <img className="recom-img" src={item.img} alt={item.desc} />
                                </div>
                                <p className="recom-price"><bdi>{item.price}</bdi></p>
                                <p className="recom-desc">{pickText(item.desc, item.descAr)}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ===== 7. Extra services ===== */}
                <section className="serv">
                    <h2 className="serv-title">{t('home.servTitle')}</h2>

                    <div className="serv-grid">
                        {services.map((s) => (
                            <div key={s.title} className="serv-card">
                                <div className="serv-img-box">
                                    <img className="serv-img" src={s.img} alt="" />
                                    <span className="material-symbols-outlined serv-icon">{s.icon}</span>
                                </div>
                                <p className="serv-text pre-line">{t(s.title)}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ===== 8. Suppliers by region ===== */}
                <section className="sup">
                    <h2 className="sup-title">{t('home.supTitle')}</h2>

                    <div className="sup-grid">
                        {suppliers.map((s, i) => (
                            <div key={i} className="sup-item">
                                <img className="sup-flag" src={s.flag} alt={s.name} />
                                <div>
                                    <p className="sup-name">{pickText(s.name, s.nameAr)}</p>
                                    <p className="sup-site">{s.site}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </div>

            <Newsletter />
            <Footer />

            {/* ===== Side shopping bag ===== */}
            {cartOpen && (
                <div className="cart-overlay" onClick={() => setCartOpen(false)}>
                    <aside className="cart-panel" onClick={(e) => e.stopPropagation()}>

                        <div className="cart-head">
                            <h2 className="cart-title">{t('home.bagTitle')}</h2>
                            <button
                                className="cart-close"
                                type="button"
                                onClick={() => setCartOpen(false)}
                                aria-label="Close"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="cart-list">
                            {cartItems.map((item, i) => (
                                <div key={i} className="cart-item">
                                    <div className="cart-img-box">
                                        <img className="cart-img" src={item.img} alt={item.name} />
                                        <span className="cart-badge">{item.qty}</span>
                                    </div>

                                    <div className="cart-info">
                                        <h3 className="cart-name">{pickText(item.name, item.nameAr)}</h3>
                                        <p className="cart-desc">{pickText(item.desc, item.descAr)}</p>

                                        <div className="cart-actions">
                                            <div className="qty-box">
                                                <button className="qty-btn" type="button">−</button>
                                                <span className="qty-num">{item.qty}</span>
                                                <button className="qty-btn" type="button">+</button>
                                            </div>
                                            <button className="cart-del" type="button" aria-label="Delete">
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    </div>

                                    <span className="cart-price"><bdi>{item.price}</bdi></span>
                                </div>
                            ))}
                        </div>

                        <div className="cart-total">
                            <span>{t('home.subtotal')}</span>
                            <span className="cart-total-price"><bdi>600 AED</bdi></span>
                        </div>

                        <button className="cart-checkout" type="button" onClick={() => navigate('/cart')}>
                            {t('home.checkout')}
                        </button>

                    </aside>
                </div>
            )}
        </>
    )
}

export default Home