import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {/* Store information */}
        <div>
          <h2 className="text-2xl font-extrabold">
            LUMORA<span className="text-yellow-400">.</span>
          </h2>

          <p className="mt-4 max-w-xs text-sm leading-6 text-gray-400">
            Discover quality products at great prices. Your shopping
            experience starts here.
          </p>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="font-semibold text-yellow-400">Quick Links</h3>

          <ul className="mt-4 space-y-3 text-sm text-gray-400">
            <li>
              <Link to="/" className="transition hover:text-white">
                Home
              </Link>
            </li>
            <li>
              <Link to="/products" className="transition hover:text-white">
                Shop Products
              </Link>
            </li>
            <li>
              <Link to="/categories" className="transition hover:text-white">
                Categories
              </Link>
            </li>
            <li>
              <Link to="/login" className="transition hover:text-white">
                My Account
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer service */}
        <div>
          <h3 className="font-semibold text-yellow-400">Customer Service</h3>

          <ul className="mt-4 space-y-3 text-sm text-gray-400">
            <li>
              <Link to="/contact" className="transition hover:text-white">
                Contact Us
              </Link>
            </li>
            <li>
              <Link to="/shipping" className="transition hover:text-white">
                Shipping Information
              </Link>
            </li>
            <li>
              <Link to="/returns" className="transition hover:text-white">
                Returns & Refunds
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="transition hover:text-white">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-semibold text-yellow-400">Get in Touch</h3>

          <p className="mt-4 text-sm leading-6 text-gray-400">
            Have questions about an order or product? Our team is here to help.
          </p>

          <Link
            to="/contact"
            className="mt-4 inline-block rounded-lg bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-500"
          >
            Contact Us
          </Link>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800 px-6 py-5">
        <p className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Lumora. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
