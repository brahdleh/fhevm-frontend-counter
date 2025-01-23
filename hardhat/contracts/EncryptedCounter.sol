// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";
import { SepoliaZamaFHEVMConfig } from "fhevm/config/ZamaFHEVMConfig.sol";

/// @title EncryptedCounter
/// @notice A contract that maintains encrypted counters for each user 
/// @dev Uses TFHE library for fully homomorphic encryption operations
contract EncryptedCounter is SepoliaZamaFHEVMConfig {
    // Mapping from user address to their encrypted counter value (8-bit)
    mapping(address => euint8) private counters;

    /// @notice Increment the caller's counter by a given encrypted amount
    /// @param amount The encrypted increment
    /// @param inputProof The input proof for FHE
    function incrementBy(einput amount, bytes calldata inputProof) public {
        // Initialize counter if it doesn't exist
        if (!TFHE.isInitialized(counters[msg.sender])) {
            counters[msg.sender] = TFHE.asEuint8(0);
        }

        // Convert input to euint8 and add to sender's counter
        euint8 incrementAmount = TFHE.asEuint8(amount, inputProof);
        counters[msg.sender] = TFHE.add(counters[msg.sender], incrementAmount);

        // Make the final value re‐encryptable by the contract and by the sender
        TFHE.allowThis(counters[msg.sender]);
        TFHE.allow(counters[msg.sender], msg.sender);
    }

    /// @notice Get the encrypted counter for the caller
    /// @return The euint8 handle (encrypted integer)
    function getCounter() public view returns (euint8) {
        return counters[msg.sender];
    }
}
