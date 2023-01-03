pragma solidity ^0.8.0;
import "./safemath.sol";
import "./math.sol";
import "./betting.sol";
import {Ownable} from '../node_modules/@openzeppelin/contracts/access/Ownable.sol';

// SPDX-License-Identifier: UNLICENSED

// emit the play move events and the start game events
// betting will emit the end game events
//optional: emit check events

contract Leela {
    function initializeLeela() public returns (uint16[] memory array){
    }

    function getMove() public returns(uint16 move){
    }
}