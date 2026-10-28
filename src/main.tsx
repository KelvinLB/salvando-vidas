import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/fraunces/soft.css'
import '@fontsource-variable/inter'
// Letra a mano, solo para lo que se escribe dentro del diario.
import '@fontsource-variable/caveat'
import './styles.css'
import App from './App'
import { migrate } from './lib/migrate'

// Lo guardado con una versión anterior pasa a la forma nueva antes de dibujar nada.
migrate()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
