import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Navbar from './components/Layout/NavBar/Navbar'
import Content from './components/Layout/Content/Content'
import SeccionPanelPrincipal from './Secciones/SeccionPanelPrincipal/SeccionPanelPrincipal'
import SeccionGestionDePaquetes from './Secciones/SeccionGestionDePaquetes/SeccionGestionDePaquetes'
import ArmadoRutasTab from './Secciones/SeccionGestionDePaquetes/Tabs/ArmadoRutas/ArmadoRutasTab'
import ArriboCargaTab from './Secciones/SeccionGestionDePaquetes/Tabs/ArriboCarga/ArriboCargaTab'
import VerPaquetesTab from './Secciones/SeccionGestionDePaquetes/Tabs/VerPaquetes/VerPaquetesTab'
import SeccionLogin from './Secciones/SeccionLogin/SeccionLogin'
import PrivateRoute from './components/Otros/PrivateRoutes/PrivateRoutes'
import GestionRutas from './Secciones/SeccionGestionDePaquetes/Tabs/GestionRutas/GestionRutas'
import Index from './Secciones/Index/Index'
import SeccionEmpleados from './Secciones/SeccionEmpleados/SeccionEmpleados'
import ListadoTab from './Secciones/SeccionEmpleados/Tabs/Listado/ListadoTab'
import CrearTrabajador from './Secciones/SeccionEmpleados/Tabs/CrearTrabajador/CrearTrabajadorTab'
import IngresarFacturacionTab from './Secciones/SeccionGestionDePaquetes/Tabs/IngresarFacturacion/IngresarFacturacion'
import DespachosTab from './Secciones/SeccionGestionDePaquetes/Tabs/Despachos/Despachos'
import EditarRutaTab from './Secciones/SeccionGestionDePaquetes/Tabs/EditarRuta/EditarRuta'
import BarcodePage from './Secciones/BarcodePage/BarcodePage'
import ReportesScreen from './Secciones/SeccionReportes/SeccionReportes'

function App() {

  return (
    <BrowserRouter>

      <Navbar />
      <Content>
        <Routes>
          <Route path="/barcode-page" element={<BarcodePage />} />
          <Route path="/login" element={<SeccionLogin />} />
          <Route path="/:id" element={<Index />} /> 
          <Route path="/" element={<Index />} /> 

          <Route element={<PrivateRoute />}>
            <Route path="/reportes" element={<ReportesScreen />} /> 
            <Route path="/SeccionEmpresa" element={<SeccionPanelPrincipal />} />
            <Route path="/SeccionEmpresa/Usuarios" element={<SeccionEmpleados />} >
              <Route path="listado" element={<ListadoTab />} />
              <Route path="crearTrabajador" element={<CrearTrabajador />} />
            </Route>
            <Route path="/SeccionEmpresa/GestionDePaquetes" element={<SeccionGestionDePaquetes />}>
              <Route path="ingresarFacturacion" element={<IngresarFacturacionTab />} />
              <Route path="arriboCarga" element={<ArriboCargaTab />} />
              <Route path="despachos" element={<DespachosTab />} />
              <Route path="armadoRutas" element={<ArmadoRutasTab />} />
              <Route path="verPaquetes/:query/:excluir" element={<VerPaquetesTab />} />
              <Route path="verPaquetes/:query" element={<VerPaquetesTab />} />
              <Route path="verPaquetes" element={<VerPaquetesTab />} />
              <Route path="gestionDeRutas" element={<GestionRutas />} />
              <Route path="editarRutas/:rutaID" element={<EditarRutaTab />} />
              <Route path="editarRutas" element={<Navigate to="/SeccionEmpresa/GestionDePaquetes/gestionDeRutas" />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Content>
    </BrowserRouter>
  )
}

export default App
