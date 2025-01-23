import { useEffect, useState } from 'react';
import { Devnet } from './components/Devnet';
import { init } from './fhevmjs';  // Zama's FHE wrapper
import './App.css';

import { JsonRpcProvider } from 'ethers';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [defaultAccount, setDefaultAccount] = useState<string>('');

  useEffect(() => {
    // Initialize the Zama FHE lib
    init()
      .then(() => setIsInitialized(true))
      .catch(() => setIsInitialized(false));
  }, []);

  // Create a local Hardhat provider
  const provider = new JsonRpcProvider('http://127.0.0.1:8545/');

  // Grab the first Hardhat account to use as the default signer
  useEffect(() => {
    provider.getSigner().then((account) => { 
      setDefaultAccount(account.address);
    });
  }, [provider]);
  /*

  
  Error because contract needs signer passed through as of ethers v6
  
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = provider.getSigner(); // automatically uses the first account
  const contract = new Contract(address, abi, signer); 
  
  
  
  
  */
  if (!isInitialized) return <p>Loading FHE environment...</p>;

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