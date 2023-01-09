const Token = artifacts.require("CnToken");
const Governance = artifacts.require("CnGovernor");
const Treasury = artifacts.require("Treasury");

module.exports = async function (deployer) {
  const Web3 = require("web3");
  const web3 = new Web3("HTTP://127.0.0.1:7545");
  const [executor, proposer, voter1, voter2, voter3, voter4, voter5] =
    await web3.eth.getAccounts();
  const supply = web3.utils.toWei("1000", "ether");

  // Deploy token
  await deployer.deploy(Token, supply);
  const token = await Token.deployed();
  const amount = web3.utils.toWei("50", "ether");
  await token.transfer(voter1, amount, { from: executor });
  await token.transfer(voter2, amount, { from: executor });
  await token.transfer(voter3, amount, { from: executor });
  await token.transfer(voter4, amount, { from: executor });
  await token.transfer(voter5, amount, { from: executor });

  // Deploy governanace
  await deployer.deploy(Governance, token.address);
  const governance = await Governance.deployed();

  // Deploy Treasury
  const funds = web3.utils.toWei("20", "ether"); //voters will give 20 tokens

  await deployer.deploy(Treasury, executor, { value: funds });
  const treasury = await Treasury.deployed();

  const isReleased = await treasury.isReleased();
  console.log(`Funds released' ${isReleased}`);
  const encodedFunction = await treasury.contract.methods
    .releaseFunds()
    .encodeABI();
  const description = "Proposal 1";
  const tx = await governance.propose(
    [treasury.address],
    [0],
    [encodedFunction],
    description,
    { from: proposer }
  );
  const id = tx.logs[0].args.proposalId;
  console.log(`Created Proposal: ${id.toString()}\n`);
  let proposalState = await governance.state(id);
  console.log(
    `Current state of proposal: ${proposalState.toString()} (Pending) \n`
  );

  const deadline = await governance.proposalDeadline.call(id)
  console.log(`Proposal deadline on block ${deadline.toString()}\n`)

  const blockNumber = await web3.eth.getBlockNumber()
  console.log(`Current blocknumber: ${blockNumber}\n`)

  const quorum = await governance.quorum(blockNumber - 1)
  console.log(`Number of votes required to pass: ${web3.utils.fromWei(quorum.toString(), 'ether')}\n`)

};
