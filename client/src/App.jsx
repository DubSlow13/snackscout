
import { useState } from 'react'

const mainSections = [
  'Find Products',
  'Saved Products',
  'Report Product',
  'Verify Reports'
]

function App() {
  const [currentPage, setCurrentPage] = useState('Home')

  return (
    <main>
      <header>
        <h1>SnackScout</h1>
        <p>Find snacks and drinks, compare community prices,
          and save your favorites.</p>
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
          <button
            type="button"
            onClick={() => setCurrentPage('Home')}
          >
            Back to Home
          </button>

          <h2>{currentPage}</h2>
          <p>Page functionality coming next.</p>
        </section>
      )}
    </main>
  )
}

export default App
