import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import './SideMenu.css'

const links = [
    { to: '/', icon: 'home', label: 'menu.home' },
    { to: '/products', icon: 'list', label: 'menu.categories' },
    { to: '/profile', icon: 'favorite', label: 'menu.favorites' },
    { to: '/orders', icon: 'receipt_long', label: 'menu.orders' },
]

const extra = ['menu.agreement', 'menu.partnership', 'menu.privacy']

function SideMenu({ open, onClose }) {
    const { t, lang, toggleLang } = useLanguage()

    if (!open) return null

    return (
        <>
            <div className="menu-overlay" onClick={onClose}></div>

            <aside className="side-menu">
                <div className="menu-top">
                    <span className="material-symbols-outlined menu-avatar">person</span>
                    <Link to="/login" className="menu-signin" onClick={onClose}>{t('menu.signin')}</Link>
                </div>

                <nav className="menu-links">
                    {links.map((l) => (
                        <Link to={l.to} className="menu-link" key={l.label} onClick={onClose}>
                            <span className="material-symbols-outlined">{l.icon}</span>
                            {t(l.label)}
                        </Link>
                    ))}
                </nav>

                <div className="menu-sep"></div>

                <nav className="menu-links">
                    {/* language switch — same as the header button */}
                    <button type="button" className="menu-link menu-lang" onClick={toggleLang}>
                        <span className="material-symbols-outlined">language</span>
                        {lang === 'ar' ? 'العربية | USD' : 'English | USD'}
                    </button>
                    <Link to="/contact" className="menu-link" onClick={onClose}>
                        <span className="material-symbols-outlined">headset_mic</span>{t('menu.contact')}
                    </Link>
                    <Link to="/terms" className="menu-link" onClick={onClose}>
                        <span className="material-symbols-outlined">info</span>{t('menu.about')}
                    </Link>
                </nav>

                <div className="menu-sep"></div>

                <nav className="menu-extra">
                    {extra.map((key) => <span key={key}>{t(key)}</span>)}
                </nav>
            </aside>
        </>
    )
}

export default SideMenu