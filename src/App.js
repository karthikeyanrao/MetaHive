import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Home from './Home';
import Login from './login';
import PropertyList from './PropertyList';
import PropertyDetails from './PropertyDetails';
import AddProperty from './AddProperty';
import { Web3Provider } from "./context/Web3Context";
import BuilderRegistration from './BuilderRegistration';
import BuyerRegistration from './BuyerRegistration';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './context/ProtectedRoute';
import BadgeGallery from './BadgeDetails';
import Settings from './Settings';
import ListedProperties from './ListedProperties';
import MyPurchases from './MyPurchases';
import Chatbot from './Chatbot';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const NFT_CONTRACT_ADDRESS = process.env.REACT_APP_NFT_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  return (
    <AuthProvider>
      <Web3Provider>
        <Router>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/properties" element={<ProtectedRoute><PropertyList /></ProtectedRoute>} />
              <Route path="/property/:id" element={<ProtectedRoute><PropertyDetails /></ProtectedRoute>} />
              <Route path="/add-property" element={<ProtectedRoute><AddProperty /></ProtectedRoute>} />
              <Route path="/register/builder" element={<BuilderRegistration />} />
              <Route path="/register/buyer" element={<BuyerRegistration />} />
              <Route
                path="/badges"
                element={<ProtectedRoute><BadgeGallery contractAddress={NFT_CONTRACT_ADDRESS} /></ProtectedRoute>}
              />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/listed-properties" element={<ProtectedRoute><ListedProperties /></ProtectedRoute>} />
              <Route path="/my-purchases" element={<ProtectedRoute><MyPurchases /></ProtectedRoute>} />
            </Routes>
            <Chatbot />
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
          </div>
        </Router>
      </Web3Provider>
    </AuthProvider>
  );
}

export default App;
