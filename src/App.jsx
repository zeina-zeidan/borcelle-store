import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Verify from './pages/Verify.jsx'
import Register from './pages/Register.jsx'
import Payment from './pages/Payment.jsx'
import Profile from './pages/Profile.jsx'
import Terms from './pages/Terms.jsx'
import Contact from './pages/Contact.jsx'
import Products from './pages/Products'
import Detail from './pages/Detail'
import Cart from './pages/Cart'
import RequireAuth from './components/RequireAuth'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* open to everyone */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/detail/:id" element={<Detail />} />
        <Route path="/detail" element={<Detail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/contact" element={<Contact />} />

        {/* auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/register" element={<Register />} />

        {/* need login */}
        <Route path="/payment" element={<RequireAuth><Payment /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App