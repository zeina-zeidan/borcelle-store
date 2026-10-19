import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import './Newsletter.css'

function Newsletter() {
    const { t } = useLanguage()

    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [isError, setIsError] = useState(false)

    const handleSubscribe = (e) => {
        e.preventDefault()

        // simple email check: something@something.something
        const valid = /^\S+@\S+\.\S+$/.test(email.trim())

        if (!valid) {
            setIsError(true)
            setMessage(t('news.errEmail'))
            return
        }

        setIsError(false)
        setMessage(t('news.thanks'))
        setEmail('')
    }

    return (
        <section className="news">
            <h2 className="news-title">{t('news.title')}</h2>
            <p className="news-text">{t('news.text')}</p>

            <form className="news-form" onSubmit={handleSubscribe}>
                <div className="news-input-box">
                    <span className="material-symbols-outlined news-icon">mail</span>
                    <input
                        className="news-input"
                        type="email"
                        placeholder={t('news.email')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <button className="news-btn" type="submit">{t('news.btn')}</button>
            </form>

            {message && (
                <p className={isError ? 'news-msg news-msg-error' : 'news-msg'}>{message}</p>
            )}
        </section>
    )
}

export default Newsletter