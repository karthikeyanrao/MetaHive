export const SENDER_ADDRESS = "0xA887973a2EC1a3B4C7d50b84306eBCBC21bF2d5A";

export const SENDER_ABI = [
  {
    "inputs": [
      {
        "internalType": "address payable",
        "name": "_receiver",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "receiver",
    "outputs": [
      {
        "internalType": "address payable",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "sendEther",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
]; 