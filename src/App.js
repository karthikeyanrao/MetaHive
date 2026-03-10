import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './login';
import PropertyList from './PropertyList';
import PropertyDetails from './PropertyDetails';
import AddProperty from './AddProperty';
import { Web3Provider } from "./context/Web3Context";
import BuilderRegistration from './BuilderRegistration';
import BuyerRegistration from './BuyerRegistration';
import { AuthProvider } from './context/AuthContext';
import BadgeGallery from './BadgeDetails';
import Settings from './Settings';
import ListedProperties from './ListedProperties';
import MyPurchases from './MyPurchases';
import Chatbot from './Chatbot';
import ProtectedRoute from './ProtectedRoute';

function App() {
  const NFT_CONTRACT_ADDRESS = process.env.REACT_APP_NFT_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  return (
    <AuthProvider>
      <Web3Provider>
        <Router>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/properties" element={<PropertyList />} />
              <Route path="/property/:id" element={<PropertyDetails />} />
              <Route path="/add-property" element={
                <ProtectedRoute allowedRoles={['builder', 'Builder']}>
                  <AddProperty />
                </ProtectedRoute>
              } />
              <Route path="/register/builder" element={<BuilderRegistration />} />
              <Route path="/register/buyer" element={<BuyerRegistration />} />
              <Route
                path="/badges"
                element={<BadgeGallery contractAddress={NFT_CONTRACT_ADDRESS} />}
              />
              <Route path="/settings" element={<Settings />} />
              <Route path="/listed-properties" element={
                <ProtectedRoute allowedRoles={['builder', 'Builder']}>
                  <ListedProperties />
                </ProtectedRoute>
              } />
              <Route path="/my-purchases" element={
                <ProtectedRoute allowedRoles={['buyer', 'Buyer']}>
                  <MyPurchases />
                </ProtectedRoute>
              } />
            </Routes>
            <Chatbot />
          </div>
        </Router>
      </Web3Provider>
    </AuthProvider>
  );
}

export default App;
