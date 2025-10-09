import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm MetaHive Assistant. I can help you with properties, blockchain, NFTs, and platform features. What would you like to know?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Free rule-based chatbot responses
  const getBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Greetings
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return "👋 Hello! Welcome to MetaHive! I'm here to help you with real estate, blockchain, and NFT questions. How can I assist you today?";
    }
    
    // Properties
    if (message.includes('property') || message.includes('properties') || message.includes('house') || message.includes('home')) {
      if (message.includes('available') || message.includes('list')) {
        return "🏠 You can browse all available properties by clicking 'Explore Buildings' on the homepage or visiting the Properties page. Each property shows details like price, location, bedrooms, and amenities.";
      }
      if (message.includes('buy') || message.includes('purchase')) {
        return "💰 To buy a property:\n1️⃣ Browse properties\n2️⃣ Click on a property to view details\n3️⃣ Connect your MetaMask wallet\n4️⃣ Click 'Pay Now' to complete the purchase using blockchain technology";
      }
      if (message.includes('sell') || message.includes('list')) {
        return "📝 To list a property:\n1️⃣ Register as a Builder\n2️⃣ Go to your profile\n3️⃣ Click 'Add Property'\n4️⃣ Fill in property details\n5️⃣ Submit for listing\n\nYour property will be available for buyers to purchase!";
      }
      return "🏘️ Properties on MetaHive are blockchain-verified real estate with NFT ownership certificates. Each property has detailed information including price, location, features, and is backed by smart contracts for secure transactions.";
    }
    
    // Blockchain & NFTs
    if (message.includes('blockchain') || message.includes('nft') || message.includes('smart contract')) {
      if (message.includes('nft')) {
        return "🎨 NFTs (Non-Fungible Tokens) on MetaHive represent unique ownership of properties. When you buy a property, you receive an NFT certificate that proves your ownership on the blockchain. This makes property ownership transparent and secure.";
      }
      if (message.includes('blockchain')) {
        return "⛓️ Blockchain technology ensures all property transactions are secure, transparent, and immutable. Every purchase, sale, and ownership transfer is recorded on the blockchain, making real estate fraud nearly impossible.";
      }
      if (message.includes('smart contract')) {
        return "🤖 Smart contracts automatically execute property transactions when conditions are met. They eliminate the need for intermediaries, reduce costs, and ensure secure, instant property transfers.";
      }
      return "🔗 Blockchain technology makes real estate transactions more secure and transparent. NFTs represent property ownership, and smart contracts automate the buying/selling process.";
    }
    
    // Registration
    if (message.includes('register') || message.includes('sign up') || message.includes('join')) {
      if (message.includes('builder')) {
        return "👷‍♂️ To register as a Builder:\n1️⃣ Click 'Register' in the top menu\n2️⃣ Select 'Builder Registration'\n3️⃣ Fill in your company details and license information\n4️⃣ Submit your registration\n\nBuilders can list and sell properties!";
      }
      if (message.includes('buyer')) {
        return "🛒 To register as a Buyer:\n1️⃣ Click 'Register' in the top menu\n2️⃣ Select 'Buyer Registration'\n3️⃣ Fill in your personal details and income information\n4️⃣ Submit your registration\n\nBuyers can browse and purchase properties!";
      }
      return "📝 You can register as either a Builder (to sell properties) or a Buyer (to purchase properties). Choose the registration type that fits your needs and fill in the required information.";
    }
    
    // Wallet & Payment
    if (message.includes('wallet') || message.includes('metamask') || message.includes('payment') || message.includes('pay')) {
      return "💳 MetaHive uses MetaMask for secure blockchain transactions. Install MetaMask browser extension, connect your wallet, and you can make payments using cryptocurrency. All transactions are secure and recorded on the blockchain.";
    }
    
    // Platform Features
    if (message.includes('feature') || message.includes('how') || message.includes('what can') || message.includes('help')) {
      return "✨ MetaHive offers:\n🏠 Browse blockchain-verified properties\n💰 Buy properties with NFT ownership\n📝 List properties as a builder\n🔐 Secure wallet integration\n📊 Transparent transaction history\n🤖 Smart contract automation";
    }
    
    // Badges & NFTs
    if (message.includes('badge') || message.includes('certificate')) {
      return "🏆 When you purchase a property, you receive a unique NFT badge/certificate that proves your ownership. You can view your property badges in the Badges section of your profile.";
    }
    
    // Pricing & Costs
    if (message.includes('price') || message.includes('cost') || message.includes('expensive')) {
      return "💵 Property prices vary based on location, size, and features. All prices are displayed in USD. Transaction fees are minimal thanks to blockchain technology, and there are no hidden costs.";
    }
    
    // Security
    if (message.includes('safe') || message.includes('secure') || message.includes('trust')) {
      return "🔒 MetaHive is extremely secure because:\n⛓️ All transactions use blockchain technology\n🤖 Smart contracts ensure automatic execution\n🎨 Property ownership is verified through NFTs\n🚫 No intermediaries means fewer security risks";
    }
    
    // Default responses
    const defaultResponses = [
      "🤖 I'm here to help with MetaHive questions! Ask me about properties, blockchain, NFTs, registration, or platform features.",
      "💡 I can help you with real estate, blockchain technology, property buying/selling, or MetaHive platform features. What would you like to know?",
      "🚀 Feel free to ask me about properties, how to buy/sell, blockchain benefits, NFT ownership, or anything about MetaHive platform!",
      "⭐ I'm your MetaHive assistant! I can explain properties, blockchain, smart contracts, registration process, or help you navigate the platform."
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Simulate typing delay for better UX
    setTimeout(() => {
      const botResponse = getBotResponse(currentInput);
      
      const botMessage = {
        id: messages.length + 2,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 1000); // 1 second delay to simulate thinking
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <div className="chatbot-toggle" onClick={toggleChatbot}>
        <span className="chat-icon">💬</span>
        {!isOpen && (
          <span className="notification-dot"></span>
        )}
      </div>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="header-content">
              <div className="bot-avatar">
                <span className="bot-icon">🤖</span>
              </div>
              <div className="header-text">
                <h3>MetaHive Assistant</h3>
                <span className="status">🟢 Always Online</span>
              </div>
            </div>
            <button className="close-btn" onClick={toggleChatbot}>
              <span className="close-icon">×</span>
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.sender}`}>
                <div className="message-content">
                  <div className="message-text">{message.text}</div>
                  <div className="message-time">{formatTime(message.timestamp)}</div>
                </div>
                {message.sender === 'bot' && (
                  <div className="message-avatar">
                    <span className="bot-icon">🤖</span>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="message bot">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <div className="message-avatar">
                  <span className="bot-icon">🤖</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-container">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about properties, blockchain, or anything else..."
              disabled={isLoading}
              className="chatbot-input"
            />
            <button 
              onClick={sendMessage} 
              disabled={!inputMessage.trim() || isLoading}
              className="send-button"
            >
              <span className="send-icon">📤</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Chatbot;
