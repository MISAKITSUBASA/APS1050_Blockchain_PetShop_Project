App = {
  web3Provider: null,
  contracts: {},

  init: async function () {
    // Load pets.
    $.getJSON('../pets.json', function (data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);
        petTemplate.find('.btn-unadopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }
    });

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
    // $(document).on('submit', '#petRegistrationForm', App.handleRegisterPet);
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
        return adoptionInstance.adopt(petId, { from: account });
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
  handleRegisterPet: function(event){

    console.log("Form submission triggered");

    event.preventDefault();
    // get value from the form
    var petName = $('#petName').val();
    var petBreed = $('#petBreed').val();
    var petAge = $('#petAge').val();
    var petLocation = $('#petLocation').val();
    var petPhoto = $('#petPhoto').val();

    web3.eth.getAccounts(function (error, account){
      if (error){
        console.log(error);
      }

      var account = account[0]; 
      
      App.contracts.Adoption.deployed().then(function (instance){
        PetRegistrationInstance = instance;

        return PetRegistrationInstance.registerPet(petName, petBreed, petAge, petLocation, petPhoto, {from: account});
      }).then(function(result) {
        console.log('Pet registered successfully', result);
      }).catch(function (error){
        console.log(error.message);
      });
    });

  }

};

$(function () {
  $(window).on("load",function () {
    App.init();
  });
});
