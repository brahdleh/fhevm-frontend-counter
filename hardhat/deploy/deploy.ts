import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // If you do NOT want to reset the chain on each deploy, remove next line
  //await hre.network.provider.send("hardhat_reset");

  const { deployer } = await hre.getNamedAccounts();
  const { deploy, getOrNull } = hre.deployments;

  // Check if contract was previously deployed
  const existingDeployment = await getOrNull("EncryptedCounter");
  const isNewDeployment = !existingDeployment;

  const deployed = await deploy("EncryptedCounter", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log(`EncryptedCounter contract: `, deployed.address);

  if (isNewDeployment) {
    console.log(`New Encrypted Counter deployed`);
  } else {
    console.log(`Encrypted Counter already deployed`);
  }
};

export default func;
func.id = "deploy_EncryptedCounter"; // id required to prevent reexecution
func.tags = ["EncryptedCounter"];