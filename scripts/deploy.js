const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy NFT Contract
  const NFT = await ethers.getContractFactory("RealEstateNFT");
  const nft = await NFT.deploy();
  await nft.waitForDeployment();

  const nftAddress = await nft.getAddress();
  console.log("NFT Contract deployed at:", nftAddress);

  // Issue a test badge
  const testBadge = await nft.issueBadge(
    deployer.address,
    "MetaHive Tower",
    "Crypto Valley, Block #1",
    "https://metahive.com/badges/1"
  );
  console.log("Test badge issued:", await testBadge.wait());

  // Use the existing receiver address 
  const RECEIVER_ADDRESS = "0xA17c98A79470a8A5eF9C46c04104fb75D456b98c";
  console.log("Using receiver address:", RECEIVER_ADDRESS);

  // Deploy new Sender contract
  const Sender = await ethers.getContractFactory("Sender");
  const sender = await Sender.deploy(RECEIVER_ADDRESS);
  await sender.waitForDeployment();

  const senderAddress = await sender.getAddress();
  console.log("New Sender Contract deployed to:", senderAddress);
  
  // Verify the receiver address
  const configuredReceiver = await sender.receiver();
  console.log("Configured receiver address:", configuredReceiver);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });