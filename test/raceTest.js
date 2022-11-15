const { ethers } = require("hardhat");
const { expect, assert, AssertionError } = require("chai");
const web3 = require("web3");

//before each test
//let owner;
// let player1;
// let player2;
// let player3;
beforeEach(async function () {
  [owner, player1, player2, player3] = await ethers.getSigners();
  console.log("owner address: ", owner.address);
  console.log("player1 address: ", player1.address);
  console.log("player2 address: ", player2.address);
  console.log("player3 address: ", player3.address);
  const Race = ethers.getContractFactory(
    0,
    player1.address,
    "Alice",
    player2.address,
    "Bob",
    player3.address,
    "Charlie",
    15000,
    { gasLimit: 10000000 }
  );
});

describe("Startup test", function () {
  it("Should deploy contract", async function () {
    assert(3 == getTotalPlayers(), "Total players should be 3");
    assert(await isPlayer(player1.address), "Player1 is player 1");
    assert(await isPlayer(player2.address), "Player2 is player 2");
    assert(await isPlayer(player3.address), "Player3 is player 3");
    assert((await getPlayerName(1)) == "Alice", "Player1 is Alice");
    assert((await getPlayerName(2)) == "Bob", "Player2 is Bob");
    assert((await getPlayerName(3)) == "Charlie", "Player3 is Charlie");
    assert(
      (await getPlayerAddress(1)) == player1.address,
      "Player1 address is correct"
    );
    assert(
      (await getPlayerAddress(2)) == player2.address,
      "Player2 address is correct"
    );
    assert(
      (await getPlayerAddress(3)) == player3.address,
      "Player3 address is correct"
    );
    assert((await getPlayerCoins(1)) == 15000, "Player1 has 15000 coins");
    assert((await getPlayerCoins(2)) == 15000, "Player2 has 15000 coins");
    assert((await getPlayerCoins(3)) == 15000, "Player3 has 15000 coins");
    assert(
      (await getPlayerDistance(1)) == 0,
      "Player1 should have no distance"
    );
    assert(
      (await getPlayerDistance(2)) == 0,
      "Player2 should have no distance"
    );
    assert(
      (await getPlayerDistance(3)) == 0,
      "Player3 should have no distance"
    );
    assert((await Race.getRaceId()) == 0, "Race id should be 0");
  });

  it("update contract", async function () {
    await Race.connect(owner).startGame();
    await Race.connect(owner).updateContract(player1.address, 7000, 5, {
      gasLimit: 10000000,
    });
    assert((await getPlayerCoins(1)) == 7000, "Player1 has 2000 coins");
    assert((await getPlayerDistance(1)) == 5, "Player1 has 5 distance");
    assert(
      (await getPlayerCoins(2)) == 15000,
      "Player2 should not have changed"
    );
    assert(
      (await getPlayerDistance(2)) == 0,
      "Player2 should not have changed"
    );
    assert(
      (await getPlayerCoins(3)) == 15000,
      "Player3 should not have changed"
    );
    assert(
      (await getPlayerDistance(3)) == 0,
      "Player3 should not have changed"
    );
  });

  it("finish get winner default", async function () {
    await Race.connect(owner).startGame();
    await Race.connect(owner).end();
    assert(
      (await Race.getWinner()) == player1.address,
      "default winner is player1"
    );
    assert((await getPlayerCoins(1)) == 15000, "Player1 has 15000 coins");
    assert((await getPlayerDistance(1)) == 0, "Player1 has 0 distance");
  });

  it("finish get winner", async function () {
    await Race.connect(owner).startGame();
    await Race.connect(owner).updateContract(player1.address, 7000, 5, {
      gasLimit: 10000000,
    });
    await Race.connect(owner).updateContract(player2.address, 5000, 8, {
      gasLimit: 10000000,
    });
    await Race.connect(owner).updateContract(player3.address, 2000, 14, {
      gasLimit: 10000000,
    });
    await Race.connect(owner).end();

    assert(
      (await Race.getWinner()) == player3.address,
      "player3 largest distance"
    );
    assert((await getPlayerCoins(1)) == 7000, "Player1 has 2000 coins");
    assert((await getPlayerDistance(1)) == 5, "Player1 has 5 distance");
    assert((await getPlayerCoins(2)) == 5000, "Player2 has 5000 coins");
    assert((await getPlayerDistance(2)) == 8, "Player2 has 8 distance");
    assert((await getPlayerCoins(3)) == 2000, "Player3 has 2000 coins");
    assert((await getPlayerDistance(3)) == 14, "Player3 has 14 distance");
  });
});

describe("reverted tests", function () {
  it("start game reverted, not owner starts", async function () {
    await expect(Race.connect(player1).startGame()).to.be.reverted;
  });

  it("start game reverted, already started", async function () {
    Race.connect(owner).startGame();
    await expect(Race.connect(owner).startGame()).to.be.reverted;
  });

  // end game reverted
  it("end game reverted, not owner ends", async function () {
    await Race.connect(owner).startGame();
    await expect(Race.connect(player1).end()).to.be.reverted;
  });

  it("end game reverted, hasn't started", async function () {
    await expect(Race.connect(owner).end()).to.be.reverted;
  });

  // update contract reverted
  it("update contract reverted, before started", async function () {
    await expect(
      Race.connect(owner).updateContract(player1.address, 7000, 5, {
        gasLimit: 10000000,
      })
    ).to.be.reverted;
  });

  it("update contract reverted, not owner", async function () {
    await Race.connect(owner).startGame();
    await expect(
      Race.connect(player1).updateContract(player1.address, 7000, 5, {
        gasLimit: 10000000,
      })
    ).to.be.reverted;
  });

  it("update contract reverted, coins too many", async function () {
    await Race.connect(owner).startGame();
    await expect(
      Race.connect(owner).updateContract(player1.address, 17000, 5, {
        gasLimit: 10000000,
      })
    ).to.be.reverted;
  });

  it("update contract reverted, distance too little", async function () {
    await Race.connect(owner).startGame();
    Race.connect(owner).updateContract(player1.address, 7000, 6, {
      gasLimit: 10000000,
    });
    await expect(
      Race.connect(owner).updateContract(player1.address, 2000, 3, {
        gasLimit: 10000000,
      })
    ).to.be.reverted;
  });

  it("getWinner reverted, game hasn't finished", async function () {
    await Race.connect(owner).startGame();
    Race.connect(owner).updateContract(player1.address, 7000, 6, {
      gasLimit: 10000000,
    });
    await expect(Race.connect(owner).getWinner()).to.be.reverted;
  });

  it("getWinner reverted, not owner", async function () {
    await Race.connect(owner).startGame();
    await Race.connect(owner).updateContract(player1.address, 7000, 5, {
      gasLimit: 10000000,
    });
    await expect(Race.connect(owner).end()).to.be.reverted;
  });
});

async function getTotalPlayer() {
  return await Race.totalPlayer();
}

// function for getting a player in race
async function getPlayerName(playerId) {
  return await Race.getPlayerName(playerId);
}

async function getPlayerAddress(playerId) {
  return await Race.getPlayerAddress(playerId);
}

async function getPlayerCoins(playerId) {
  return await Race.getPlayerCoins(playerId);
}

async function isPlayer(address) {
  return await race.isPlayer(address);
}

async function getBalance(address) {
  var balance = (await ethers.provider.getBalance(address)) / 1e18;
  return balance;
}

async function getPlayerDistance(playerId) {
  return await Race.getPlayerDistance(playerId);
}
