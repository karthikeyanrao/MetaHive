import React, { createContext, useState, useContext, useEffect } from 'react';

const Web3Context = createContext();

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Check if connected to Sepolia network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0xaa36a7') { // 0xaa36a7 = 11155111 (Sepolia)
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0xaa36a7' }],
            });
          } catch (switchError) {
            // If Sepolia network doesn't exist, add it
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0xaa36a7',
                  chainName: 'Sepolia Test Network',
                  rpcUrls: ['https://sepolia.infura.io/v3/'],
                  nativeCurrency: {
                    name: 'Ethereum',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  blockExplorerUrls: ['https://sepolia.etherscan.io'],
                }],
              });
            } else {
              throw switchError;
            }
          }
        }

        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setAccount(accounts[0]);
        setIsConnected(true);
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
        alert('Please connect to Sepolia Test Network');
      }
    } else {
      alert('Please install MetaMask to use this feature!');
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
  };

  useEffect(() => {
    // Check if already connected
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
          }
        });

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        } else {
          setAccount(null);
          setIsConnected(false);
        }
      });
    }
  }, []);

  return (
    <Web3Context.Provider value={{ account, isConnected, connectWallet, disconnectWallet }}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  return useContext(Web3Context);
} 