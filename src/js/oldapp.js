App = {
    web3Provider: null,
    contracts: {},
    petCount: 0,
    pets: {},
    init: async function () {
      // Load pets.
  
      $.getJSON('../pets.json', function (data) {
        var petsRow = $('#petsRow');
        var petTemplate = $('#petTemplate');
        console.log(data, "data")
        // fetch the data and App.pets
  
        if (App.petCount == 0) {
          for (i = 0; i < data.length; i++) {
            console.log(typeof data[i].id, "data[i].id")
            App.pets[data[i].id] = {
              id: data[i].id,
              name: data[i].name,
              picture: data[i].picture,
              breed: data[i].breed,
              age: data[i].age,
              location: data[i].location
            };
          }
          App.petCount = data.length;
        } 
        // render based on 
        var petsRow = $('#petsRow');
        var petTemplate = $('#petTemplate');
        console.log(App.pets, "App.pets")
        
        for (let id in App.pets) {
          console.log(id, "id")
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
  
      });
      // render the home page based on the pets
  
  
      console.log(App.pets, "App.pets")
  
      return await App.initWeb3();
    },
  
    initWeb3: async function () {
  
      // Modern dapp browsers...
      if (window.ethereum) {
        App.web3Provider = window.ethereum;
        try {
          // Request account access
          await window.ethereum.enable();
        } catch (error) {
          // User denied account access...
          console.error("User denied account access")
        }
      }
      // Legacy dapp browsers...
      else if (window.web3) {
        App.web3Provider = window.web3.currentProvider;
      }
      // If no injected web3 instance is detected, fall back to Ganache
      else {
        App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      }
      web3 = new Web3(App.web3Provider);
  
      return App.initContract();
    },
  
    initContract: function () {
      $.getJSON('Adoption.json', function (data) {
        // Get the necessary contract artifact file and instantiate it with truffle-contract
        var AdoptionArtifact = data;
        App.contracts.Adoption = TruffleContract(AdoptionArtifact);
  
        // Set the provider for our contract
        App.contracts.Adoption.setProvider(App.web3Provider);
  
  
  
        // Use our contract to retrieve and mark the adopted pets
        return App.markAdopted();
      });
  
  
      return App.bindEvents();
    },
  
    bindEvents: function () {
      $(document).on('click', '.btn-adopt', App.handleAdopt);
      $(document).on('click', '.btn-unadopt', App.handleUnadopt);
      $(document).on('submit', '#petRegistrationForm', App.handleRegisterPet);
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
  
  $(function () {
    $(window).on("load", function () {
      App.init();
    });
  });
  