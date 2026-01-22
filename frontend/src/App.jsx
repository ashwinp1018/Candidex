import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import StartInterview from './pages/StartInterview';
import Interview from './pages/Interview';
import Result from './pages/Result';
import Analytics from './pages/Analytics';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/start" element={<StartInterview />} />
        <Route path="/interview/:sessionId" element={<Interview />} />
        <Route path="/result/:sessionId" element={<Result />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </div>
  );
}

export default App;
