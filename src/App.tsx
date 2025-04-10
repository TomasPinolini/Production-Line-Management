import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ParticipantTypeManager } from './components/participants/ParticipantTypeManager';
import { ParticipantManager } from './components/participants/ParticipantManager';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Production Line Management System</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<ParticipantTypeManager />} />
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