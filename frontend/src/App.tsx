import { useEffect, useState } from 'react';
import { Devnet } from './components/Devnet';
import { init } from './fhevmjs';  // Zama's FHE wrapper
import './App.css';

// Import ethers v6 classes
import { JsonRpcProvider } from 'ethers';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [defaultAccount, setDefaultAccount] = useState<string>('');

  // 1) Create a local Hardhat provider (v6).
  const provider = new JsonRpcProvider('http://127.0.0.1:8545');

  // Hardhat test account 0:
  // 0x3500438F95D4CCc2e6cd00ab2EbC4ed979D8218c

  useEffect(() => {
    // 2) Initialize the Zama FHE lib
    init()
      .then(() => setIsInitialized(true))
      .catch(() => setIsInitialized(false));
  }, []);

  useEffect(() => {
    // 3) Grab the first local Hardhat account (v6 style)
    async function fetchAccounts() {
      try {
        setDefaultAccount("0x3500438F95D4CCc2e6cd00ab2EbC4ed979D8218c");
      } catch (err) {
        console.error('Error finding account:', err);
      }
    }
    fetchAccounts();
  }, [provider]);

  if (!isInitialized) {
    return <p>Loading FHE environment...</p>;
  }

  return (
    <>
      <h1>FHE Clicker!</h1>
      <Devnet
        account={defaultAccount}
        provider={provider}
        readOnlyProvider={provider}
      />
      <p className="read-the-docs">
        <a href="https://docs.zama.ai/fhevm">
          See the documentation for more information
        </a>
      </p>
    </>
  );
}

export default App;


  /*
  return (
    <>
      <h1>FHE Clicker!</h1>
      <Connect>
        {(account, provider, readOnlyProvider) => (
          <Devnet
            account={account}
            provider={provider}
            readOnlyProvider={readOnlyProvider}
          />
        )}
      </Connect>
      <p className="read-the-docs">
        <a href="https://docs.zama.ai/fhevm">
          See the documentation for more information
        </a>
      </p>
    </>
  );
}

export default App;
*/