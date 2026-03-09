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
  require('fs').writeFileSync('deployed_addresses.txt', nftAddress);

  // Use receiver address from env or fallback (env strongly recommended on public networks)
  const RECEIVER_ADDRESS = process.env.RECEIVER_ADDRESS || "0x3F05ee1F593293d16328c9d0C6E75ef617920968";
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