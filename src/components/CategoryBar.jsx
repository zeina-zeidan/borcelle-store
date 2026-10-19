import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../service/api'
import { useLanguage } from '../context/LanguageContext'
import './CategoryBar.css'

// Data source — false: Figma sample data, true: live API
const USE_API = false

const links = ['cat.hotOffers', 'cat.giftBoxes', 'cat.aboutUs']

// Figma categories — "key" for the translated label,
// "name" stays English because Products filters by it
const defaultCategories = [
    { id: 'c1', name: 'Mobile accessory', key: 'cat.mobile' },
    { id: 'c2', name: 'Electronics', key: 'cat.electronics' },
    { id: 'c3', name: 'Smartphones', key: 'cat.smartphones' },
    { id: 'c4', name: 'Modern tech', key: 'cat.modernTech' },
    { id: 'c5', name: 'Home interiors', key: 'cat.interiors' },
    { id: 'c6', name: 'Computer and tech', key: 'cat.computer' },
]

// find the array however the API wraps it
const extractList = (raw) => {
    if (Array.isArray(raw)) return raw
    if (Array.isArray(raw?.data)) return raw.data
    if (Array.isArray(raw?.data?.data)) return raw.data.data
    if (Array.isArray(raw?.categories)) return raw.categories
    return []
}

// one shape for every category
const normalize = (c) => ({
    id: c.id ?? c.category_id ?? c.name,
    name: c.name ?? c.title ?? c.category_name ?? 'Category',
})

function CategoryBar() {
    const navigate = useNavigate()
    const boxRef = useRef(null)
    const { t, lang, toggleLang } = useLanguage()

    const [categories, setCategories] = useState(defaultCategories)
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // sticky on scroll: spot keeps the place, bar becomes fixed at the top
    const spotRef = useRef(null)
    const barRef = useRef(null)
    const [fixed, setFixed] = useState(false)
    const [barH, setBarH] = useState(0)

    useEffect(() => {
        const onScroll = () => {
            if (!spotRef.current || !barRef.current) return
            setBarH(barRef.current.offsetHeight)
            setFixed(spotRef.current.getBoundingClientRect().top <= 0)
        }

        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('resize', onScroll)

        return () => {
            window.removeEventListener('scroll', onScroll)
            window.removeEventListener('resize', onScroll)
        }
    }, [])

    // load categories from the server
    useEffect(() => {
        if (!USE_API) return

        let alive = true
        setLoading(true)

        api.get('/category')
            .then((res) => {
                if (!alive) return
                const list = extractList(res.data).map(normalize)
                if (list.length > 0) setCategories(list)
            })
            .catch(() => {
                // keep the Figma categories
            })
            .finally(() => {
                if (alive) setLoading(false)
            })

        return () => { alive = false }
    }, [])

    // close the menu when clicking outside it
    useEffect(() => {
        if (!open) return

        const handleClick = (e) => {
            if (boxRef.current && !boxRef.current.contains(e.target)) {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    const pick = (cat) => {
        setOpen(false)
        navigate('/products', { state: { category: cat.name } })
    }

    return (
        <div ref={spotRef} style={{ height: fixed ? barH : undefined }}>
            <div ref={barRef} className={`catbar ${fixed ? 'is-fixed' : ''}`}>
                <div className="catbar-inner">

                    <div className="catbar-all-box" ref={boxRef}>
                        <button
                            type="button"
                            className="catbar-all"
                            onClick={() => setOpen(!open)}
                        >
                            <span className="material-symbols-outlined">menu</span>
                            {t('cat.all')}
                        </button>

                        {open && (
                            <ul className="catbar-menu">
                                {loading && <li className="catbar-menu-state">{t('cat.loading')}</li>}

                                {!loading && categories.map((c) => (
                                    <li key={c.id}>
                                        <button type="button" onClick={() => pick(c)}>
                                            {c.key ? t(c.key) : c.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="catbar-links">
                        {links.map((key) => (
                            <a key={key} href="#">{t(key)}</a>
                        ))}
                    </div>

                    <div className="catbar-help">
                        {t('cat.help')}
                        <span className="material-symbols-outlined">keyboard_arrow_down</span>
                    </div>

                    {/* language switch — same as the button in the header */}
                    <button type="button" className="catbar-lang" onClick={toggleLang}>
                        {lang === 'ar' ? 'العربية، USD' : 'English, USD'}
                        <span className="material-symbols-outlined">swap_horiz</span>
                    </button>

                </div>
            </div>
        </div>
    )
}

export default CategoryBar