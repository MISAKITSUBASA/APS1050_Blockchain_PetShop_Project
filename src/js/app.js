App = {
  web3Provider: null,
  contracts: {},
  petCount: 0,
  pets: {},

  init: async function() {
    try {
      // Initialize web3 and set up the contract instances
      await App.initWeb3();
      await App.initContract();

      // After ensuring the contract is initialized, fetch and display pets
      await App.fetchAndDisplayPets();
    } catch(error) {
      console.error("Could not initialize the app:", error);
    }
  },

  initWeb3: async function() {
    // Initialize web3 and set up the provider
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        console.error("User denied account access");
        throw new Error("User denied account access");
      }
    } else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);
  },

  initContract: async function() {
    try {
      // Use fetch API or another promise-based method to ensure this is awaited
      const response = await fetch('Adoption.json');
      const AdoptionArtifact = await response.json();
  
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);
      App.contracts.Adoption.setProvider(App.web3Provider);
  
      // Await for the contract to be initialized here, if necessary
      await App.markAdopted(); // Make sure this function properly handles async operations
    } catch (error) {
      console.error("Failed to fetch Adoption.json", error);
      throw new Error("Failed to initialize the contract.");
    }
    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '.btn-unadopt', App.handleUnadopt);
    $(document).on('submit', '#petRegistrationForm', App.handleRegisterPet);
  },

  fetchAndDisplayPets: async function() {
    const blockchainPets = await App.fetchPetsFromBlockchain();
    const jsonPets = await App.fetchPetsFromJSON();

    // Combine and render pets data
    App.pets = {...jsonPets, ...blockchainPets}; // Adjust this merge logic based on your data structure
    App.renderPets();
  },

  fetchPetsFromBlockchain: async function() {
    // Fetch pets from the blockchain
    var adoptionInstance;

    const pets = {};
    try {
      adoptionInstance = await App.contracts.Adoption.deployed();
      const petIds = await adoptionInstance.getPetIds();
      console.log(petIds, "petIds")
      for (let i = 0; i < petIds.length; i++) {
        
        const petId = petIds[i]["c"][0];
        console.log(petId[i], "petId")
        const petData = await adoptionInstance.getPet(petId);
        pets[petId] = {
          name: petData[0],
          breed: petData[1],
          age: petData[2],
          location: petData[3],
          photo: petData[4],
          owner: petData[5]
        };
      }
      console.log(pets, "pets from blockchain");
    } catch (error) {
      console.error("Could not fetch pets from blockchain:", error);
    }
    return pets;
  },

  fetchPetsFromJSON: function() {
    return new Promise((resolve, reject) => {
      $.getJSON('../pets.json', function(data) {
        resolve(data);
      }).fail(reject);
    });
  },

  renderPets: function() {
    var petsRow = $('#petsRow');
    var petTemplate = $('#petTemplate');

    for (let id in App.pets) {
      let pet = App.pets[id];
      petTemplate.find('.panel-title').text(pet.name);
      petTemplate.find('img').attr('src', pet.picture);
      petTemplate.find('.pet-breed').text(pet.breed);
      petTemplate.find('.pet-age').text(pet.age);
      petTemplate.find('.pet-location').text(pet.location);
      petTemplate.find('.btn-adopt').attr('data-id', pet.id);
      petTemplate.find('.btn-unadopt').attr('data-id', pet.id);

      petsRow.append(petTemplate.html());
    }
  },

  markAdopted: function (adopters, account) {
    var adoptionInstance;

    App.contracts.Adoption.deployed().then(function (instance) {
      adoptionInstance = instance;

      return adoptionInstance.getAdopters.call();
    }).then(function (adopters) {
      console.log(adopters)

      for (i = 0; i < adopters.length; i++) {
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('.btn-adopt').text('Adopt').attr('disabled', true);
          $('.panel-pet').eq(i).find('.btn-unadopt').text('Return').removeAttr('disabled');

        }
      }

    }).catch(function (err) {
      console.log(err.message);
    });
  },

  markUnadopted: function (adopters, account) {
    var adoptionInstance;

    App.contracts.Adoption.deployed().then(function (instance) {
      adoptionInstance = instance;

      return adoptionInstance.getAdopters.call();
    }).then(function (adopters) {
      console.log(adopters)
      for (i = 0; i < adopters.length; i++) {
        if (adopters[i] == '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('.btn-adopt').text('Adopt').removeAttr('disabled');
          $('.panel-pet').eq(i).find('.btn-unadopt').text('Return').attr('disabled', true);
        }
      }
    }).catch(function (err) {
      console.log(err.message);
    });
  },

  handleAdopt: function (event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));
    console.log(petId, "petId")
    var adoptionInstance;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed().then(function (instance) {
        adoptionInstance = instance;

        // Execute adopt as a transaction by sending account
        // return adoptionInstance.adopt(petId, { from: account });
        return adoptionInstance.adopt(petId, App.pets[petId].name, App.pets[petId].breed, App.pets[petId].age, App.pets[petId].location, App.pets[petId].picture, { from: account });
      }).then(function (result) {
        return App.markAdopted();
      }).catch(function (err) {
        console.log(err.message);
      });
    });
  },

  handleUnadopt: function (event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    var unadoptInstance;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed()
        .then(function (instance) {
          unadoptInstance = instance;
          console.log(petId, "petId")
          // Execute unadopt as a transaction by sending account
          return unadoptInstance.unadopt(petId, { from: account });
        })
        .then(function (result) {
          console.log("fail at markunadopted.")
          return App.markUnadopted();
        })
        .catch(function (err) {
          console.log(err.message);
        });

    });
  },

  handleRegisterPet: function (event) {

    console.log("Form submission triggered");

    event.preventDefault();
    // get value from the form
    var petName = $('#petName').val();
    var petBreed = $('#petBreed').val();

    var petAge = parseInt($('#petAge').val(), 10);

    var petLocation = $('#petLocation').val();
    var petPhoto = 'images/' + $('#petPhoto').val().split('\\').pop();
    console.log(petPhoto, "petPhoto")
    // console log the type of these values to make sure they are correct
    console.log(typeof petName, typeof petBreed, typeof petAge, typeof petLocation, typeof petPhoto, "petName, petBreed, petAge, petLocation, petPhoto")


    web3.eth.getAccounts(function (error, account) {
      if (error) {
        console.log(error);
      }

      var account = account[0];

      App.contracts.Adoption.deployed().then(function (instance) {
        PetRegistrationInstance = instance;
        console.log(petName, petBreed, petAge, petLocation, petPhoto, "petName, petBreed, petAge, petLocation, petPhoto")
        console.log(App.pets.length, "App.pets.length")
        var numberOfPets = Object.keys(App.pets).length;
        PetRegistrationInstance.registerPet(numberOfPets, petName, petBreed, petAge, petLocation, petPhoto, { from: account });
        App.pets[numberOfPets] = { id: numberOfPets, name: petName, breed: petBreed, age: petAge, location: petLocation, picture: petPhoto };
        console.log(App.pets, "App.pets after adding new pet")
      }).then(function (result) {
        console.log('Pet registered successfully', result);
      }).catch(function (error) {
        console.log(error.message);
      });
    });

  }
};

$(function() {
  $(window).on('load', function() {
    App.init();
});
});
