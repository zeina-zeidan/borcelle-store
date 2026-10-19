import { useLanguage } from '../context/LanguageContext'
import './Promo.css'

function Promo({ flatLeft }) {
    const { t } = useLanguage()

    return (
        <div className={flatLeft ? 'promo promo-flat' : 'promo'}>
            <div className="promo-text">
                <h3>{t('promo.title')}</h3>
                <p>{t('promo.text')}</p>
            </div>
            <button className="promo-btn" type="button">{t('promo.btn')}</button>
        </div>
    )
}

export default Promo