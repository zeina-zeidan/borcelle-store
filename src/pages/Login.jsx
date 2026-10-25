import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import api from '../service/api'
import { useLanguage } from '../context/LanguageContext'
import './Login.css'

function Login() {
    const navigate = useNavigate()
    const { t } = useLanguage()

    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        const trimmedPhone = phone.trim()

        // لازم يكون في رقم
        if (!trimmedPhone) {
            setError(t('login.errPhone'))
            return
        }

        // لازم يكون 8 أرقام على الأقل (أرقام فقط)
        const digitsOnly = trimmedPhone.replace(/\D/g, '')
        if (digitsOnly.length < 10) {
            setError(t('login.errShort') || 'Phone number must be at least 8 digits')
            return
        }

        setLoading(true)

        try {
            await api.post('/login', { phone: trimmedPhone })
            navigate('/verify', { state: { phone: trimmedPhone } })
        } catch (err) {
            setError(err.response?.data?.message || t('login.errSend'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout>
            <form className="login-form" onSubmit={handleSubmit}>
                <h2 className="login-welcome">{t('login.title')}</h2>
                <p className="login-subtitle">{t('login.subtitle')}</p>

                <div className="login-input-box">
                    <input
                        type="tel"
                        inputMode="numeric"
                        className="login-input"
                        placeholder={t('login.phone')}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                    <span className="material-symbols-outlined login-icon icon-flip">call</span>
                </div>

                {error && <p className="login-error">{error}</p>}

                <button type="submit" className="btn login-btn w-100" disabled={loading}>
                    {loading ? t('login.sending') : t('login.btn')}
                </button>
            </form>
        </AuthLayout>
    )
}

export default Login