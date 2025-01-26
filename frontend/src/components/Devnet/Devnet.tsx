import { useEffect, useState } from 'react';
// Import the pieces you need from ethers v6
import { Contract, ZeroAddress, type JsonRpcProvider } from 'ethers';

import { getInstance } from '../../fhevmjs';
import { reencryptEuint8 } from '../../../../hardhat/test/reencrypt.ts';

// Adjust the path to your local EncryptedCounter artifact
import encryptedCounterLocal from '../../../../hardhat/deployments/localhost/EncryptedCounter.json';
import './Devnet.css';

type DevnetProps = {
  account: string;
  provider: JsonRpcProvider;
  readOnlyProvider: JsonRpcProvider;
};

export const Devnet = ({
  account,
  provider,
  readOnlyProvider,
}: DevnetProps) => {

  // 1) State tracking
  const [contractAddress, setContractAddress] = useState(ZeroAddress);
  const [handleBalance, setHandleBalance] = useState('???');
  const [decryptedBalance, setDecryptedBalance] = useState('???');

  const [inputValue, setInputValue] = useState('0'); 
  const [handles, setHandles] = useState<Uint8Array[]>([]);
  const [encryption, setEncryption] = useState<Uint8Array>();

  // 2) Grab the FHE instance
  const instance = getInstance();

  useEffect(() => {
    // On mount, retrieve the contract address from the local artifact
    setContractAddress(encryptedCounterLocal.address);
  }, []);

  // 3) Read the handle (the encrypted counter) from the chain
  const getHandleBalance = async () => {
    if (contractAddress !== ZeroAddress) {
      try {
        // Use readOnly provider for a call
        const contract = new Contract(
          contractAddress,
          ['function getCounter() view returns (uint256)'],
          readOnlyProvider,
        );
        // ethers v6 -> returns a BigInt
        const res = await contract.getCounter();
        setHandleBalance(res.toString()); 
        setDecryptedBalance('???');
      } catch (error) {
        console.error('Error in getHandleBalance:', error);
      }
    }
  };

  useEffect(() => {
    // Whenever the contract or account changes, refresh the handle
    getHandleBalance();
  }, [account, contractAddress]);

  // 4) Encrypt an integer locally using the Zama FHE instance
  const encrypt = async (val: bigint) => {
    try {
      // The Zama FHE instance can build an encrypted input 
      const result = await instance
        .createEncryptedInput(contractAddress, account)
        .add8(val)
        .encrypt();

      setHandles(result.handles);
      setEncryption(result.inputProof);
    } catch (error) {
      console.error('Encryption error:', error);
    }
  };

  // 5) Write to the contract: increment the counter
  const increment = async () => {
    if (contractAddress !== ZeroAddress && handles.length && encryption) {
      try {
        encrypt(BigInt(inputValue));
        // In v6, getSigner() accepts an address or index
        const signer = await provider.getSigner(account);

        const contract = new Contract(
          contractAddress,
          ['function incrementBy(bytes, bytes) public'],
          signer
        );
        // Make sure first argument is 32 bytes if the contract expects bytes32
        const tx = await contract.incrementBy(handles[0], encryption);
        await tx.wait();

        // Refresh handle from chain
        await getHandleBalance();
      } catch (error) {
        console.error('Error calling incrementBy:', error);
      }
    }
  };

  // 6) Decrypt the local handle. 
  //    This uses your "reencryptEuint8" logic or any other FHE method
  const decrypt = async () => {
    // If handleBalance is still '???', skip
    if (handleBalance === '???') {
      return;
    }
    
    try {
      const signer = await provider.getSigner(account);
      const clearBalance = await reencryptEuint8(
        signer,
        instance,
        BigInt(handleBalance),
        contractAddress
      );

      setDecryptedBalance(clearBalance.toString());
    } catch (error: any) {
      if (error.message?.includes('Handle is not initialized')) {
        // If handle is uninitialized => the user’s balance is 0
        setDecryptedBalance('0');
      } else {
        console.error('Decryption error:', error);
      }
    }
  };

  return (
    <div>
      <h2>My Encrypted Counter</h2>
      <dl>
        <dt>Encrypted Value (handle):</dt>
        <dd>{handleBalance}</dd>

        <dt>Decrypted Value:</dt>
        <dd>{decryptedBalance}</dd>
      </dl>

      <button onClick={decrypt}>Decrypt My Counter</button>

      <hr />

      <div>
        <label>Increment Amount:</label>
        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button onClick={() => encrypt(BigInt(inputValue))}>
          Encrypt
        </button>
        <button onClick={increment}>
          Increment
        </button>
      </div>
      <hr />
      <details>
        <summary>Debug</summary>
        <pre>Contract: {contractAddress}</pre>
        <pre>Account:  {account}</pre>
        <pre>
          Handle: {handles.length ? 
            '0x' + Buffer.from(handles[0]).toString('hex') : ''}
        </pre>
        <pre>
          Proof: {encryption ? 
            '0x' + Buffer.from(encryption).toString('hex') : ''}
        </pre>
      </details>
    </div>
  );
};
