pragma solidity ^0.5.0;

contract Adoption {
    // Define an array of 16 addresses to store adopters
    address[16] public adopters;
    // Maps user addresses to an array of adopted pet IDs
    mapping(address => uint[]) private userAdoptionHistory;

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
        userAdoptionHistory[msg.sender].push(petId);  // Append pet to the user's adoption history

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
    // Get the most adopted breed
    function getMostAdoptedBreed() public view returns (string memory) {
        uint[] memory breedCount = new uint[](petIds.length);
        uint maxCount = 0;
        uint maxIndex = 0;
        for (uint i = 0; i < petIds.length; i++) {
            if (pets[petIds[i]].owner != address(0)) { // Check if the pet is owned by someone
                for (uint j = 0; j < petIds.length; j++) {
                    if (keccak256(abi.encodePacked(pets[petIds[i]].breed)) == keccak256(abi.encodePacked(pets[petIds[j]].breed))) {
                        breedCount[i]++;
                    }
                }
                if (breedCount[i] > maxCount) {
                    maxCount = breedCount[i];
                    maxIndex = i;
                }
            }
        }
        return pets[petIds[maxIndex]].breed;
    }

    // function to return all pets's id that the user can adopt and the pets they arleady adopted in a dictionary format   
    function getAdoptablePets(address user) public view returns (uint[] memory, uint[] memory) {
        uint[] memory adoptablePets = new uint[](petIds.length);
        uint[] memory adoptedPets = new uint[](petIds.length);
        uint adoptableIndex = 0;
        uint adoptedIndex = 0;
        for (uint i = 0; i < petIds.length; i++) {
            if (pets[petIds[i]].owner == address(0)) {
                adoptablePets[adoptableIndex] = petIds[i];
                adoptableIndex++;
            } else if (pets[petIds[i]].owner == user) {
                adoptedPets[adoptedIndex] = petIds[i];
                adoptedIndex++;
            }
        }
        return (adoptablePets, adoptedPets);
    }

    // Function to get a user's adoption history
    function getAdoptionHistory(address user) public view returns (uint[] memory) {
        return userAdoptionHistory[user];
    }
}
