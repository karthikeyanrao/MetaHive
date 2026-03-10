const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RealEstateNFT Buy Property", function () {
    it("should transfer NFT when bought", async function () {
        const [owner, buyer] = await ethers.getSigners();
        const NFT = await ethers.getContractFactory("RealEstateNFT");
        const nft = await NFT.deploy();

        // Mint 
        await nft.issueBadge(owner.address, "Building", "Loc", "URI");
        // ID = 0 because it's the first
        expect(await nft.ownerOf(0)).to.equal(owner.address);

        // Buy
        await nft.connect(buyer).buyProperty(0, owner.address, { value: ethers.parseEther("1") });

        // Verify
        expect(await nft.ownerOf(0)).to.equal(buyer.address);
    });
});
