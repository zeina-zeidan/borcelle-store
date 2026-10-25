import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SideMenu from './SideMenu'
import SettingsToggles from './SettingsToggles'
import api from '../service/api'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import './Header.css'

// Data source — false: local sample data, true: live API
const USE_API = false

// unread count shown in Figma mode
const FIGMA_COUNT = 0

const LOGO_ON_LIGHT = '/images/logo-dark.png'
const LOGO_ON_DARK = '/images/logo.png'

// the API may return the list in different shapes
const extractList = (raw) => {
    if (Array.isArray(raw)) return raw
    if (Array.isArray(raw?.data)) return raw.data
    if (Array.isArray(raw?.data?.data)) return raw.data.data
    if (Array.isArray(raw?.notifications)) return raw.notifications
    return []
}

// count only unread notifications (if the API tells us which are read)
const countUnread = (list) => {
    const hasReadFlag = list.some(
        (n) => 'read_at' in n || 'is_read' in n || 'read' in n
    )
    if (!hasReadFlag) return list.length
    return list.filter((n) => !n.read_at && !n.is_read && !n.read).length
}

function Header({ onCartClick, simple }) {
    const { theme } = useTheme()
    const { t } = useLanguage()

    const [menuOpen, setMenuOpen] = useState(false)
    const [unread, setUnread] = useState(FIGMA_COUNT)

    // lock page scroll while the side menu is open
    useEffect(() => {
        const value = menuOpen ? 'hidden' : ''
        document.body.style.overflow = value
        return () => { document.body.style.overflow = '' }
    }, [menuOpen])

    // unread notifications badge
    useEffect(() => {
        if (!USE_API) return

        // no token = visitor → skip, otherwise the 401 would redirect to /login
        const token = localStorage.getItem('token')
        if (!token) return

        let alive = true

        api.get('/notification')
            .then((res) => {
                if (!alive) return
                setUnread(countUnread(extractList(res.data)))
            })
            .catch((err) => {
            })

        return () => { alive = false }
    }, [])

    const badgeText = unread > 9 ? '9+' : String(unread)
    const isDark = theme === 'dark'

    return (
        <header className={simple ? 'header header-simple' : 'header'}>
            <div className="header-inner">

                <button className="burger" onClick={() => setMenuOpen(true)} aria-label="Menu">
                    <span className="material-symbols-outlined">menu</span>
                </button>

                <Link to="/">
                    <img
                        src={isDark ? LOGO_ON_DARK : LOGO_ON_LIGHT}
                        alt="Borcelle"
                        className="header-logo"
                        onError={(e) => {
                            // if the dark-mode logo is missing, fall back to the normal one
                            if (!e.currentTarget.src.endsWith(LOGO_ON_LIGHT)) {
                                e.currentTarget.src = LOGO_ON_LIGHT
                            }
                        }}
                    />
                </Link>

                {!simple && (
                    <div className="header-search search-box">
                        <input
                            type="text"
                            className="header-search-input"
                            placeholder={t('header.search')}
                        />
                        <div className="header-category-box">
                            <select className="header-category">
                                <option>{t('header.allCategory')}</option>
                            </select>
                            <span className="material-symbols-outlined header-arrow">keyboard_arrow_down</span>
                        </div>
                        <button type="button" className="header-search-btn">
                            {t('header.searchBtn')}
                        </button>
                    </div>
                )}

                <nav className="header-nav">
                    <Link to="/profile" className="header-link">
                        <span className="material-symbols-outlined">person</span>
                        <span>{t('header.profile')}</span>
                    </Link>

                    <Link
                        to="/messages"
                        className="header-link"
                        aria-label={unread > 0 ? `Messages, ${unread} unread` : 'Messages'}
                    >
                        <span className="header-icon-wrap">
                            <span className="material-symbols-outlined">chat</span>
                            {unread > 0 && <span className="header-badge">{badgeText}</span>}
                        </span>
                        <span>{t('header.message')}</span>
                    </Link>

                    <Link to="/orders" className="header-link">
                        <span className="material-symbols-outlined">favorite</span>
                        <span>{t('header.orders')}</span>
                    </Link>

                    <Link
                        to="/cart"
                        className="header-link"
                        onClick={(e) => {
                            if (onCartClick) {
                                e.preventDefault()
                                onCartClick()
                            }
                        }}
                    >
                        <span className="material-symbols-outlined">shopping_cart</span>
                        <span>{t('header.cart')}</span>
                    </Link>
                </nav>

                {/* theme + language buttons — after "My cart" */}
                <SettingsToggles />

            </div>

            <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
        </header>
    )
}

export default Header