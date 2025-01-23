import { useEffect, useState } from 'react';
import { Devnet } from './components/Devnet';
import { init } from './fhevmjs';
import './App.css';
//import { Connect } from './components/Connect';
//import ethers from '.../../../../hardhat/test/reencrypt';
import { JsonRpcProvider} from 'ethers';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    init()
      .then(() => {
        setIsInitialized(true);
      })
      .catch(() => setIsInitialized(false));
  }, []);

  if (!isInitialized) return null;

  const provider = new JsonRpcProvider('http://127.0.0.1:4173/')

  return (
    <>
      <h1>FHE Clicker!</h1>
        <Devnet
            account={"0x0000000000000000000000000000000000000000"}
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