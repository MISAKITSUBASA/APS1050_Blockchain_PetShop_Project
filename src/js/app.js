App = {
  web3Provider: null,
  contracts: {},
  petCount: 0,
  pets: {},

  init: async function () {
    try {
      // Initialize web3 and set up the contract instances
      await App.initWeb3();
      await App.initContract();

      // After ensuring the contract is initialized, fetch and display pets
      await App.fetchAndDisplayPets();
      await App.renderPets();

    } catch (error) {
      console.error("Could not initialize the app:", error);
    }
  },

  initWeb3: async function () {
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

  initContract: async function () {
    try {
      // Use fetch API or another promise-based method to ensure this is awaited
      const response = await fetch('Adoption.json');
      const AdoptionArtifact = await response.json();

      App.contracts.Adoption = TruffleContract(AdoptionArtifact);
      App.contracts.Adoption.setProvider(App.web3Provider);

      // Await for the contract to be initialized here, if necessary
      App.markAdopted(); // Make sure this function properly handles async operations
    } catch (error) {
      console.error("Failed to fetch Adoption.json", error);
      throw new Error("Failed to initialize the contract.");
    }
    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '.btn-unadopt', App.handleUnadopt);
    $(document).on('submit', '#petRegistrationForm', App.handleRegisterPet);
    $(document).on('click', '.btn-mostAdoptedBreed', App.handleMostAdoptedBreed);
    $(document).on('change', '.breedSelector', App.handleFilter);
    $(document).on('change', '.ageRange', App.handleFilter);
    $(document).on('change', '.locationSelector', App.handleFilter);
  },

  fetchAndDisplayPets: async function () {
    const blockchainPets = await App.fetchPetsFromBlockchain();
    const jsonPets = await App.fetchPetsFromJSON();

    // Combine and render pets data
    App.pets = { ...jsonPets, ...blockchainPets };
    console.log(App.pets, "App.pets after combining pets data")
    
  },

  fetchPetsFromBlockchain: async function () {
    // Fetch pets from the blockchain
    var adoptionInstance;

    const pets = {};
    try {
      adoptionInstance = await App.contracts.Adoption.deployed();
      const petIds = await adoptionInstance.getPetIds();
      console.log(petIds, "petIds")
      for (let i = 0; i < petIds.length; i++) {

        const petId = petIds[i]["c"][0];
        console.log(petId, "petId")
        const petData = await adoptionInstance.getPet(petId);
        pets[petId] = {
          id: petId,
          name: petData[0],
          breed: petData[1],
          age: petData[2]["c"][0],
          location: petData[3],
          picture: petData[4],
          owner: petData[5]
        };
      }
      console.log(pets, "pets from blockchain");
    } catch (error) {
      console.error("Could not fetch pets from blockchain:", error);
    }
    return pets;
  },

  fetchPetsFromJSON: function () {
    return new Promise((resolve, reject) => {
      $.getJSON('../pets.json', function (data) {
        resolve(data);
      }).fail(reject);
    });
  },

  renderPets: function (filteredPets = Object.values(App.pets)) {

    // Load locations into the location selector
    var locationSelectorVal = $('.locationSelector').val();
    var locationSelector = $('.locationSelector'); 
    var locations = new Set();

    Object.values(App.pets).forEach(pet => locations.add(pet.location));
    // console.log(locations, "locations")
    locationSelector.empty();
    locationSelector.append($("<option></option>").attr("value", "All").text("All"));
    
    locations.forEach(location => {
      // console.log(location, "location")
      var option = $("<option></option>").attr("value", location).text(location);
      locationSelector.append(option);
    });
    locationSelector.val(locationSelectorVal);

    // Load breeds into the breed selector
    var breedSelectorVal = $('.breedSelector').val();
    var breedSelector = $('.breedSelector');
    var breeds = new Set();

    Object.values(App.pets).forEach(pet => breeds.add(pet.breed));
    breedSelector.empty();
    breedSelector.append($("<option></option>").attr("value", "All").text("All"));
    breedSelector.val("All");
    breeds.forEach(breed => {
      var option = $("<option></option>").attr("value", breed).text(breed);
      breedSelector.append(option);
    });
    breedSelector.val(breedSelectorVal);
    // Render pets to the UI
    var petsRow = $('#petsRow');
    var petTemplate = $('#petTemplate');

    // Clear all petTemplate first
    petsRow.empty();

    for (let id in filteredPets) {
      let pet = filteredPets[id];
      petTemplate.find('.panel-title').text(pet.name);
      petTemplate.find('img').attr('src', pet.picture);
      petTemplate.find('.pet-breed').text(pet.breed);
      petTemplate.find('.pet-age').text(pet.age);
      petTemplate.find('.pet-location').text(pet.location);
      petTemplate.find('.btn-adopt').attr('data-id', pet.id);
      petTemplate.find('.btn-unadopt').attr('data-id', pet.id);
      petsRow.append(petTemplate.html());
    }
    App.markAdopted();

  },

  markAdopted: function (adopters, account) {
    // App.fetchAndDisplayPets
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      console.log(App.pets, "App.pets_143")
      // App.fetchAndDisplayPets();
      for (let i = 0; i < Object.values(App.pets).length; i++) {
        // console.log(App.pets[i], "App.pets[i]")
        if (!App.pets[i].owner || App.pets[i].owner === '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('.btn-adopt').text('Adopt').removeAttr('disabled');
          $('.panel-pet').eq(i).find('.btn-unadopt').text('Return').attr('disabled', true);
        } else if (App.pets[i].owner === account) {
          $('.panel-pet').eq(i).find('.btn-adopt').text('Adopt').attr('disabled', true);
          $('.panel-pet').eq(i).find('.btn-unadopt').text('Return').removeAttr('disabled');
        } else {
          $('.panel-pet').eq(i).find('.btn-adopt').text('Adopt').attr('disabled', true);
          $('.panel-pet').eq(i).find('.btn-unadopt').text('Return').attr('disabled', true);
        }
      }
    });

  },

  markUnadopted: function (adopters, account) {
    var adoptionInstance;

    App.contracts.Adoption.deployed().then(function (instance) {
      adoptionInstance = instance;

      return adoptionInstance.getAdopters.call();
    }).then(function (adopters) {
      // console.log(adopters)
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
        console.log(petId, "petId")
        console.log(typeof petId, "typeof petId")
        // App.pet[petId].owner = account;
        // Execute adopt as a transaction by sending account
        App.pets[petId].owner = account;

        console.log(adoptionInstance, "adoptionInstance");
        return adoptionInstance.adopt(petId,
          App.pets[petId].name,
          App.pets[petId].breed,
          App.pets[petId].age,
          App.pets[petId].location,
          App.pets[petId].picture,
          { from: account });
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
          // console.log(petId, "petId9999")
          // console.log(App.pet, "App.pet[petId]")
          // App.pet[petId].owner = '0x0000000000000000000000000000000000000000';
          // App.fetchAndDisplayPets();
          App.markAdopted();
          return location.reload();
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
        return App.fetchAndDisplayPets();
      }).catch(function (error) {
        console.log(error.message);
      });
    });

  },

  handleMostAdoptedBreed: function () {
    // Filter pets by most adopted breed
    var mostAdoptedBreed;
    var adoptionInstance;
    App.contracts.Adoption.deployed().then(function (instance) {
      adoptionInstance = instance;
      return adoptionInstance.getMostAdoptedBreed();
    }).then(function (result) {
      mostAdoptedBreed = result;
      const filteredPets = Object.values(App.pets).filter(pet => pet.breed === mostAdoptedBreed);
      console.log(filteredPets, "filteredPets")
      App.renderPets(filteredPets);
    }).catch(function (err) {
      console.log(err.message);
    });
  },

  handleFilter: function () {
    // Filter pets by breed, age, and location
    const breed = $('.breedSelector').val();
    const age = $('.ageRange').val();
    const location = $('.locationSelector').val();
    let filteredPets = Object.values(App.pets);

    if (breed !== 'All') {
      filteredPets = filteredPets.filter(pet => pet.breed === breed);
    }
    if (location !== 'All') {
      filteredPets = filteredPets.filter(pet => pet.location === location);
    }
    if (age !== 'All') {
      if (age === '0-1') {
        filteredPets = filteredPets.filter(pet => pet.age <= 1);
      }else if (age === '1-3') {
        filteredPets = filteredPets.filter(pet => pet.age > 1 && pet.age <= 3);
      }else if (age === '3-5') {
      filteredPets = filteredPets.filter(pet => pet.age > 3 && pet.age <= 5);
      }else if (age === '5+') {
        filteredPets = filteredPets.filter(pet => pet.age > 5);
      }
    }
    App.renderPets(filteredPets);
  }
  
};

$(function () {
  $(window).on('load', function () {
    App.init();
  });
});
