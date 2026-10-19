import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import './Footer.css'

// "to" = a real page in the app; "#" = no page yet
const footLinks = [
    {
        title: 'foot.about',
        items: [
            { label: 'foot.aboutUs', to: '#' },
            { label: 'foot.findStore', to: '#' },
            { label: 'foot.categories', to: '/products' },
            { label: 'foot.blogs', to: '#' },
        ],
    },
    {
        title: 'foot.partnership',
        items: [
            { label: 'foot.aboutUs', to: '#' },
            { label: 'foot.findStore', to: '#' },
            { label: 'foot.categories', to: '/products' },
            { label: 'foot.blogs', to: '#' },
        ],
    },
    {
        title: 'foot.information',
        items: [
            { label: 'foot.help', to: '#' },
            { label: 'foot.refund', to: '#' },
            { label: 'foot.shipping', to: '#' },
            { label: 'foot.contact', to: '/contact' },
        ],
    },
    {
        title: 'foot.forUsers',
        items: [
            { label: 'foot.login', to: '/login' },
            { label: 'foot.register', to: '/register' },
            { label: 'foot.settings', to: '/profile' },
            { label: 'foot.orders', to: '#' },
        ],
    },
]

const socials = [
    { icon: 'fa-facebook-f', name: 'Facebook' },
    { icon: 'fa-twitter', name: 'Twitter' },
    { icon: 'fa-linkedin-in', name: 'LinkedIn' },
    { icon: 'fa-instagram', name: 'Instagram' },
    { icon: 'fa-youtube', name: 'YouTube' },
]

function Footer() {
    const { theme } = useTheme()
    const { t, lang, toggleLang } = useLanguage()

    const logo = theme === 'dark' ? '/images/logo.png' : '/images/logo-dark.png'
    const year = new Date().getFullYear()

    return (
        <footer className="foot">
            <div className="foot-inner">
                <div className="foot-brand">
                    <img className="foot-logo" src={logo} alt="Borcelle" />
                    <p className="foot-desc">{t('foot.desc')}</p>
                    <div className="foot-social">
                        {socials.map((s) => (
                            <a key={s.name} href="#" aria-label={s.name}>
                                <i className={`fa-brands ${s.icon}`}></i>
                            </a>
                        ))}
                    </div>
                </div>

                {footLinks.map((col) => (
                    <div key={col.title} className="foot-col">
                        <h3 className="foot-col-title">{t(col.title)}</h3>
                        <ul className="foot-list">
                            {col.items.map((it) => (
                                <li key={it.label}>
                                    {it.to === '#'
                                        ? <a href="#">{t(it.label)}</a>
                                        : <Link to={it.to}>{t(it.label)}</Link>}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}

                <div className="foot-col">
                    <h3 className="foot-col-title">{t('foot.getApp')}</h3>
                    <img className="foot-app" src="/images/appstore.png" alt="App Store" />
                    <img className="foot-app" src="/images/googleplay.png" alt="Google Play" />
                </div>
            </div>

            <div className="foot-bottom">
                <div className="foot-bottom-inner">
                    <span>© {year} Ecommerce.</span>

                    {/* language switch — same as the button in the header */}
                    <button type="button" className="foot-lang" onClick={toggleLang}>
                        <img
                            src={lang === 'ar' ? '/images/flag-ae.png' : '/images/flag-us.png'}
                            alt=""
                        />
                        {lang === 'ar' ? 'العربية' : 'English'}
                        <span className="material-symbols-outlined">swap_vert</span>
                    </button>
                </div>
            </div>
        </footer>
    )
}

export default Footer