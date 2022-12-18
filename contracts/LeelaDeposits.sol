// SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.0;

contract LeelaContract {
    address private owner;

    mapping(address => uint) private balances;

    //Only owner can withraw from this contract
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    //requested withdraw amount must be available in the contract balance
    modifier withMinBalance(uint256 amount) {
        require(address(this).balance >= amount);
        _;
    }

    constructor() public {
        owner = msg.sender;
    }

    fallback() external payable {}

    receive() external payable {}

    function withdraw() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function deposit() payable public {
        require(msg.value > 0, "Cannot deposit zero or negative value");
        balances[msg.sender] += msg.value;
    }
    
    function withdraw(uint256 amount) public onlyOwner withMinBalance(amount) {
        payable(msg.sender).transfer(amount);
    }

}