import React from 'react';
import { Routes, Route } from 'react-router-dom';
import VotingPage from './components/VotingPage';
import StatsPage from './components/StatsPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import VoterList from './components/VoterList';
function App() {
  return (
    <Routes>
      <Route path="/" element={<VotingPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/voterlist" element={<VoterList />} />
    </Routes>
  );
}

export default App;
