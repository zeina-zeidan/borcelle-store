import { Navigate, useLocation } from 'react-router-dom'

// guards pages that need login (payment, profile)
// no token → save where the user wanted to go, then send him to login
function RequireAuth({ children }) {
    const location = useLocation()
    const token = localStorage.getItem('token')

    if (!token) {
        sessionStorage.setItem('after_login', location.pathname)
        return <Navigate to="/login" replace />
    }

    return children
}

export default RequireAuth