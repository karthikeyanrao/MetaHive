export const SENDER_ADDRESS = "0x0eb3e1DD67896AC8CF8c3a4b3008FaAB21a1bB0C";

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