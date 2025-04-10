import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ParticipantTypeManager } from './components/participants/ParticipantTypeManager';
import { ParticipantManager } from './components/participants/ParticipantManager';
import { Navigation } from './components/Navigation';
import { Home } from './components/Home';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/participant-types" element={<ParticipantTypeManager />} />
              <Route path="/participants" element={<ParticipantManager />} />
            </Routes>
          </div>
        </main>
      </div>
      <Toaster position="top-right" />
    </Router>
  );
}

export default App;