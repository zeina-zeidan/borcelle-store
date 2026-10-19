import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import api from '../service/api'
import { useLanguage } from '../context/LanguageContext'
import './Profile.css'

// Data source — false: Figma sample data, true: live API
const USE_API = false

// settings list: written once, rendered as 6 cards
const settings = [
    { label: 'profile.wishlist', to: '/wishlist' },
    { label: 'profile.about', to: '/about' },
    { label: 'profile.contact', to: '/contact' },
    { label: 'profile.faq', to: '/faq' },
    { label: 'profile.terms', to: '/terms' },
    { label: 'profile.privacy', to: '/privacy' },
]

// ===== Figma sample data =====
const figmaProfile = {
    name: 'Alexa Rawles',
    email: 'alexarawles@gmail.com',
    nickName: '',
    avatar: '/images/avatar.png',
}

// ===== Helpers =====
const ORIGIN = 'https://training.tamkeen-dev.com/tamkeenstore/public'

const fullImage = (value) => {
    if (value && typeof value === 'object') {
        value = value.url || value.path || value.image || ''
    }
    if (!value) return '/images/avatar.png'
    if (String(value).startsWith('http')) return value
    return ORIGIN + '/' + String(value).replace(/^\/+/, '')
}

const extractOne = (raw) => raw?.data?.data ?? raw?.data ?? raw ?? null

function Profile() {
    const { t } = useLanguage()

    const [fullName, setFullName] = useState(USE_API ? '' : figmaProfile.name)
    const [nickName, setNickName] = useState(figmaProfile.nickName)
    const [email, setEmail] = useState(USE_API ? '' : figmaProfile.email)
    const [avatar, setAvatar] = useState(figmaProfile.avatar)

    const [loading, setLoading] = useState(USE_API)
    const [error, setError] = useState('')
    const [savedMsg, setSavedMsg] = useState(false)

    // last saved values — to skip useless requests
    const savedRef = useRef({ name: '', nick: '' })

    // "Saved" disappears after 2 seconds
    useEffect(() => {
        if (!savedMsg) return
        const id = setTimeout(() => setSavedMsg(false), 2000)
        return () => clearTimeout(id)
    }, [savedMsg])

    // load the user's details
    useEffect(() => {
        if (!USE_API) {
            savedRef.current = { name: figmaProfile.name, nick: figmaProfile.nickName }
            return
        }

        let alive = true

        api.get('/customer')
            .then((res) => {
                if (!alive) return

                const u = extractOne(res.data)
                if (!u) return

                const n = u.name ?? u.full_name ?? ''
                const nk = u.nick_name ?? u.nickname ?? ''

                setFullName(n)
                setNickName(nk)
                setEmail(u.email ?? '')
                setAvatar(fullImage(u.image ?? u.avatar ?? u.photo))

                savedRef.current = { name: n, nick: nk }
            })
            .catch(() => {
                if (!alive) return
                setFullName(figmaProfile.name)
                setEmail(figmaProfile.email)
                setError(t('profile.errLoad'))
            })
            .finally(() => {
                if (alive) setLoading(false)
            })

        return () => { alive = false }
    }, [])

    // auto-save when leaving a field
    const saveField = async () => {
        const name = fullName.trim()
        const nick = nickName.trim()

        // nothing changed → no request
        if (name === savedRef.current.name && nick === savedRef.current.nick) return

        if (!name) {
            setError(t('profile.errEmpty'))
            return
        }

        setError('')

        if (!USE_API) {
            savedRef.current = { name, nick }
            setSavedMsg(true)
            return
        }

        const form = new FormData()
        form.append('name', name)
        form.append('nick_name', nick)

        try {
            await api.post('/customer', form)
            savedRef.current = { name, nick }
            setSavedMsg(true)
        } catch (err) {
            // 422 returns an error for each field — show the first one
            const fieldErrors = err.response?.data?.errors
            const firstField = fieldErrors && Object.values(fieldErrors)[0]

            setError(
                (Array.isArray(firstField) ? firstField[0] : firstField) ||
                err.response?.data?.message ||
                t('profile.errSave')
            )
        }
    }

    return (
        <>
            <Header />

            <div className="profile-page">
                <div className="profile-card">

                    <div className="profile-banner"></div>

                    <div className="profile-body">

                        <div className="profile-user">
                            <img src={avatar} alt="" className="profile-avatar" />
                            <div>
                                <h2 className="profile-name">
                                    {loading ? t('profile.loading') : (fullName || t('profile.yourName'))}
                                </h2>
                                <p className="profile-email"><bdi>{email}</bdi></p>
                            </div>
                        </div>

                        <div className="profile-fields">
                            <div className="profile-field">
                                <label className="profile-label">{t('profile.fullName')}</label>
                                <input
                                    type="text"
                                    className="profile-input"
                                    placeholder={t('profile.fullNamePh')}
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    onBlur={saveField}
                                />
                            </div>

                            <div className="profile-field">
                                <label className="profile-label">{t('profile.nickName')}</label>
                                <input
                                    type="text"
                                    className="profile-input"
                                    placeholder={t('profile.nickNamePh')}
                                    value={nickName}
                                    onChange={(e) => setNickName(e.target.value)}
                                    onBlur={saveField}
                                />
                            </div>
                        </div>

                        {savedMsg && <p className="profile-saved">✓ {t('profile.saved')}</p>}

                        {error && <p className="profile-error">{error}</p>}

                        <h3 className="profile-settings-title">{t('profile.settings')}</h3>

                        <div className="profile-settings">
                            {settings.map((item) => (
                                <Link to={item.to} className="profile-setting" key={item.label}>
                                    <span>{t(item.label)}</span>
                                    <span className="material-symbols-outlined profile-arrow">play_arrow</span>
                                </Link>
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        </>
    )
}

export default Profile
