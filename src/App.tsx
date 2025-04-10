import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ParticipantTypeManager } from './components/participants/ParticipantTypeManager';
import { ParticipantTypeSelector } from './components/participants/ParticipantTypeSelector';
import { ParticipantList } from './components/participants/ParticipantList';
import Home from './components/Home';
import Navigation from './components/Navigation';
import { Toaster } from 'react-hot-toast';

function App() {
  console.log('App component is rendering');
  
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/participant-types" element={<ParticipantTypeManager />} />
            <Route path="/participants" element={<ParticipantTypeSelector />} />
            <Route path="/participants/:typeId" element={<ParticipantList />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;