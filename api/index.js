import express from 'express'
import { createClient } from '@supabase/supabase-js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json())

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// The service-role key bypasses row level security, so this client must only
// ever exist on the server. It is never sent to the React frontend.
let supabase = null
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
} else {
  console.warn('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set - database routes will return 503')
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const AVAILABILITY_STATUSES = ['in_stock', 'out_of_stock']

function requireDb(req, res, next) {
  if (!supabase) {
    return res.status(503).json({ error: 'Database is not configured on this server' })
  }
  next()
}

function badRequest(res, message) {
  return res.status(400).json({ error: message })
}

function sendDbError(res, error) {
  console.error(error)
  return res.status(500).json({ error: 'Database request failed' })
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'snackscout-api', database: supabase ? 'configured' : 'not configured' })
})

// GET /api/products?search=<name>&brand=<brand>
app.get('/api/products', requireDb, async (req, res) => {
  let query = supabase.from('products').select('*').order('name')
  const { search, brand } = req.query
  if (search) query = query.ilike('name', `%${search}%`)
  if (brand) query = query.eq('brand', brand)
  const { data, error } = await query
  if (error) return sendDbError(res, error)
  res.json(data)
})

// GET /api/brands - distinct brand names for the search dropdown
app.get('/api/brands', requireDb, async (req, res) => {
  const { data, error } = await supabase.from('products').select('brand').order('brand')
  if (error) return sendDbError(res, error)
  res.json([...new Set(data.map((row) => row.brand))])
})

// GET /api/products/:id
app.get('/api/products/:id', requireDb, async (req, res) => {
  const { id } = req.params
  if (!UUID_RE.test(id)) return badRequest(res, 'id must be a UUID')
  const { data, error } = await supabase.from('products').select('*').eq('product_id', id).maybeSingle()
  if (error) return sendDbError(res, error)
  if (!data) return res.status(404).json({ error: 'Product not found' })
  res.json(data)
})

// GET /api/stores
app.get('/api/stores', requireDb, async (req, res) => {
  const { data, error } = await supabase.from('stores').select('*').order('store_name').order('branch_name')
  if (error) return sendDbError(res, error)
  res.json(data)
})

// GET /api/users - includes each employee's approved store ids
app.get('/api/users', requireDb, async (req, res) => {
  const [users, associations] = await Promise.all([
    supabase.from('users').select('*').order('name'),
    supabase.from('employee_store_associations').select('user_id, store_id').eq('verification_status', 'approved'),
  ])
  if (users.error) return sendDbError(res, users.error)
  if (associations.error) return sendDbError(res, associations.error)
  const approvedByUser = new Map()
  for (const row of associations.data) {
    if (!approvedByUser.has(row.user_id)) approvedByUser.set(row.user_id, [])
    approvedByUser.get(row.user_id).push(row.store_id)
  }
  res.json(users.data.map((u) => ({ ...u, approved_stores: approvedByUser.get(u.user_id) ?? [] })))
})

// Verification summary attached to each report (null when unverified).
async function loadVerifications() {
  const [verifications, associations] = await Promise.all([
    supabase.from('report_verifications').select('report_id, verification_id, verification_status, verified_at, association_id, notes'),
    supabase.from('employee_store_associations').select('association_id, user_id'),
  ])
  if (verifications.error || associations.error) {
    return { error: verifications.error || associations.error }
  }
  const associationUser = new Map(associations.data.map((a) => [a.association_id, a.user_id]))
  const byReport = new Map()
  for (const v of verifications.data) {
    if (v.verification_status !== 'confirmed') continue
    const existing = byReport.get(v.report_id)
    if (!existing || new Date(v.verified_at) > new Date(existing.verified_at)) {
      byReport.set(v.report_id, {
        verification_id: v.verification_id,
        verification_status: v.verification_status,
        verified_by: associationUser.get(v.association_id) ?? null,
        verified_at: v.verified_at,
        notes: v.notes,
      })
    }
  }
  return { byReport }
}

// GET /api/reports?product_id=&store_id=
app.get('/api/reports', requireDb, async (req, res) => {
  const { product_id, store_id } = req.query
  for (const [name, value] of Object.entries({ product_id, store_id })) {
    if (value && !UUID_RE.test(value)) return badRequest(res, `${name} must be a UUID`)
  }
  let query = supabase.from('product_reports').select('*').order('submitted_at', { ascending: false })
  if (product_id) query = query.eq('product_id', product_id)
  if (store_id) query = query.eq('store_id', store_id)
  const [{ data, error }, { byReport, error: vError }] = await Promise.all([query, loadVerifications()])
  if (error) return sendDbError(res, error)
  if (vError) return sendDbError(res, vError)
  res.json(data.map((r) => ({ ...r, verification: byReport.get(r.report_id) ?? null })))
})

// POST /api/reports - submit a community price/availability report
app.post('/api/reports', requireDb, async (req, res) => {
  const { product_id, store_id, user_id, price, availability_status, description, photo_url } = req.body ?? {}

  for (const [name, value] of Object.entries({ product_id, store_id, user_id })) {
    if (!value || !UUID_RE.test(value)) return badRequest(res, `${name} is required and must be a UUID`)
  }
  const numericPrice = typeof price === 'string' && price.trim() !== '' ? Number(price) : price
  if (!Number.isFinite(numericPrice) || numericPrice < 0 || numericPrice > 99999999.99) {
    return badRequest(res, 'price is required and must be a nonnegative number')
  }
  if (!AVAILABILITY_STATUSES.includes(availability_status)) {
    return badRequest(res, `availability_status must be one of: ${AVAILABILITY_STATUSES.join(', ')}`)
  }
  if (description !== undefined && description !== null && typeof description !== 'string') {
    return badRequest(res, 'description must be a string')
  }
  if (photo_url !== undefined && photo_url !== null && typeof photo_url !== 'string') {
    return badRequest(res, 'photo_url must be a string')
  }

  // Confirm the referenced rows exist so clients get a useful 404 instead of
  // a bare foreign-key violation.
  const [product, store, user] = await Promise.all([
    supabase.from('products').select('product_id').eq('product_id', product_id).maybeSingle(),
    supabase.from('stores').select('store_id').eq('store_id', store_id).maybeSingle(),
    supabase.from('users').select('user_id').eq('user_id', user_id).maybeSingle(),
  ])
  if (product.error || store.error || user.error) {
    return sendDbError(res, product.error || store.error || user.error)
  }
  if (!product.data) return res.status(404).json({ error: 'Product not found' })
  if (!store.data) return res.status(404).json({ error: 'Store not found' })
  if (!user.data) return res.status(404).json({ error: 'User not found' })

  const { data, error } = await supabase
    .from('product_reports')
    .insert({
      product_id,
      store_id,
      user_id,
      price: numericPrice,
      availability_status,
      description: description || null,
      photo_url: photo_url || null,
    })
    .select()
    .single()
  if (error) return sendDbError(res, error)
  res.status(201).json({ ...data, verification: null })
})

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.listen(PORT, () => {
  console.log(`SnackScout API listening on http://localhost:${PORT}`)
})
