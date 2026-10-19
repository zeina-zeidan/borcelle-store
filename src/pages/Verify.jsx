import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import api from '../service/api'
import { useLanguage } from '../context/LanguageContext'
import './Verify.css'

function Verify() {
    const navigate = useNavigate()
    const location = useLocation()
    const { t } = useLanguage()
    const phone = location.state?.phone || ''

    const [code, setCode] = useState(['', '', '', '', ''])
    const [timer, setTimer] = useState(60)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const inputsRef = useRef([])

    // countdown: 60 → 0
    useEffect(() => {
        if (timer === 0) return
        const id = setTimeout(() => setTimer(timer - 1), 1000)
        return () => clearTimeout(id)
    }, [timer])

    // one digit per box, then jump to the next box
    const handleChange = (value, index) => {
        const digit = value.replace(/\D/g, '').slice(-1)
        const newCode = [...code]
        newCode[index] = digit
        setCode(newCode)
        if (digit && index < 4) inputsRef.current[index + 1].focus()
    }

    // Backspace on an empty box → go back to the previous box
    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputsRef.current[index - 1].focus()
        }
    }

    const handleResend = async () => {
        setError('')
        setCode(['', '', '', '', ''])   // clear the old code
        setTimer(60)                    // restart the countdown right away
        inputsRef.current[0]?.focus()   // back to the first box

        try {
            await api.post('/resend', { phone })
        } catch (err) {
            // request failed → let the user try again now
            setTimer(0)
            setError(err.response?.data?.message || t('verify.errResend'))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const otp = code.join('').trim()

        if (otp.length < 5) {
            setError(t('verify.errFull'))
            setLoading(false)
            return
        }

        try {
            const res = await api.post('/verify', { phone, otp })
            const user = res.data?.data
            const token = user?.access_token || user?.token

            if (token && user?.name) {
                // existing user with a full account → logged in
                localStorage.setItem('token', token)

                // go back where the user was heading (e.g. payment), or home
                const next = sessionStorage.getItem('after_login') || '/'
                sessionStorage.removeItem('after_login')
                navigate(next, { replace: true })
            } else {
                // new user → save the token (if any) and complete the registration
                // (after_login stays saved, Register uses it after saving)
                if (token) localStorage.setItem('token', token)
                navigate('/register', { state: { phone } })
            }
        } catch (err) {
            setError(err.response?.data?.message || t('verify.errWrong'))
        } finally {
            setLoading(false)
        }
    }

    const minutes = String(Math.floor(timer / 60)).padStart(2, '0')
    const seconds = String(timer % 60).padStart(2, '0')

    return (
        <AuthLayout>
            <form className="login-form" onSubmit={handleSubmit}>
                <h2 className="verify-title">{t('verify.title')}</h2>
                <p className="verify-subtitle">
                    {t('verify.subtitle')} <bdi>{phone}</bdi>
                </p>

                <div className="otp-boxes">
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => (inputsRef.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            placeholder="-"
                            value={digit}
                            onChange={(e) => handleChange(e.target.value, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className={digit ? 'otp-input filled' : 'otp-input'}
                        />
                    ))}
                </div>

                <p className="verify-timer">
                    {t('verify.noCode')} <bdi>{minutes}:{seconds}</bdi>
                </p>

                <button
                    type="button"
                    className="verify-resend"
                    onClick={handleResend}
                    disabled={timer > 0}
                >
                    {t('verify.resend')}
                </button>

                {error && <p className="form-error">{error}</p>}

                <button className="login-btn" type="submit" disabled={loading}>
                    {loading ? t('verify.loading') : t('verify.btn')}
                </button>

                <button className="verify-back" type="button" onClick={() => navigate(-1)}>
                    {t('verify.back')}
                </button>
            </form>
        </AuthLayout>
    )
}

export default Verify