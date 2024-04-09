// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2; 

contract Donation {
    // set the owner of the petshop to be the second account in Ganache
    address payable public owner = address(0x293c16A242b6F8e5D7A059B25F0F803aE37DD35c);
    
    // Define a dictionary to store the donation amount of each donor
    mapping(address => uint) public donors;

    // Define a array to store the donation history
    struct Donation {
        address donor;
        uint amount;
        string message;
    }    
    // array of Donation structs
    Donation[] public donations;


    // constructor() {
    //     owner = payable(msg.sender);
    // }

    event DonationReceived(address indexed donor, uint amount, string message);

    function donate(string memory _message) public payable {
        require(msg.value > 0, "Donation should be more than 0");

        donors[msg.sender] += msg.value;
        Donation memory donation = Donation(msg.sender, msg.value, _message);
        donations.push(donation);

        emit DonationReceived(msg.sender, msg.value, _message);

        owner.transfer(msg.value);
    }


    function withdraw() public {
        require(msg.sender == owner, "Only the owner can withdraw funds");
        owner.transfer(address(this).balance);
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }


    function getDonationsHistory() public view returns (address[] memory, uint[] memory, string[] memory) {
        address[] memory donorAddresses = new address[](donations.length);
        uint[] memory amounts = new uint[](donations.length);
        string[] memory messages = new string[](donations.length);

        for (uint i = 0; i < donations.length; i++) {
            donorAddresses[i] = donations[i].donor;
            amounts[i] = donations[i].amount;
            messages[i] = donations[i].message;
        }

        return (donorAddresses, amounts, messages);
    }

    }
