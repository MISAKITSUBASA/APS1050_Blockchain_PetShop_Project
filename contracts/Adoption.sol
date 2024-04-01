pragma solidity ^0.5.0;

contract Adoption {
    // Define an array of 16 addresses to store adopters
    address[16] public adopters;

    // Define a struct to hold pet information
    struct Pet {
        string name;
        string breed;
        uint age;
        string location;
        string photo;
        address owner;
    }

    // Define a dictionary (mapping) where the key is a petId and the value is a Pet struct
    uint[] public petIds;
    mapping(uint => Pet) public pets;

    // Adopting a pet
    function adopt(
        uint petId,
        string memory name,
        string memory breed,
        uint age,
        string memory location,
        string memory photo
    ) public returns (uint) {
        // require(petId >= 0 && petId <= 15, "Pet ID must be within range 0 to 15.");

        adopters[petId] = msg.sender;

        pets[petId] = Pet(name, breed, age, location, photo, msg.sender);

        // Check if petId exists in petIds, if not then add it
        bool exists = false;
        for (uint i = 0; i < petIds.length; i++) {
            if (petIds[i] == petId) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            petIds.push(petId);
        }

        return petId;
    }

    // Unadopting a pet
    function unadopt(uint petId) public returns (uint) {
        // require(petId >= 0 && petId <= 15, "Pet ID must be within range 0 to 15.");

        adopters[petId] = address(0);

        // update pets's corresponding owner to 0x0
        pets[petId].owner = address(0);

        // Emitting event after successful adoption
        return petId;
    }
    // Retrieving the adopters
    function getAdopters() public view returns (address[16] memory) {
        return adopters;
    }

    //  Get the pet information
    function getPet(
        uint petId
    )
        public
        view
        returns (
            string memory,
            string memory,
            uint,
            string memory,
            string memory,
            address
        )
    {
        return (
            pets[petId].name,
            pets[petId].breed,
            pets[petId].age,
            pets[petId].location,
            pets[petId].photo,
            pets[petId].owner
        );
    }

    // Get all pets Ids
    function getPetIds() public view returns (uint[] memory) {
        return petIds;
    }

    // Add a new pet
    function registerPet(
        uint petId,
        string memory name,
        string memory breed,
        uint age,
        string memory location,
        string memory photo
    ) public returns (uint) {
        pets[petId] = Pet(name, breed, age, location, photo, address(0));

        // Check if petId exists in petIds, if not then add it
        bool exists = false;
        for (uint i = 0; i < petIds.length; i++) {
            if (petIds[i] == petId) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            petIds.push(petId);
        }

        return petId;
    }


}
