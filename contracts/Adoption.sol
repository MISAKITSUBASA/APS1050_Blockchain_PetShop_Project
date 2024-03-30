pragma solidity ^0.5.0;

contract Adoption {
  address[16] public adopters;

  // Adopting a pet
  function adopt(uint petId) public returns (uint) {
    // require(petId >= 0 && petId <= 15, "Pet ID must be within range 0 to 15.");

    adopters[petId] = msg.sender;


    return petId;
  }

  // Unadopting a pet
  function unadopt(uint petId) public returns (uint) {
    // require(petId >= 0 && petId <= 15, "Pet ID must be within range 0 to 15.");

    adopters[petId] = address(0) ;

    // Emitting event after successful adoption
    return petId;
  }

  // Retrieving the adopters
  function getAdopters() public view returns (address[16] memory) {
    return adopters;
  }

}