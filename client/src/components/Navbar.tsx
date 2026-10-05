import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { cartCount } from '../lib/cartReducer';

const link = ({ isActive }: { isActive: boolean }) =>
  `rounded px-2 py-1 ${isActive ? 'font-semibold text-brand' : 'text-ink/70 hover:text-ink'}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const { lines } = useCart();
  const count = cartCount(lines);

  return (
    <header className="border-b border-ink/10 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3" aria-label="Main">
        <Link to="/" className="mr-auto text-lg font-bold tracking-tight text-brand">
          Store
        </Link>
        <NavLink to="/" end className={link}>
          Shop
        </NavLink>
        <NavLink to="/cart" className={link}>
          Cart{count > 0 ? ` (${count})` : ''}
        </NavLink>
        {user ? (
          <>
            <NavLink to="/orders" className={link}>
              My orders
            </NavLink>
            {user.role === 'admin' && (
              <NavLink to="/admin" className={link}>
                Manage items
              </NavLink>
            )}
            <button onClick={logout} className="rounded px-2 py-1 text-ink/70 hover:text-ink">
              Log out
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={link}>
              Log in
            </NavLink>
            <Link to="/signup" className="rounded bg-brand px-3 py-1.5 font-medium text-white hover:bg-brand-dark">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
