import { createContext, useContext, useEffect, useState } from 'react'
import translations from '../i18n/translations'

const LanguageContext = createContext(null)
const STORAGE_KEY = 'lang'

const readSaved = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === 'ar' || saved === 'en') return saved
    } catch {
        // منكمّل بالافتراضي
    }
    return 'en'
}

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(readSaved)

    // العربي = من اليمين لليسار
    const dir = lang === 'ar' ? 'rtl' : 'ltr'

    useEffect(() => {
        document.documentElement.lang = lang
        document.documentElement.dir = dir
        try {
            localStorage.setItem(STORAGE_KEY, lang)
        } catch {
            // ما في مشكلة
        }
    }, [lang, dir])

    const toggleLang = () => setLang((l) => (l === 'en' ? 'ar' : 'en'))

    // بتجيب الترجمة؛ إذا ناقصة بترجع للإنجليزي، وإذا ناقصة كمان بترجع المفتاح
    const t = (key) => translations[lang]?.[key] ?? translations.en[key] ?? key

    return (
        <LanguageContext.Provider value={{ lang, dir, toggleLang, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const ctx = useContext(LanguageContext)
    if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
    return ctx
}