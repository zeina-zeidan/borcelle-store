import axios from 'axios'

// الرابط الأساسي لكل الطلبات
const api = axios.create({
    baseURL: 'https://training.tamkeen-dev.com/tamkeenstore/public/api',
    headers: {
        Accept: 'application/json',
    },
})

// قبل كل طلب: إذا في token محفوظ، منبعته مع الطلب
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export default api