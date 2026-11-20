// Thin client for the SnackScout Express API.
// The API answers with Supabase column names (product_id, submitted_at, ...);
// the map helpers below convert rows into the shapes the UI already uses.
const BASE = '/api'

async function request(path, options) {
  const response = await fetch(`${BASE}${path}`, options)
  let body = null
  try { body = await response.json() } catch { /* non-JSON error body */ }
  if (!response.ok) {
    throw new Error(body?.error || `Request failed (${response.status})`)
  }
  return body
}

export function mapProduct(row) {
  return { id: row.product_id, name: row.name, brand: row.brand, flavor: row.flavor, category: row.category }
}

export function mapStore(row) {
  return {
    id: row.store_id, name: row.store_name, branch: row.branch_name,
    address: row.address, hours: row.operating_hours,
    lat: Number(row.latitude), lon: Number(row.longitude),
  }
}

export function mapUser(row) {
  return { id: row.user_id, name: row.name, role: row.role, approvedStores: row.approved_stores ?? [] }
}

export function mapReport(row) {
  return {
    id: row.report_id, productId: row.product_id, storeId: row.store_id, userId: row.user_id,
    price: Number(row.price), availability: row.availability_status,
    submittedAt: row.submitted_at, description: row.description || '',
    status: row.verification ? 'verified' : 'pending',
    verifiedBy: row.verification?.verified_by ?? null,
  }
}

export const api = {
  getProducts: ({ search = '', brand = '' } = {}) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (brand) params.set('brand', brand)
    const suffix = params.size ? `?${params}` : ''
    return request(`/products${suffix}`).then((rows) => rows.map(mapProduct))
  },
  getStores: () => request('/stores').then((rows) => rows.map(mapStore)),
  getUsers: () => request('/users').then((rows) => rows.map(mapUser)),
  getReports: () => request('/reports').then((rows) => rows.map(mapReport)),
  postReport: (payload) =>
    request('/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(mapReport),
}
