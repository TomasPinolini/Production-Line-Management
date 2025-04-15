import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import { Navbar } from './components/Navbar';
import { AssetInstances } from './components/assets/AssetInstances';
import { Toaster } from 'react-hot-toast';

function App() {
  useEffect(() => {
    // Enable dark mode by default
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-dark-900 text-dark-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/instances" element={<AssetInstances />} />
          </Routes>
        </div>
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f8fafc',
            },
          }} 
        />
      </div>
    </Router>
  );
}

export default App;