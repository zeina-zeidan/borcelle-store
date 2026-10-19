import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import api from '../service/api'
import { useLanguage } from '../context/LanguageContext'
import './Terms.css'

// Data source — false: Figma sample data, true: live API
const USE_API = false

// content in an array, rendered with map instead of repeating the code
const sections = [
    { title: 'terms.s1Title', text: 'terms.text' },
    { title: 'terms.s2Title', text: 'terms.text' },
    { title: 'terms.s1Title', text: 'terms.text' },
    { title: 'terms.s3Title', text: 'terms.text' },
    { title: 'terms.s1Title', text: 'terms.text' },
]

// ===== Helpers =====

// the endpoint may return plain text, or an object with the field
const extractValue = (raw) => {
    const d = raw?.data?.data ?? raw?.data ?? raw
    if (typeof d === 'string') return d
    return (
        d?.value ?? d?.content ?? d?.text ?? d?.body ??
        d?.terms_and_conditions ?? d?.setting?.value ?? ''
    )
}

// removes HTML tags and splits the text into paragraphs
const toParagraphs = (raw) => {
    if (!raw) return []

    const clean = String(raw)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .trim()

    return clean
        .split(/\n\s*\n|\n/)
        .map((p) => p.trim())
        .filter(Boolean)
}

function Terms() {
    const navigate = useNavigate()
    const { t } = useLanguage()

    const [paragraphs, setParagraphs] = useState([])
    const [loading, setLoading] = useState(USE_API)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!USE_API) return

        let alive = true

        api.get('/setting/terms_and_conditions')
            .then((res) => {
                if (!alive) return
                setParagraphs(toParagraphs(extractValue(res.data)))
            })
            .catch(() => {
                if (!alive) return
                setError(t('terms.error'))
            })
            .finally(() => {
                if (alive) setLoading(false)
            })

        return () => { alive = false }
    }, [])

    // text from the server? show it. Otherwise show the Figma copy
    const hasApiText = paragraphs.length > 0

    return (
        <>
            <Header />

            <div className="terms-page">
                <div className="terms-card">

                    <div className="terms-banner">
                        <button
                            type="button"
                            className="terms-back"
                            onClick={() => navigate(-1)}
                            aria-label={t('terms.back')}
                        >
                            <span className="material-symbols-outlined">play_arrow</span>
                        </button>
                        <h2 className="terms-title">{t('terms.title')}</h2>
                    </div>

                    <div className="terms-content">

                        {loading && <p className="terms-state">{t('terms.loading')}</p>}

                        {!loading && error && <p className="terms-state terms-state-err">{error}</p>}

                        {!loading && hasApiText && (
                            <div className="terms-section">
                                {paragraphs.map((p, i) => (
                                    <p className="terms-text" key={i}>{p}</p>
                                ))}
                            </div>
                        )}

                        {!loading && !hasApiText && sections.map((item, index) => (
                            <div className="terms-section" key={index}>
                                <h3 className="terms-heading">{t(item.title)}</h3>
                                <p className="terms-text">{t(item.text)}</p>
                            </div>
                        ))}

                    </div>

                </div>
            </div>
        </>
    )
}

export default Terms