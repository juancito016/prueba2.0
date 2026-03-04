import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './views/LandingPage';
import { AdminPanel } from './views/AdminPanel';
import { PropertyDetail } from './views/PropertyDetail';
import { QuienesSomos } from './views/QuienesSomos';
import { FAQ } from './views/FAQ';
import { Contacto } from './views/Contacto';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/inmueble/:id" element={<PropertyDetail />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/quienes-somos" element={<QuienesSomos />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contacto" element={<Contacto />} />
      </Routes>
    </Router>
  );
}

export default App;
