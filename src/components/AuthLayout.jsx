import SettingsToggles from './SettingsToggles'
import { useLanguage } from '../context/LanguageContext'
import './AuthLayout.css'

function AuthLayout({ children }) {
    const { t } = useLanguage()

    return (
        <div className="login-page">
            <div className="row g-0 login-card">

                <div className="col-12 col-lg-7 login-left">
                    <img src="/images/login-bg.jpg" alt="" className="login-bg" />
                    <div className="login-overlay">
                        <img src="/images/logo.png" alt="Borcelle" className="login-logo" />
                        <h1 className="login-title">{t('auth.title')}</h1>
                        <p className="login-text">{t('auth.text')}</p>
                    </div>
                </div>

                <div className="col-12 col-lg-5 login-right">
                    {/* theme + language buttons — top corner of the form side */}
                    <SettingsToggles className="auth-toggles" />
                    {children}
                </div>

            </div>
        </div>
    )
}

export default AuthLayout