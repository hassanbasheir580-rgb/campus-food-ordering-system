import { Clock, Filter, Search, ShoppingBag, Star, UtensilsCrossed } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency } from '../config/appConfig';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import type { MenuItem, Vendor } from '../types/domain';

export const StudentMenuPage = () => {
  const { addItem } = useCart();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [vendorFilter, setVendorFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    api
      .menu()
      .then(({ items, vendors }) => {
        setItems(items);
        setVendors(vendors);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Menu could not be loaded'))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category))).sort(), [items]);
  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const matchesSearch = `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(query.toLowerCase());
        const matchesVendor = vendorFilter === 'ALL' || item.vendorId === vendorFilter;
        const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
        return matchesSearch && matchesVendor && matchesCategory;
      }),
    [categoryFilter, items, query, vendorFilter]
  );

  if (loading) return <LoadingState />;

  return (
    <>
      <PageHeader eyebrow="Student Ordering" title="Browse campus menus">
        <div className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search meals, drinks, categories" />
        </div>
      </PageHeader>

      <section className="campus-hero">
        <div>
          <span>Live kitchen queue</span>
          <h2>Order ahead and pick up when your queue number is called.</h2>
        </div>
        <div className="hero-metric">
          <strong>{items.filter((item) => item.isAvailable).length}</strong>
          <span>available items</span>
        </div>
      </section>

      <section className="filter-bar" aria-label="Menu filters">
        <label>
          <Filter size={16} />
          Vendor
          <select value={vendorFilter} onChange={(event) => setVendorFilter(event.target.value)}>
            <option value="ALL">All vendors</option>
            {vendors.map((vendor) => (
              <option value={vendor.id} key={vendor.id}>
                {vendor.outletName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="ALL">All categories</option>
            {categories.map((category) => (
              <option value={category} key={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </section>

      {filtered.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title="No menu items found" message="Try another search term or filter." />
      ) : (
        <section className="menu-grid">
          {filtered.map((item) => (
            <article className="menu-card" key={item.id}>
              <img src={item.imageUrl} alt="" loading="lazy" />
              <div className="menu-content">
                <div className="menu-meta">
                  <span>{item.category}</span>
                  <StatusBadge value={item.isAvailable ? 'ACTIVE' : 'SUSPENDED'} />
                </div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <div className="menu-facts">
                  <span>
                    <Clock size={15} />
                    {item.prepTime} min
                  </span>
                  <span>
                    <Star size={15} />
                    {(item.vendorRating ?? 0).toFixed(1)}
                  </span>
                  <span>{item.vendorName}</span>
                </div>
                <div className="menu-actions">
                  <strong>{formatCurrency(item.price)}</strong>
                  <button className="primary-button small" disabled={!item.isAvailable || item.stock <= 0} onClick={() => addItem(item, 1)}>
                    <ShoppingBag size={16} />
                    Add
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  );
};
