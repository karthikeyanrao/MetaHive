import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Home from './Home';
import Login from './login';
import PropertyList from './PropertyList';
import PropertyDetails from './PropertyDetails';
import AddProperty from './AddProperty';
import {Web3Provider} from "./context/Web3Context";
import BuilderRegistration from './BuilderRegistration';
import BuyerRegistration from './BuyerRegistration';
import { AuthProvider } from './context/AuthContext';
import BadgeGallery from './BadgeDetails';
import Settings from './Settings';

function App() {
  const NFT_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  return (
    <AuthProvider>
      <Web3Provider>
        <Router>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/properties" element={<PropertyList />} />
              <Route path="/property/:id" element={<PropertyDetails />} />
              <Route path="/add-property" element={<AddProperty />} />
              <Route path="/register/builder" element={<BuilderRegistration />} />
              <Route path="/register/buyer" element={<BuyerRegistration />} />
              <Route 
                path="/badges" 
                element={<BadgeGallery contractAddress={NFT_CONTRACT_ADDRESS} />} 
              />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </Router>
      </Web3Provider>
    </AuthProvider>
  );
}

export default App;
