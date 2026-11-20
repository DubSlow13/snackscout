
import { useState } from 'react'

const mainSections = [
  'Find Products',
  'Saved Products',
  'Report Product',
  'Verify Reports'
]


const products = [
  {
    id: 1,
    name: 'Doritos Nacho Cheese',
    brand: 'Doritos',
    flavor: 'Nacho Cheese',
    category: 'Chips'
  },
  {
    id: 2,
    name: 'Red Bull Energy Drink',
    brand: 'Red Bull',
    flavor: 'Original',
    category: 'Energy Drinks'
  },
  {
    id: 3,
    name: 'Takis Fuego',
    brand: 'Takis',
    flavor: 'Fuego',
    category: 'Chips'
  },
  {
    id: 4,
    name: 'Monster Energy',
    brand: 'Monster',
    flavor: 'Original',
    category: 'Energy Drinks'
  }
]


function App() {
  const [currentPage, setCurrentPage] = useState('Home')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')

  const filteredProducts = products.filter((product) => {
    const matchesName = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())

    const matchesBrand = selectedBrand === '' ||
      product.brand === selectedBrand

    return matchesName && matchesBrand
  })

  return (
    <main>
      <header>
        <h1>SnackScout</h1>
        <p>
          Find snacks and drinks, compare community prices,
          and save your favorites.
        </p>
      </header>

      {currentPage === 'Home' ? (
        <section>
          <h2>Home</h2>
          <p>What would you like to do?</p>

          <nav aria-label="Main navigation">
            {mainSections.map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => setCurrentPage(section)}
              >
                {section}
              </button>
            ))}
          </nav>
        </section>
      ) : (
        <section>
          
{currentPage !== 'Search Results' && (
  <button
    type="button"
    onClick={() => setCurrentPage('Home')}
  >
    Back to Home
  </button>
)}


          {currentPage === 'Find Products' ? (
            <>
              <h2>Find Products</h2>
              <p>Search for your favorite snacks and drinks.</p>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setCurrentPage('Search Results')
                }}
                style={{
                  display: 'grid',
                  gap: '16px',
                  maxWidth: '450px'
                }}
              >
                <label htmlFor="search">
                  Product Name
                </label>
                <input
                  id="search"
                  type="search"
                  placeholder="e.g. Doritos"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '12px', fontSize: '16px' }}
                />

                <label htmlFor="brand">Select Brand</label>
                <select
                  id="brand"
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  style={{ padding: '12px', fontSize: '16px' }}
                >
                  <option value="">All Brands</option>
                  <option value="Doritos">Doritos</option>
                  <option value="Red Bull">Red Bull</option>
                  <option value="Takis">Takis</option>
                  <option value="Monster">Monster</option>
                </select>

                <button type="submit">Search Products</button>
              </form>
            </>
          ) : currentPage === 'Search Results' ? (
            <>
             
<h2>Search Results</h2>

<div style={{
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
  marginTop: '20px',
  marginBottom: '30px'
}}>
  <button
    type="button"
    onClick={() => setCurrentPage('Home')}
  >
    Back to Home
  </button>

  <button
    type="button"
    onClick={() => setCurrentPage('Find Products')}
  >
    Back to Search
  </button>
</div>


              {filteredProducts.length === 0 ? (
                <p>No matching products found.</p>
              ) : (
                <ul>
                  {filteredProducts.map((product) => (
                    

<li
  key={product.id}
  style={{
    listStyle: 'none',
    marginBottom: '12px'
  }}
>
  <button
    className="product-result-card"
    type="button"
    onClick={() => {
      setSelectedProduct(product)
      setCurrentPage('Product Details')
    }}
    style={{
      display: 'block',
      width: '100%',
      textAlign: 'left',
      background: '#ffffff',
      color: '#24342d',
      border: '1px solid #d7e3db',
      borderLeft: '6px solid #23946c',
      borderRadius: '12px',
      padding: '20px 24px',
      fontSize: '1.05rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      cursor: 'pointer'
    }}
  >
    <strong>{product.name}</strong>
    <span style={{ color: '#607068', fontWeight: 400 }}>
      {' — '}{product.brand}
    </span>
  </button>
</li>


                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <h2>{currentPage}</h2>
              <p>Page functionality coming next.</p>
            </>
          )}
        </section>
      )}
    </main>
  )
}

export default App
