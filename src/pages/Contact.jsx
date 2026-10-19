import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import api from '../service/api'
import { useLanguage } from '../context/LanguageContext'
import './Contact.css'

// ╔══════════════════════════════════════════════════════╗
// ║  false → بلا إرسال فعلي   ·   true → إرسال للسيرفر   ║
const USE_API = false
// ╚══════════════════════════════════════════════════════╝

function Contact() {
    const navigate = useNavigate()
    const { t } = useLanguage()

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')

    const [sending, setSending] = useState(false)
    const [error, setError] = useState('')
    const [sent, setSent] = useState(false)

    // رسالة النجاح بتختفي بعد تلات ثواني
    useEffect(() => {
        if (!sent) return
        const timer = setTimeout(() => setSent(false), 3000)
        return () => clearTimeout(timer)
    }, [sent])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSent(false)

        // ═══ تحقّق قبل الإرسال ═══
        if (!name.trim()) {
            setError(t('contact.errName'))
            return
        }
        if (!email.trim()) {
            setError(t('contact.errEmail'))
            return
        }
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
            setError(t('contact.errEmailValid'))
            return
        }
        if (message.trim().length < 5) {
            setError(t('contact.errShort'))
            return
        }

        const payload = {
            name: name.trim(),
            email: email.trim(),
            message: message.trim(),
        }

        if (!USE_API) {
            console.log('CONTACT (local) →', payload)
            setSent(true)
            setName('')
            setEmail('')
            setMessage('')
            return
        }

        setSending(true)

        try {
            const res = await api.post('/contact', payload)
            console.log('CONTACT OK →', JSON.stringify(res.data).slice(0, 300))

            setSent(true)
            setName('')          // 👈 تفريغ الحقول بعد النجاح
            setEmail('')
            setMessage('')
        } catch (err) {
            console.log('CONTACT ERROR →', err.response?.status, JSON.stringify(err.response?.data))

            const fieldErrors = err.response?.data?.errors
            const firstField = fieldErrors && Object.values(fieldErrors)[0]

            setError(
                (Array.isArray(firstField) ? firstField[0] : firstField) ||
                err.response?.data?.message ||
                t('contact.errSend')
            )
        } finally {
            setSending(false)
        }
    }

    return (
        <>
            <Header />

            <div className="contact-page">
                <div className="contact-card">

                    <div className="contact-banner">
                        <button type="button" className="contact-back" onClick={() => navigate(-1)}>
                            <span className="material-symbols-outlined">play_arrow</span>
                        </button>
                        <h2 className="contact-title">{t('contact.title')}</h2>
                    </div>

                    <form className="contact-form" onSubmit={handleSubmit}>

                        <div className="contact-field">
                            <input
                                type="text"
                                className="contact-input"
                                placeholder={t('contact.name')}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <span className="material-symbols-outlined contact-icon">account_circle</span>
                        </div>

                        <div className="contact-field">
                            <input
                                type="email"
                                className="contact-input"
                                placeholder={t('contact.email')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <span className="material-symbols-outlined contact-icon">mail</span>
                        </div>

                        <div className="contact-field">
                            <textarea
                                className="contact-textarea"
                                placeholder={t('contact.message')}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            ></textarea>
                            <span className="material-symbols-outlined contact-icon contact-icon-top">chat</span>
                        </div>

                        {error && <p className="contact-error">{error}</p>}

                        {sent && <p className="contact-sent">✓ {t('contact.sent')}</p>}

                        <button type="submit" className="btn contact-send" disabled={sending}>
                            {sending ? t('contact.sending') : t('contact.send')}
                        </button>

                    </form>
                </div>
            </div>
        </>
    )
}

export default Contact