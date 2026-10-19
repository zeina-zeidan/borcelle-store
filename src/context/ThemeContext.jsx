import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'theme'

// بيقرا الوضع المحفوظ، والافتراضي لايت (متل فيغما)
const readSaved = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === 'dark' || saved === 'light') return saved
    } catch {
        // localStorage ممكن يكون مقفول — منكمّل بالافتراضي
    }
    return 'light'
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(readSaved)

    // كل ما يتغيّر الوضع: حطّو على <html> واحفظو
    useEffect(() => {
        document.documentElement.dataset.theme = theme
        try {
            localStorage.setItem(STORAGE_KEY, theme)
        } catch {
            // ما في مشكلة إذا ما انحفظ
        }
    }, [theme])

    const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
    return ctx
}