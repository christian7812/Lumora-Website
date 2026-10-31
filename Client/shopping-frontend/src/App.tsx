import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/Homepage'
import AuthPage from './pages/AuthPage'
import ProductsPage from './pages/ProductPage'
import CategoriesPage from './pages/CategoriesPage'
import ContactPage from './pages/ContactPage'
import CartPage from './pages/CartPage'
import { CartProvider } from './contexts/CartProvider'
import { useCart } from './contexts/CartContext'
import CheckoutPage from './pages/CheckoutPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import { ProductProvider } from './contexts/ProductProvider'
import AccountOrdersPage from './pages/AccountOrdersPage'

function CartStorageNotice() {
  const { storageError } = useCart()

  if (!storageError) return null

  return (
    <div
      className="fixed inset-x-4 top-4 z-[70] mx-auto max-w-xl rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 shadow-lg"
      role="alert"
    >
      {storageError}
    </div>
  )
}

function App() {
  return (
    <ProductProvider>
      <CartProvider>
        <BrowserRouter>
          <CartStorageNotice />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path='/checkout' element={<CheckoutPage />} />
            <Route path='/order-success' element={<OrderSuccessPage />} />
            <Route path="/account/orders" element={<AccountOrdersPage />} />
            <Route path="/account/orders/:id" element={<AccountOrdersPage />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </ProductProvider>
  )
}

export default App
