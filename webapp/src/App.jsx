import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import JoinSession from './pages/JoinSession';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/join/:sessionCode" element={<JoinSession />} />
        <Route path="/session/:sessionCode" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
BlackedOnUser: false
