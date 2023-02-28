// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "hardhat/console.sol";

interface Hasher {
    function poseidon(uint256[2] calldata leftRight)
        external
        pure
        returns (uint256);
}

contract Validator {

    Hasher poseidonContract;
    address public chessContract;
    address public verifierContract;
    uint256 public inputHash;
    uint256 public outputHash;
    uint[] public legalMoveIndicies;
    uint public nextLegalMoveIndex;
    uint public winningMoveIndex;
    int256 public winningMoveValue;
    uint public lastChunkEndIndex;

    uint public constant INPUT_LEN = 112;
    uint public constant OUTPUT_LEN = 1858;

    int256 public constant MODULUS = 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001;
    uint256 public constant TWO_INV = 0x183227397098d014dc2822db40c0ac2e9419f4243cdcb848a1f0fac9f8000001;

    constructor (Hasher _poseidonContract, address _verifierContract, address _chessContract) {
        poseidonContract = _poseidonContract;
        verifierContract = _verifierContract;
        chessContract = _chessContract;

        //testing only
        legalMoveIndicies = [0, 5, 1804];
    }

    function setLegalMoveIndicies(uint[] calldata _legalMoveIndicies) public {
        require(msg.sender == chessContract);
        legalMoveIndicies = _legalMoveIndicies;
    }

    function hashInputs(uint256[INPUT_LEN] calldata inputs) public {
        uint256 _inputHash = poseidonContract.poseidon([inputs[0], inputs[1]]);

        for(uint i = 2; i < INPUT_LEN; i++) {
            _inputHash = poseidonContract.poseidon([_inputHash, inputs[i]]);
        }

        inputHash = _inputHash;
    }

    function hashOutputChunk(uint256[] calldata outputChunk, uint chunkStart, uint chunkEnd) public {
        require(chunkStart == lastChunkEndIndex);
        require(chunkEnd <= OUTPUT_LEN);
        uint256 currHash = outputHash;
        uint init = 0;

        if (outputHash == 0) {
            currHash = poseidonContract.poseidon([outputChunk[0], outputChunk[1]]);
            init = 2;

            //init winningMoveValue
            winningMoveIndex = 0;
            winningMoveValue = feltToInt(outputChunk[0]);

            if (nextLegalMoveIndex == 0) {
                advanceNextLegalMoveIndex();
            }
        }

        for (uint i = init; i < chunkEnd - chunkStart; i++) {
            if (i + chunkStart == nextLegalMoveIndex) {
                advanceNextLegalMoveIndex();
                int256 outputInt = feltToInt(outputChunk[i]);
                if (outputInt > winningMoveValue) {
                    winningMoveIndex = i + chunkStart;
                    winningMoveValue = outputInt;
                }
            }
            currHash = poseidonContract.poseidon([currHash, outputChunk[i]]);
        }

        outputHash = currHash;
        lastChunkEndIndex = chunkEnd;
    }

    function advanceNextLegalMoveIndex() private {
        uint currHeighestIndex = 10000;
        for (uint i = 0; i < legalMoveIndicies.length; i++) {
            if (legalMoveIndicies[i] > nextLegalMoveIndex) {
                if (legalMoveIndicies[i] < currHeighestIndex) {
                    currHeighestIndex = legalMoveIndicies[i];
                }
            }
        }
        nextLegalMoveIndex = currHeighestIndex;
    }

    function verify(bytes calldata proof, bytes calldata instances) public {
        require(inputHash != 0);
        require(outputHash != 0);

        (bool success, ) = verifierContract.call(abi.encodePacked(instances, inputHash, outputHash, proof));
        require(success);

        inputHash = 0;
        outputHash = 0;
        lastChunkEndIndex = 0;
    }

    function feltToInt(uint256 felt) private pure returns (int256) {
        if (felt > TWO_INV) {
            return (int256(felt) - MODULUS);
        } else {
            return int256(felt);
        }
    }

    function packInputs(uint256[][][] calldata inputs) public {

    }
}