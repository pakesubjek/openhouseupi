import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import FormOpenHouse from './OpenHouse/FormOpenHouse';
import ScanOpenHouse from './OpenHouse/ScanOpenHouse';

const App = () => {
  return (
    <Router>
          <Routes>
            <Route path="/" element={<FormOpenHouse />} />
            <Route path="/qr" element={<ScanOpenHouse />} />
          </Routes>
    </Router>
  );
};

// Home Page Component
const Home = () => (
  <div>
    <h1>Welcome to Open House</h1>
    <p>Click the link above to access the registration form.</p>
  </div>
);

export default App;
