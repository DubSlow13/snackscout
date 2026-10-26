import express from 'express'

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'snackscout-api' })
})

app.listen(PORT, () => {
  console.log(`SnackScout API listening on http://localhost:${PORT}`)
})
