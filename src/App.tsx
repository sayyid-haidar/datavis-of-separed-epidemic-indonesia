import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Overview } from './pages/Overview';
import { Jakarta } from './pages/Jakarta';
import { Regional } from './pages/Regional';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="jakarta" element={<Jakarta />} />
          <Route path="regional" element={<Regional />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
