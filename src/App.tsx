import { lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import Inicio from './pages/Inicio'
import Calma from './pages/Calma'
import Ayuda from './pages/Ayuda'
import Panico from './pages/Panico'
// Cada pantalla se descarga al abrirla, así ningún archivo pasa del límite de la copia
// sin internet (2 MB). Las de crisis se quedan en el archivo principal para abrir al instante.
const Distraer = lazy(() => import('./pages/Distraer'))
const Musica = lazy(() => import('./pages/Musica'))
const Escuchar = lazy(() => import('./pages/Escuchar'))
const Videos = lazy(() => import('./pages/Videos'))
const MiEspacio = lazy(() => import('./pages/MiEspacio'))
const PlanDeSeguridad = lazy(() => import('./pages/espacio/Plan'))
const Caja = lazy(() => import('./pages/espacio/Caja'))
const Personas = lazy(() => import('./pages/espacio/Personas'))
const Medicamentos = lazy(() => import('./pages/espacio/Medicamentos'))
const ComoVoy = lazy(() => import('./pages/espacio/ComoVoy'))
const Ajustes = lazy(() => import('./pages/espacio/Ajustes'))
const Diario = lazy(() => import('./pages/Diario'))
const Especialista = lazy(() => import('./pages/Especialista'))
const Opinion = lazy(() => import('./pages/Opinion'))
const Noche = lazy(() => import('./pages/Noche'))
const Responder = lazy(() => import('./pages/Responder'))
const Mascota = lazy(() => import('./pages/Mascota'))
const MiDia = lazy(() => import('./pages/MiDia'))
const Enojo = lazy(() => import('./pages/Enojo'))
const Redes = lazy(() => import('./pages/Redes'))
const Cuerpo = lazy(() => import('./pages/Cuerpo'))
const NoSale = lazy(() => import('./pages/NoSale'))
const Explorar = lazy(() => import('./pages/cuerpo/Explorar'))
const Nervios = lazy(() => import('./pages/Nervios'))
const Practicar = lazy(() => import('./pages/Practicar'))
const Memorama = lazy(() => import('./pages/juegos/Memorama'))
const Deslizante = lazy(() => import('./pages/juegos/Deslizante'))
const Burbujas = lazy(() => import('./pages/juegos/Burbujas'))
const Pizarra = lazy(() => import('./pages/juegos/Pizarra'))
const Hueco = lazy(() => import('./pages/juegos/Hueco'))
const Acomodar = lazy(() => import('./pages/juegos/Acomodar'))
const Hilos = lazy(() => import('./pages/juegos/Hilos'))
const DesdeAfuera = lazy(() => import('./pages/juegos/DesdeAfuera'))
const Barrio = lazy(() => import('./pages/Barrio'))

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
        <Route path="escuchar" element={<Escuchar />} />
        <Route path="videos" element={<Videos />} />
        <Route path="juegos/memorama" element={<Memorama />} />
        <Route path="juegos/deslizante" element={<Deslizante />} />
        <Route path="juegos/burbujas" element={<Burbujas />} />
        <Route path="juegos/pizarra" element={<Pizarra />} />
        <Route path="juegos/hueco" element={<Hueco />} />
        <Route path="juegos/acomodar" element={<Acomodar />} />
        <Route path="juegos/hilos" element={<Hilos />} />
        <Route path="juegos/desde-afuera" element={<DesdeAfuera />} />
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
        <Route path="nervios" element={<Nervios />} />
        <Route path="nervios/practicar" element={<Practicar />} />
        <Route path="cuerpo/explorar" element={<Explorar />} />
        <Route path="lo-que-no-sale" element={<NoSale />} />
        <Route path="*" element={<Inicio />} />
      </Route>
    </Routes>
  )
}
