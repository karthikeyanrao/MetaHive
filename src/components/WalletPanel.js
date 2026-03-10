import React from 'react';
import { X, Copy, ExternalLink, LogOut, Wallet } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';

function WalletPanel({ isOpen, onClose }) {
  const { isConnected, account, disconnectWallet } = useWeb3();

  if (!isOpen) return null;

  const handleCopy = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      alert('Address copied to clipboard!');
    }
  };

  const handleDisconnect = () => {
    if (disconnectWallet) {
      disconnectWallet();
    }
    // Fallback if disconnectWallet isn't fully implemented in context just reload
    window.location.reload(); 
    onClose();
  };

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-dark/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Slide-over panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-surface shadow-2xl z-50 transform transition-transform border-l border-border flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
             <Wallet size={20} className="text-dark" />
             <h2 className="font-display text-xl text-dark">Wallet</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-dark transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {isConnected && account ? (
            <div className="space-y-6">
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-400 to-yellow-300 flex-shrink-0"></div>
                <div>
                  <div className="font-body text-sm font-semibold text-dark">MetaMask</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="font-body text-xs text-muted">Connected</span>
                  </div>
                </div>
              </div>

              <div className="bg-tag border border-border rounded-xl p-4">
                <div className="font-body text-[11px] uppercase tracking-wider text-muted mb-2">Address</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-dark">{truncateAddress(account)}</span>
                  <div className="flex gap-2">
                    <button onClick={handleCopy} className="text-muted hover:text-dark transition-colors" title="Copy Address">
                      <Copy size={16} />
                    </button>
                    <a 
                      href={`https://etherscan.io/address/${account}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted hover:text-dark transition-colors"
                      title="View on Explorer"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-tag border border-border rounded-xl p-4">
                <div className="font-body text-[11px] uppercase tracking-wider text-muted mb-2">Network</div>
                <div className="font-body text-sm text-dark font-medium pb-2 border-b border-border border-dashed">Hardhat Local / Ethereum</div>
                <div className="font-body text-xs text-muted mt-2">
                  MetaHive is currently interacting with the Ethereum Virtual Machine compatible net.
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full flex items-center justify-center flex-col text-center opacity-70">
              <Wallet size={48} className="text-muted mb-4" />
              <p className="font-display text-xl text-dark mb-2">No Wallet Connected</p>
              <p className="font-body text-sm text-muted">Please tap Connect Wallet up top.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {isConnected && (
          <div className="p-6 border-t border-border bg-bg/50">
            <button 
              onClick={handleDisconnect}
              className="w-full flex items-center justify-center gap-2 py-3.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-body text-sm font-medium transition-colors"
            >
              <LogOut size={16} /> Disconnect
            </button>
          </div>
        )}

      </div>
    </>
  );
}

export default WalletPanel;
