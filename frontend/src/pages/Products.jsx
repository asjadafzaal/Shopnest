import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { catalogApi } from '../api';
import ProductCard from '../components/ProductCard';
import { Search, Filter, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filter states initialized from URL params
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || searchParams.get('q') || '';
  const orderingParam = searchParams.get('ordering') || '-created_at';
  const minPriceParam = searchParams.get('min_price') || '';
  const maxPriceParam = searchParams.get('max_price') || '';
  const featuredParam = searchParams.get('featured') || '';

  const [minPrice, setMinPrice] = useState(minPriceParam);
  const [maxPrice, setMaxPrice] = useState(maxPriceParam);
  const [searchInput, setSearchInput] = useState(searchParam);

  useEffect(() => {
    async function loadCategories() {
      try {
        const catRes = await catalogApi.getCategories(true);
        setCategories(catRes || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const params = {
          category: categoryParam,
          q: searchParam,
          ordering: orderingParam,
          min_price: minPriceParam,
          max_price: maxPriceParam,
          featured: featuredParam,
        };
        const res = await catalogApi.getProducts(params);
        setProducts(res.results || []);
        setTotalCount(res.count || 0);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [searchParams, categoryParam, searchParam, orderingParam, minPriceParam, maxPriceParam, featuredParam]);

  const updateParam = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam('q', searchInput);
  };

  const handlePriceApply = (e) => {
    e.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    if (minPrice) nextParams.set('min_price', minPrice);
    else nextParams.delete('min_price');
    if (maxPrice) nextParams.set('max_price', maxPrice);
    else nextParams.delete('max_price');
    setSearchParams(nextParams);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setMinPrice('');
    setMaxPrice('');
    setSearchParams(new URLSearchParams());
  };

  const hasFilters = categoryParam || searchParam || minPriceParam || maxPriceParam || featuredParam;

  return (
    <div className="container" style={{ padding: '2rem 1.25rem' }}>
      {/* Header & Search */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            {categoryParam ? `Category: ${categoryParam}` : searchParam ? `Search: "${searchParam}"` : 'Product Catalog'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Showing {products.length} of {totalCount} available products
          </p>
        </div>

        {/* Search & Sort Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ width: '220px', height: '38px' }}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              <Search size={15} />
            </button>
          </form>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowUpDown size={15} color="#64748b" />
            <select
              className="form-control"
              value={orderingParam}
              onChange={(e) => updateParam('ordering', e.target.value)}
              style={{ height: '38px', width: '160px', padding: '0 0.5rem' }}
            >
              <option value="-created_at">Newest First</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar + Products */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Filters Sidebar */}
        <aside className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9375rem' }}>
              <Filter size={16} /> Filters
            </div>
            {hasFilters && (
              <button
                onClick={clearAllFilters}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.6875rem', padding: '2px 6px' }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Categories Filter */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.75rem' }}>
              Categories
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <button
                onClick={() => updateParam('category', '')}
                style={{
                  background: !categoryParam ? '#eef2ff' : 'transparent',
                  color: !categoryParam ? '#4f46e5' : '#334155',
                  fontWeight: !categoryParam ? 700 : 500,
                  border: 'none',
                  textAlign: 'left',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <div key={cat.id}>
                  <button
                    onClick={() => updateParam('category', cat.slug)}
                    style={{
                      background: categoryParam === cat.slug ? '#eef2ff' : 'transparent',
                      color: categoryParam === cat.slug ? '#4f46e5' : '#334155',
                      fontWeight: categoryParam === cat.slug ? 700 : 500,
                      border: 'none',
                      textAlign: 'left',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      width: '100%',
                    }}
                  >
                    {cat.name}
                  </button>
                  {cat.children?.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => updateParam('category', sub.slug)}
                      style={{
                        background: categoryParam === sub.slug ? '#eef2ff' : 'transparent',
                        color: categoryParam === sub.slug ? '#4f46e5' : '#64748b',
                        fontWeight: categoryParam === sub.slug ? 700 : 400,
                        border: 'none',
                        textAlign: 'left',
                        padding: '4px 10px 4px 22px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                        width: '100%',
                      }}
                    >
                      ↳ {sub.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div style={{ marginBottom: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.75rem' }}>
              Price Range ($)
            </h4>
            <form onSubmit={handlePriceApply}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  style={{ height: '34px', fontSize: '0.8125rem' }}
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  style={{ height: '34px', fontSize: '0.8125rem' }}
                />
              </div>
              <button type="submit" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                Apply Price
              </button>
            </form>
          </div>

          {/* Featured Toggle */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={featuredParam === 'true'}
                onChange={(e) => updateParam('featured', e.target.checked ? 'true' : '')}
              />
              <span style={{ fontWeight: 600 }}>Featured Deals Only</span>
            </label>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
              Loading products...
            </div>
          ) : products.length > 0 ? (
            <div className="grid-products">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                No products match your criteria
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Try adjusting your search terms, clearing category filters, or expanding the price range.
              </p>
              <button onClick={clearAllFilters} className="btn btn-primary btn-sm">
                Clear Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
