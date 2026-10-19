import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import './SettingsToggles.css';
// Theme + language buttons — used in the Header and on the login pages
export default function SettingsToggles({ className = '' }) {
    const { theme, toggleTheme } = useTheme();
    const { t, lang, toggleLang } = useLanguage();

    const isDark = theme === 'dark';

    return (
        <div className={`header-toggles ${className}`}>
            <button
                type="button"
                className="header-toggle"
                onClick={toggleTheme}
                title={isDark ? t('header.light') : t('header.dark')}
            >
                <span className="material-symbols-outlined">
                    {isDark ? 'dark_mode' : 'light_mode'}
                </span>
            </button>

            <button
                type="button"
                className="header-toggle header-lang"
                onClick={toggleLang}
                title={t('header.otherLang')}
            >
                {lang === 'en' ? 'ع' : 'EN'}
            </button>
        </div>
    );
}