import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Feed from './pages/Feed';
import Vault from './pages/Vault'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/vault" element={<Vault />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;