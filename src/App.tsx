import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import Inicio from './pages/Inicio'
import Calma from './pages/Calma'
import Distraer from './pages/Distraer'
import Musica from './pages/Musica'
import Videos from './pages/Videos'
import MiEspacio from './pages/MiEspacio'
import PlanDeSeguridad from './pages/espacio/Plan'
import Caja from './pages/espacio/Caja'
import Personas from './pages/espacio/Personas'
import Medicamentos from './pages/espacio/Medicamentos'
import ComoVoy from './pages/espacio/ComoVoy'
import Ajustes from './pages/espacio/Ajustes'
import Ayuda from './pages/Ayuda'
import Diario from './pages/Diario'
import Especialista from './pages/Especialista'
import Opinion from './pages/Opinion'
import Panico from './pages/Panico'
import Noche from './pages/Noche'
import Responder from './pages/Responder'
import Mascota from './pages/Mascota'
import MiDia from './pages/MiDia'
import Enojo from './pages/Enojo'
import Redes from './pages/Redes'
import Cuerpo from './pages/Cuerpo'
import Memorama from './pages/juegos/Memorama'
import Deslizante from './pages/juegos/Deslizante'
import Burbujas from './pages/juegos/Burbujas'
import Pizarra from './pages/juegos/Pizarra'
import Hueco from './pages/juegos/Hueco'
import Acomodar from './pages/juegos/Acomodar'
import Barrio from './pages/Barrio'

export default function App() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    // Con #ancla, la pantalla misma se encarga de bajar hasta esa sección.
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="calma" element={<Calma />} />
        <Route path="distraer" element={<Distraer />} />
        <Route path="musica" element={<Musica />} />
        <Route path="videos" element={<Videos />} />
        <Route path="juegos/memorama" element={<Memorama />} />
        <Route path="juegos/deslizante" element={<Deslizante />} />
        <Route path="juegos/burbujas" element={<Burbujas />} />
        <Route path="juegos/pizarra" element={<Pizarra />} />
        <Route path="juegos/hueco" element={<Hueco />} />
        <Route path="juegos/acomodar" element={<Acomodar />} />
        <Route path="barrio" element={<Barrio />} />
        <Route path="mi-espacio" element={<MiEspacio />} />
        <Route path="mi-espacio/plan" element={<PlanDeSeguridad />} />
        <Route path="mi-espacio/caja" element={<Caja />} />
        <Route path="mi-espacio/personas" element={<Personas />} />
        <Route path="mi-espacio/medicamentos" element={<Medicamentos />} />
        <Route path="mi-espacio/como-voy" element={<ComoVoy />} />
        <Route path="mi-espacio/ajustes" element={<Ajustes />} />
        <Route path="ayuda" element={<Ayuda />} />
        <Route path="diario" element={<Diario />} />
        {/* Antes se llamaba Desahogo: los enlaces guardados siguen llegando. */}
        <Route path="desahogo" element={<Navigate to="/diario" replace />} />
        <Route path="especialista" element={<Especialista />} />
        <Route path="opinion" element={<Opinion />} />
        <Route path="panico" element={<Panico />} />
        <Route path="noche" element={<Noche />} />
        <Route path="responder" element={<Responder />} />
        <Route path="mascota" element={<Mascota />} />
        <Route path="mi-dia" element={<MiDia />} />
        <Route path="enojo" element={<Enojo />} />
        <Route path="redes" element={<Redes />} />
        <Route path="cuerpo" element={<Cuerpo />} />
        <Route path="*" element={<Inicio />} />
      </Route>
    </Routes>
  )
}
