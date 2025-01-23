import { useEffect, useState } from 'react';
import { getInstance } from '../../fhevmjs';
import { ethers, Provider, ZeroAddress } from 'ethers';
import { reencryptEuint8 } from '../../../../hardhat/test/reencrypt.ts';
import encryptedCounterLocal from '../../../../hardhat/deployments/localhost/EncryptedCounter.json';
// ^ Adjust path as needed to point to your local EncryptedCounter.json

import './Devnet.css';

type DevnetProps = {
  account: string;
  provider: Provider;
  readOnlyProvider: Provider;
};

export const Devnet = ({
  account,
  provider,
  readOnlyProvider,
}: DevnetProps) => {
  const [contractAddress, setContractAddress] = useState(ZeroAddress);

  const [handleBalance, setHandleBalance] = useState('???');     // The euint8 handle (encrypted)
  const [decryptedBalance, setDecryptedBalance] = useState('???');

  const [inputValue, setInputValue] = useState('0'); // The user input in numeric form
  const [handles, setHandles] = useState<Uint8Array[]>([]);
  const [encryption, setEncryption] = useState<Uint8Array>();

  // Grab the FHE instance
  const instance = getInstance();

  useEffect(() => {
    // On mount, retrieve the contract address from the local artifact
    // If you want to switch networks, handle that logic here.
    setContractAddress(encryptedCounterLocal.address);
  }, []);

  // 1) Read the handle (encrypted counter) from the chain
  const getHandleBalance = async () => {
    if (contractAddress !== ZeroAddress) {
      // Using read-only provider for calls
      const contract = new ethers.Contract(
        contractAddress,
        ['function getCounter() view returns (uint256)'],
        readOnlyProvider,
      );
      const res = await contract.getCounter();
      setHandleBalance(res.toString()); // The euint8 handle
      setDecryptedBalance('???');
    }
  };

  useEffect(() => {
    // Retrieve the latest handle whenever account or contract changes
    getHandleBalance();
  }, [account, contractAddress]);

  // 2) Encrypt an integer locally
  const encrypt = async (val: bigint) => {
    try {
      // The Zama FHE instance can build an encrypted input 
      // that can be passed to your contract’s "incrementBy(einput, bytes)"
      const result = await instance
        .createEncryptedInput(contractAddress, account)
        .add64(val) // or add8, etc. (note that your contract is euint8)
        .encrypt();

      setHandles(result.handles);
      setEncryption(result.inputProof);
    } catch (e) {
      console.error('Encryption error:', e);
    }
  };

  // 3) Write to the contract: increment the counter
  const increment = async () => {
    if (contractAddress !== ZeroAddress && handles.length && encryption) {
      const contract = new ethers.Contract(
        contractAddress,
        ['function incrementBy(bytes32, bytes) public'],
        provider.getSigner(account) // IMPORTANT: use a signer
      );
      const tx = await contract.incrementBy(handles[0], encryption);
      await tx.wait();

      // Refresh the euint8 handle from chain
      await getHandleBalance();
    }
  };

  // 4) Decrypt locally by re‐encrypting or calling a helper
  //    (This is pseudo-code. Adapt it to your actual reencrypt / decrypt approach.)
  const decrypt = async () => {
    try {
      const clearBalance = await reencryptEuint8(
          provider.getSigner(account),
          instance,
          BigInt(handleBalance),
          contractAddress
      );

      setDecryptedBalance(clearBalance.toString());
    } catch (error: any) {
      if (error.message?.includes('Handle is not initialized')) {
        // If handle is uninitialized = 0 => user’s balance is 0
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
        <button onClick={() => increment()}>
          Increment
        </button>
      </div>
        <details>
          <summary>Debug</summary>
          <pre>Contract: {contractAddress}</pre>
          <pre>Account:  {account}</pre>
          <pre>Handle:   {handles.length ? '0x' + Buffer.from(handles[0]).toString('hex') : ''}</pre>
          <pre>Proof:    {encryption ? '0x' + Buffer.from(encryption).toString('hex') : ''}</pre>
          </details>
      <hr />
    </div>
  );
};

/*
<details>
        <summary>Debug</summary>
        <pre>Contract: {contractAddress}</pre>
        <pre>Account:  {account}</pre>
        <pre>Handle:   {handles.length ? '0x' + Buffer.from(handles[0]).toString('hex') : ''}</pre>
        <pre>Proof:    {encryption ? '0x' + Buffer.from(encryption).toString('hex') : ''}</pre>
</details>
*/