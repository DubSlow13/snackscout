import { useEffect, useState } from 'react'
import { api } from './api.js'

// SnackScout Prototype 2: React frontend wired to the Express API (Supabase).
// Favorites and alert toggles stay in this browser only (see useDemoData below).

const COLORS = { green: '#17684e', light: '#e5f6ec', ink: '#24342d', gray: '#607068', line: '#d7e3db' }
const FORM_STYLE = { display: 'grid', gap: '12px', maxWidth: '580px', marginTop: '16px' }
const FIELD_STYLE = { width: '100%', padding: '12px', fontSize: '16px', border: `1px solid ${COLORS.line}`, borderRadius: '10px', background: 'white', color: COLORS.ink }
const CARD_STYLE = { background: '#f4f7f5', padding: '22px', borderLeft: '5px solid #23946c', borderRadius: '14px', marginBottom: '14px' }
const ROW_STYLE = { display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', margin: '16px 0 24px' }

function getProduct(list, id) { return list.find((p) => p.id === id) }
function getStore(list, id) { return list.find((s) => s.id === id) }
function storeLabel(store) { return `${store.name} — ${store.branch}` }
function money(price) { return `$${Number(price).toFixed(2)}` }
function displayDate(date) { return new Date(date).toLocaleString() }
function availabilityLabel(status) { return status === 'in_stock' ? 'In stock' : 'Out of stock' }

function milesBetween(a, b) {
  const rad = (v) => v * Math.PI / 180
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

// Local persistence is for the demo only; it is not shared across devices/users.
function useDemoData(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = window.localStorage.getItem(key)
      return saved ? JSON.parse(saved) : initialValue
    } catch { return initialValue }
  })
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(value)) } catch { /* demo still works if blocked */ }
  }, [key, value])
  return [value, setValue]
}

function Action({ children, onClick, type = 'button', variant = 'soft', disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: variant === 'primary' ? COLORS.green : variant === 'outline' ? 'white' : COLORS.light,
        color: variant === 'primary' ? 'white' : COLORS.green,
        border: variant === 'outline' ? `1px solid ${COLORS.line}` : '1px solid transparent',
        padding: '12px 18px', borderRadius: '11px', fontSize: '1rem',
        opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer', minHeight: '46px'
      }}
    >{children}</button>
  )
}

function Field({ label, children }) {
  return <label style={{ display: 'grid', gap: '5px', fontWeight: 650 }}>{label}{children}</label>
}

function App() {
  const [page, setPage] = useState('Home')
  const [accountId, setAccountId] = useState('')
  const [productId, setProductId] = useState('')
  const [query, setQuery] = useState('')
  const [brand, setBrand] = useState('')
  const [sortBy, setSortBy] = useState('price_low')
  const [originId, setOriginId] = useState('')
  const [favoriteStoreId, setFavoriteStoreId] = useState('')
  const [activeFavoriteId, setActiveFavoriteId] = useState(null)
  const [notice, setNotice] = useState('')
  const [products, setProducts] = useState([])
  const [stores, setStores] = useState([])
  const [users, setUsers] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [favorites, setFavorites] = useDemoData('snackscout-favorites-v2', [])
  const [alerts, setAlerts] = useDemoData('snackscout-alerts-v2', {})
  const [reportProductId, setReportProductId] = useState('')
  const [reportStoreId, setReportStoreId] = useState('')
  const [reportPrice, setReportPrice] = useState('')
  const [reportAvailability, setReportAvailability] = useState('in_stock')
  const [reportDescription, setReportDescription] = useState('')
  const [reportPhoto, setReportPhoto] = useState('')
  const [submittedReport, setSubmittedReport] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError('')
    Promise.all([api.getProducts(), api.getStores(), api.getUsers(), api.getReports()])
      .then(([productRows, storeRows, userRows, reportRows]) => {
        if (cancelled) return
        setProducts(productRows)
        setStores(storeRows)
        setUsers(userRows)
        setReports(reportRows)
        setAccountId((cur) => (userRows.some((u) => u.id === cur) ? cur : userRows[0]?.id ?? ''))
        setProductId((cur) => (productRows.some((p) => p.id === cur) ? cur : productRows[0]?.id ?? ''))
        setOriginId((cur) => (storeRows.some((s) => s.id === cur) ? cur : storeRows[0]?.id ?? ''))
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err.message)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const account = users.find((u) => u.id === accountId)
  const selectedProduct = getProduct(products, productId)
  const userFavorites = favorites.filter((f) => f.userId === accountId)
  const favoriteBeingEdited = favorites.find((f) => f.id === activeFavoriteId && f.userId === accountId)
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase()) && (!brand || p.brand === brand)
  )

  const latestForProduct = (() => {
    const byStore = new Map()
    reports.filter((r) => r.productId === productId && r.status !== 'rejected').forEach((r) => {
      const previous = byStore.get(r.storeId)
      if (!previous || new Date(r.submittedAt) > new Date(previous.submittedAt)) byStore.set(r.storeId, r)
    })
    const list = [...byStore.values()]
    const origin = getStore(stores, originId)
    list.sort((a, b) => {
      if (sortBy === 'distance') return milesBetween(origin, getStore(stores, a.storeId)) - milesBetween(origin, getStore(stores, b.storeId))
      if (sortBy === 'price_high') return b.price - a.price
      return a.price - b.price
    })
    return list
  })()

  function go(nextPage) { setNotice(''); setPage(nextPage) }
  function openProduct(id) { setProductId(id); setFavoriteStoreId(''); go('Product Details') }
  function openReport(id = productId, storeId = '') {
    setReportProductId(id)
    setReportStoreId(storeId || stores[0]?.id || '')
    setReportPrice('')
    setReportDescription('')
    setReportPhoto('')
    go('Report Product')
  }
  function saveFavorite(id, storeId = null) {
    const exists = favorites.some((f) => f.userId === accountId && f.productId === id && f.storeId === storeId)
    if (exists) { setNotice('Already in your saved products.'); return }
    setFavorites((prev) => [...prev, { id: `f-${Date.now()}`, userId: accountId, productId: id, storeId }])
    setNotice('Product saved! Visit Saved Products to manage it.')
  }
  function removeFavorite(id) {
    setFavorites((prev) => prev.filter((f) => f.id !== id))
    setAlerts((prev) => { const result = { ...prev }; delete result[id]; return result })
    setNotice('Saved product removed.')
  }
  function toggleAlert(favoriteId, field) {
    setAlerts((prev) => ({
      ...prev,
      [favoriteId]: { restock: false, priceChange: false, ...prev[favoriteId], [field]: !(prev[favoriteId]?.[field] ?? false) }
    }))
  }
  async function submitReport(event) {
    event.preventDefault()
    const numericPrice = Number(reportPrice)
    if (!getProduct(products, reportProductId) || !getStore(stores, reportStoreId) || reportPrice.trim() === '' || !Number.isFinite(numericPrice) || numericPrice < 0) {
      setNotice('Select a product and store, and enter a valid nonnegative price.')
      return
    }
    setSubmitting(true)
    try {
      const created = await api.postReport({
        product_id: reportProductId,
        store_id: reportStoreId,
        user_id: accountId,
        price: numericPrice,
        availability_status: reportAvailability,
        description: reportDescription.trim() || undefined,
      })
      setReports((prev) => [...prev, created]) // Keep historical reports unchanged.
      setSubmittedReport({ ...created, photoName: reportPhoto })
      go('Report Confirmation')
    } catch (err) {
      setNotice(`Report could not be saved: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }
  function verifyReport(id) {
    const report = reports.find((r) => r.id === id)
    // Frontend demo check only. The eventual API must enforce this on the server.
    if (!report || account.role !== 'employee' || !account.approvedStores.includes(report.storeId)) return
    setReports((prev) => prev.map((r) => r.id === id
      ? { ...r, status: 'verified', verifiedBy: account.id, verifiedAt: new Date().toISOString() }
      : r))
    setNotice('Report confirmed in the demo.')
  }

  function nav() {
    if (page === 'Home') return null
    if (page === 'Search Results') return <div style={ROW_STYLE}>
      <Action onClick={() => go('Home')}>Back to Home</Action>
      <Action onClick={() => go('Find Products')}>Back to Search</Action>
    </div>
    if (page === 'Product Details') return <div style={ROW_STYLE}>
      <Action onClick={() => go('Home')}>Back to Home</Action>
      <Action onClick={() => go('Search Results')}>Back to Results</Action>
    </div>
    if (page === 'Compare Stores') return <div style={ROW_STYLE}>
      <Action onClick={() => go('Home')}>Back to Home</Action>
      <Action onClick={() => go('Product Details')}>Back to Product Details</Action>
    </div>
    if (page === 'Restock Alert Settings') return <div style={ROW_STYLE}>
      <Action onClick={() => go('Home')}>Back to Home</Action>
      <Action onClick={() => go('Saved Products')}>Back to Saved Products</Action>
    </div>
    if (page === 'Review & Verify Reports') return <div style={ROW_STYLE}>
      <Action onClick={() => go('Home')}>Back to Home</Action>
      <Action onClick={() => go('Verify Reports')}>Back to Verify Reports</Action>
    </div>
    return <div style={ROW_STYLE}><Action onClick={() => go('Home')}>Back to Home</Action></div>
  }

  function content() {
    switch (page) {
      case 'Home': return <>
        <p>Find snacks, compare community reports, or share an update.</p>
        <nav aria-label="Main navigation" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {['Find Products', 'Saved Products', 'Report Product', 'Verify Reports'].map((name) =>
            <Action key={name} onClick={() => name === 'Report Product' ? openReport(productId) : go(name)}>{name}</Action>
          )}
        </nav>
      </>

      case 'Find Products': return <>
        <p>Search by product name and choose a brand.</p>
        <form style={FORM_STYLE} onSubmit={(e) => { e.preventDefault(); go('Search Results') }}>
          <Field label="Product Name"><input style={FIELD_STYLE} type="search" placeholder="e.g. Doritos" value={query} onChange={(e) => setQuery(e.target.value)} /></Field>
          <Field label="Brand"><select style={FIELD_STYLE} value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">All brands</option>
            {[...new Set(products.map((p) => p.brand))].map((b) => <option key={b}>{b}</option>)}
          </select></Field>
          <Action type="submit" variant="primary">Search Products</Action>
        </form>
      </>

      case 'Search Results': return <>
        <p>{filteredProducts.length} matching product(s).</p>
        {filteredProducts.length === 0 ? <p>No matching products found. Try another name or brand.</p> :
          <div style={{ display: 'grid', gap: '12px', marginTop: '24px' }}>
            {filteredProducts.map((p) => <button key={p.id} type="button" onClick={() => openProduct(p.id)}
              style={{ background: 'white', color: COLORS.ink, textAlign: 'left', padding: '20px 24px', border: `1px solid ${COLORS.line}`, borderLeft: '6px solid #23946c', borderRadius: '12px' }}>
              <strong>{p.name}</strong> <span style={{ color: COLORS.gray, fontWeight: 400 }}>— {p.brand}</span>
            </button>)}
          </div>}
      </>

      case 'Product Details': return <>
        <div style={CARD_STYLE}>
          <h3 style={{ marginTop: 0 }}>{selectedProduct.name}</h3>
          <p><strong>Brand:</strong> {selectedProduct.brand}</p>
          <p><strong>Flavor:</strong> {selectedProduct.flavor}</p>
          <p><strong>Category:</strong> {selectedProduct.category}</p>
        </div>
        <div style={ROW_STYLE}>
          <Action variant="primary" onClick={() => go('Compare Stores')}>Compare Stores</Action>
          <Action onClick={() => openReport(selectedProduct.id)}>Report Product</Action>
        </div>
        <h3>Save this product</h3>
        <div style={FORM_STYLE}>
          <Field label="Save for any store or one specific location"><select style={FIELD_STYLE} value={favoriteStoreId} onChange={(e) => setFavoriteStoreId(e.target.value)}>
            <option value="">Any store</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{storeLabel(s)}</option>)}
          </select></Field>
          <Action onClick={() => saveFavorite(selectedProduct.id, favoriteStoreId || null)}>Save Favorite</Action>
        </div>
      </>

      case 'Compare Stores': return <>
        <p>Comparing community-reported prices for <strong>{selectedProduct.name}</strong>.</p>
        <p>Sample store addresses and distances are for demonstration. Inventory is not live.</p>
        <div style={{ ...FORM_STYLE, maxWidth: '650px' }}>
          <Field label="Sort stores"><select style={FIELD_STYLE} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="price_low">Price: cheapest first</option>
            <option value="price_high">Price: highest first</option>
            <option value="distance">Distance: nearest first (demo)</option>
          </select></Field>
          {sortBy === 'distance' && <Field label="Demo reference location"><select style={FIELD_STYLE} value={originId} onChange={(e) => setOriginId(e.target.value)}>
            {stores.map((s) => <option key={s.id} value={s.id}>{storeLabel(s)}</option>)}
          </select></Field>}
        </div>
        {latestForProduct.length === 0 ? <p>No store reports yet. Submit the first one!</p> :
          <div style={{ marginTop: '24px' }}>
            {latestForProduct.map((r) => {
              const store = getStore(stores, r.storeId)
              return <div key={store.id} style={CARD_STYLE}>
                <h3 style={{ marginTop: 0 }}>{storeLabel(store)} — {money(r.price)}</h3>
                <p><strong>Reported availability:</strong> {availabilityLabel(r.availability)} · {r.status === 'verified' ? 'Employee verified' : 'Awaiting verification'}</p>
                <p><strong>Last reported:</strong> {displayDate(r.submittedAt)}</p>
                <p><strong>Address:</strong> {store.address} · <strong>Hours:</strong> {store.hours}</p>
                {sortBy === 'distance' && <p><strong>Approx. straight-line distance:</strong> {milesBetween(getStore(stores, originId), store).toFixed(1)} miles (demo)</p>}
                <div style={ROW_STYLE}>
                  <Action onClick={() => saveFavorite(productId, store.id)}>Save at this Store</Action>
                  <Action onClick={() => openReport(productId, store.id)}>Submit Updated Report</Action>
                </div>
              </div>
            })}
          </div>}
        <Action onClick={() => openReport(productId)}>Report Another Store</Action>
      </>

      case 'Saved Products': return <>
        <p>Your saved products and optional store-specific favorites.</p>
        {userFavorites.length === 0 ? <p>No saved products yet. Find a product and choose Save Favorite.</p> :
          userFavorites.map((fav) => <div key={fav.id} style={CARD_STYLE}>
            <h3 style={{ marginTop: 0 }}>{getProduct(products, fav.productId)?.name}</h3>
            <p>{fav.storeId ? storeLabel(getStore(stores, fav.storeId)) : 'Any store'}</p>
            <p>Restock alert: {alerts[fav.id]?.restock ? 'Enabled' : 'Off'} · Price-change alert: {alerts[fav.id]?.priceChange ? 'Enabled' : 'Off'}</p>
            <div style={ROW_STYLE}>
              <Action onClick={() => openProduct(fav.productId)}>Product Details</Action>
              <Action onClick={() => { setActiveFavoriteId(fav.id); go('Restock Alert Settings') }}>Alert Settings</Action>
              <Action variant="outline" onClick={() => removeFavorite(fav.id)}>Remove Favorite</Action>
            </div>
          </div>)}
      </>

      case 'Restock Alert Settings': return favoriteBeingEdited ? <>
        <p>Choose alerts for <strong>{getProduct(products, favoriteBeingEdited.productId)?.name}</strong> — {favoriteBeingEdited.storeId ? storeLabel(getStore(stores, favoriteBeingEdited.storeId)) : 'Any store'}.</p>
        <div style={CARD_STYLE}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 650 }}>
            <input type="checkbox" checked={!!alerts[favoriteBeingEdited.id]?.restock} onChange={() => toggleAlert(favoriteBeingEdited.id, 'restock')} /> Enable restock alerts
          </label>
          <div style={{ height: '14px' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 650 }}>
            <input type="checkbox" checked={!!alerts[favoriteBeingEdited.id]?.priceChange} onChange={() => toggleAlert(favoriteBeingEdited.id, 'priceChange')} /> Enable price-change alerts
          </label>
        </div>
        <p>Preferences are saved in this browser for the demo. Notifications are not delivered yet.</p>
      </> : <p>Choose a saved product first to manage its alerts.</p>

      case 'Report Product': return <>
        <p>Submit a price, stock update, or correction. New reports are added without deleting earlier reports.</p>
        <form style={FORM_STYLE} onSubmit={submitReport}>
          <Field label="Product"><select style={FIELD_STYLE} value={reportProductId} onChange={(e) => setReportProductId(e.target.value)} required>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select></Field>
          <Field label="Store / branch"><select style={FIELD_STYLE} value={reportStoreId} onChange={(e) => setReportStoreId(e.target.value)} required>
            {stores.map((s) => <option key={s.id} value={s.id}>{storeLabel(s)}</option>)}
          </select></Field>
          <Field label="Reported price ($)"><input style={FIELD_STYLE} type="number" min="0" step="0.01" required placeholder="e.g. 2.99" value={reportPrice} onChange={(e) => setReportPrice(e.target.value)} /></Field>
          <Field label="Reported availability"><select style={FIELD_STYLE} value={reportAvailability} onChange={(e) => setReportAvailability(e.target.value)}>
            <option value="in_stock">In stock</option><option value="out_of_stock">Out of stock</option>
          </select></Field>
          <Field label="Description (optional)"><textarea style={FIELD_STYLE} rows={3} value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} placeholder="Where you saw the product or price tag" /></Field>
          <Field label="Product or price-tag photo (optional demo selection)"><input style={FIELD_STYLE} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setReportPhoto(e.target.files?.[0]?.name || '')} /></Field>
          {reportPhoto && <p>Selected: {reportPhoto}. Photo upload to the server is not implemented yet.</p>}
          <Action type="submit" variant="primary" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Community Report'}</Action>
        </form>
      </>

      case 'Report Confirmation': return submittedReport ? <>
        <div style={CARD_STYLE}>
          <h3>Report received — demo</h3>
          <p><strong>Product:</strong> {getProduct(products, submittedReport.productId)?.name}</p>
          <p><strong>Store:</strong> {storeLabel(getStore(stores, submittedReport.storeId))}</p>
          <p><strong>Price:</strong> {money(submittedReport.price)}</p>
          <p><strong>Availability:</strong> {availabilityLabel(submittedReport.availability)}</p>
          <p>Submitted: {displayDate(submittedReport.submittedAt)} · Awaiting employee verification</p>
          {submittedReport.photoName && <p>Photo chosen: {submittedReport.photoName} (not uploaded)</p>}
        </div>
        <div style={ROW_STYLE}>
          <Action onClick={() => { setProductId(submittedReport.productId); go('Compare Stores') }}>Compare Stores</Action>
          <Action onClick={() => openReport(submittedReport.productId)}>Submit Another Report</Action>
        </div>
      </> : <p>No new report has been submitted in this session.</p>

      case 'Verify Reports': return <>
        <p>Store employees can review reports for their approved store locations.</p>
        {account.role === 'employee' ? <>
          <p><strong>Demo employee:</strong> {account.name}</p>
          <p><strong>Approved locations:</strong> {account.approvedStores.map((id) => storeLabel(getStore(stores, id))).join(', ') || 'None'}</p>
          <Action variant="primary" onClick={() => go('Review & Verify Reports')}>Review & Verify Reports</Action>
        </> : <div style={CARD_STYLE}>
          <p><strong>Employee-only demo screen.</strong> Select Casey Morgan or Taylor Brooks from the demo account menu to test it.</p>
        </div>}
        <p style={{ fontSize: '0.9rem' }}>Demo account switching is not real authentication. Server-side permissions will be required when we connect the API.</p>
      </>

      case 'Review & Verify Reports': return account.role === 'employee' ? <>
        <p>These reports belong to your approved store locations. Confirm reported availability only when accurate.</p>
        {reports.filter((r) => account.approvedStores.includes(r.storeId)).length === 0 ? <p>No reports for your approved locations.</p> :
          reports.filter((r) => account.approvedStores.includes(r.storeId)).slice().reverse().map((r) => <div key={r.id} style={CARD_STYLE}>
            <h3 style={{ marginTop: 0 }}>{getProduct(products, r.productId)?.name} — {storeLabel(getStore(stores, r.storeId))}</h3>
            <p>{money(r.price)} · {availabilityLabel(r.availability)} · {displayDate(r.submittedAt)}</p>
            <p><strong>Reporter:</strong> {users.find((u) => u.id === r.userId)?.name} · <strong>Status:</strong> {r.status === 'verified' ? 'Verified' : 'Pending'}</p>
            {r.description && <p><strong>Notes:</strong> {r.description}</p>}
            {r.status !== 'verified' && <Action variant="primary" onClick={() => verifyReport(r.id)}>Verify Availability</Action>}
          </div>)}
      </> : <p>Employee access required. Return to Verify Reports and switch to a demo employee account.</p>

      default: return <p>This screen is being prepared.</p>
    }
  }

  return <main>
    <header>
      <h1>SnackScout</h1>
      <p>Find snacks and drinks, compare community prices, and save your favorites.</p>
      {users.length > 0 && <div style={{ marginTop: '18px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <label htmlFor="demo-account" style={{ fontWeight: 650 }}>Demo account:</label>
        <select id="demo-account" value={accountId} onChange={(e) => { setAccountId(e.target.value); setNotice(''); go('Home') }}
          style={{ ...FIELD_STYLE, width: 'auto', maxWidth: '100%' }}>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
        </select>
      </div>}
    </header>
    <section>
      <p style={{ fontSize: '0.82rem', color: COLORS.gray, margin: '0 0 18px' }}>
        LIVE DATA — products, stores and reports load from the SnackScout API (Supabase). Demo account switching is not real authentication; favorites and alert toggles stay in this browser.
      </p>
      <h2>{page}</h2>
      {nav()}
      {notice && <p role="status" style={{ padding: '12px', background: COLORS.light, borderRadius: '9px', color: COLORS.green }}>{notice}</p>}
      {loading ? <p>Loading SnackScout data…</p>
        : loadError ? <div style={CARD_STYLE}>
          <p><strong>Could not reach the SnackScout API.</strong> {loadError}</p>
          <p>Start the API (<code>cd api &amp;&amp; npm run dev</code>) and reload this page.</p>
        </div>
        : content()}
    </section>
  </main>
}

export default App
