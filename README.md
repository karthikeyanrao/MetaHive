# MetaHive 🐝
> Next-Generation Real Estate NFT Platform

MetaHive is a decentralized property listing and trading platform where buyers can purchase real estate using Ethereum, track ownership through blockchain NFTs, and interact directly with verified builders.

## 🚀 Features

- **Decentralized Purchasing**: Buy properties directly using Ethereum (ETH) with live CoinGecko USD/ETH price conversions.
- **NFT Ownership Badges**: Mint and transfer `MHB` (MetaHive Building) ERC721 badges to verify authentic property ownership on the Ethereum Sepolia Testnet.
- **Verification QR Codes**: Auto-generated QR codes on badges that link directly to the transaction hash on Etherscan.
- **Builder Dashboards**: Builders can list, manage, and verify their properties.
- **Firebase Backend**: Real-time property stats, document management, and seamless image uploading.
- **Chatbot Integrations**: Built-in smart chatbot to assist users with navigation.

---

## 🛠 Tech Stack

- **Frontend**: React.js, React Router, Ethers.js
- **Smart Contracts**: Solidity, Hardhat, OpenZeppelin (ERC721)
- **Database/Storage**: Firebase (Firestore, Authentication, Storage), MongoDB
- **Notifications**: React Toastify
- **CI/CD**: GitHub Actions

---

## 💻 Local Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/your-username/MetaHive.git
cd MetaHive
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root folder using the provided example:
```bash
cp .env.example .env
```
Populate the file with your actual API keys (Firebase config, Infura RPCs, Private Keys, Etherscan API, etc.).

### 4. Setup Local Blockchain (Hardhat)
In a separate terminal, spin up a local Hardhat node:
```bash
npx hardhat node
```

### 5. Deploy Smart Contracts Locally
In your main terminal, deploy the contracts to the local node:
```bash
npm run deploy:local
```
Copy the deployed contract addresses and add them to your `.env` file as `SENDER_ADDRESS` and `REACT_APP_NFT_CONTRACT_ADDRESS`.

### 6. Start the Frontend Application
```bash
npm start
```
Your app will be running at [http://localhost:3000](http://localhost:3000). Ensure your MetaMask is set to `Localhost 8545`.

---

## 🌍 Deploying to Public Testnets (Sepolia)

To deploy your smart contracts to the live Sepolia testnet instead of localhost:

1. Ensure your wallet has Testnet ETH (from a faucet).
2. Ensure your `.env` file contains your real `PRIVATE_KEY` and `SEPOLIA_RPC_URL` (Infura/Alchemy).
3. Run the deployment script:
   ```bash
   npm run deploy:sepolia
   ```
4. Verify the contract on Etherscan:
   ```bash
   npm run verify:sepolia
   ```

---

## 🧪 Testing

To run the smart contract unit tests:
```bash
npx hardhat test
```

To run the React frontend tests:
```bash
npm test
```

---

## 🔒 Security

- **Smart Contracts**: Powered by OpenZeppelin's audited standards. Features `Ownable` permissions for restrictive minting.
- **Database**: Secured by Firestore declarative RBAC rules (see `firestore.rules`). Users can only delete their own properties, and only authenticated users can mint NFTs. 
- **Secrets**: API keys and Private Keys are strictly omitted from version control.
