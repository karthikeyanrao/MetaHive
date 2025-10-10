const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Deploy Sender contract with a simple receiver address
  const Sender = await ethers.getContractFactory("Sender");
  const receiverAddress = "0x2546BcD3c84621e976D8185a91A922aE77ECEc30"; // Use deployer address as receiver
  const sender = await Sender.deploy(receiverAddress);
  await sender.waitForDeployment();

  const senderAddress = await sender.getAddress();
  console.log("Sender Contract deployed to:", senderAddress);
  console.log("Receiver address:", receiverAddress);
  
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
