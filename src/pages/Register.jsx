import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import api from '../service/api'
import { useLanguage } from '../context/LanguageContext'
import './Register.css'

function Register() {
    const navigate = useNavigate()
    const location = useLocation()
    const { t } = useLanguage()

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState(location.state?.phone ?? '') // comes from Verify
    const [image, setImage] = useState(null)   // the image file itself
    const [preview, setPreview] = useState('') // temporary URL to show it

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // free the temporary URL when the image changes or the page closes
    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview)
        }
    }, [preview])

    const handleImage = (e) => {
        const file = e.target.files[0]
        if (!file) return

        // max size: 2 MB
        if (file.size > 2 * 1024 * 1024) {
            setError(t('reg.errImage'))
            return
        }

        setError('')
        setImage(file)
        setPreview(URL.createObjectURL(file))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!name.trim()) {
            setError(t('reg.errName'))
            return
        }
        if (!phone.trim()) {
            setError(t('reg.errPhone'))
            return
        }

        setLoading(true)

        // FormData: needed when sending a file
        const form = new FormData()
        form.append('name', name.trim())
        form.append('email', email.trim())
        form.append('phone', phone.trim())
        if (image) form.append('image', image)

        try {
            const res = await api.post('/register', form)

            const token = res.data?.data?.access_token || res.data?.data?.token
            if (token) localStorage.setItem('token', token)

            // go back where the user was heading (e.g. payment), or home
            const next = sessionStorage.getItem('after_login') || '/'
            sessionStorage.removeItem('after_login')
            navigate(next, { replace: true })
        } catch (err) {
            // 422 returns an error for each field — show the first one
            const fieldErrors = err.response?.data?.errors
            const firstField = fieldErrors && Object.values(fieldErrors)[0]

            setError(
                (Array.isArray(firstField) ? firstField[0] : firstField) ||
                err.response?.data?.message ||
                t('reg.errFailed')
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout>
            <form className="login-form" onSubmit={handleSubmit}>
                <h2 className="reg-title">{t('reg.title')}</h2>
                <p className="reg-subtitle">{t('reg.subtitle')}</p>

                {/* photo box: clicking it opens the device files */}
                <label className="reg-photo">
                    {preview ? (
                        <img src={preview} alt="" className="reg-photo-img" />
                    ) : (
                        <>
                            <span className="material-symbols-outlined reg-camera">camera</span>
                            <span className="reg-photo-text">{t('reg.addPhoto')}</span>
                        </>
                    )}
                    <input type="file" accept="image/*" onChange={handleImage} hidden />
                </label>

                <div className="login-input-box">
                    <input
                        type="text"
                        className="login-input"
                        placeholder={t('reg.name')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <span className="material-symbols-outlined login-icon">account_circle</span>
                </div>

                <div className="login-input-box">
                    <input
                        type="email"
                        className="login-input"
                        placeholder={t('reg.email')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <span className="material-symbols-outlined login-icon">mail</span>
                </div>

                <div className="login-input-box">
                    <input
                        type="tel"
                        inputMode="numeric"
                        className="login-input"
                        placeholder={t('reg.phone')}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                    <span className="material-symbols-outlined login-icon">call</span>
                </div>

                {error && <p className="login-error">{error}</p>}

                <button type="submit" className="btn login-btn w-100" disabled={loading}>
                    {loading ? t('reg.saving') : t('reg.save')}
                </button>
            </form>
        </AuthLayout>
    )
}

export default Register