pragma solidity >=0.7.6;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';

import {BettingGame} from './BettingGame.sol';

contract BettingManager is Ownable {
	BettingGame public game;

	address public proposed;

	uint256 public timelock;

	uint256 public lockDuration = 3600; // 1 hour

	modifier notTimeLocked() {
		require(block.timestamp >= timelock, 'BettingManager: timelock not expired');
		_;
	}

	function proposeSetGame(address _game) public onlyOwner {
		proposed = _game;
		timelock = block.timestamp + lockDuration;
	}

	function setGame() public onlyOwner notTimeLocked {
		// todo: Update stats from old game
		/// ...

		// Change to new game
		game = BettingGame(_game);
	}

	function setLockDuration(uint256 _lockDuration) public onlyOwner {
		lockDuration = _lockDuration;
	}
}