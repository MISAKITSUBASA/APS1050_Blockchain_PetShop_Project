var Donate = {
    web3Provider: null,
    contracts: {},
    donationCount: 0,
    donations: {},
    account: null,

    init: async function() {
        try {
            console.log("Initializing app...");
            return await Donate.initWeb3();

        } catch (error) {
            console.log("Error initializing app: ", error);

        }
       
    },

    initWeb3: async function() {
        // Initialize web3 and set the provider to the testRPC.
        if (window.ethereum) {
            Donate.web3Provider = window.ethereum;
            try {
                // Request account access
                await window.ethereum.enable();
            } catch (error) {
                // User denied account access...
                console.error("User denied account access")
            }
        }else if (window.web3) {
            Donate.web3Provider = window.web3.currentProvider;
        }else{
            Donate.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }

        web3 = new Web3(Donate.web3Provider);
        return Donate.initContracts();
    },

    initContracts: async function() {
        try {
            const data = await $.getJSON('Donation.json');
            var DonationArtifact = data;
            Donate.contracts.Donation = TruffleContract(DonationArtifact);
            Donate.contracts.Donation.setProvider(Donate.web3Provider);
        } catch (error) {
            console.log("Error initializing contracts: ", error);
            throw new Error("Error initializing contracts: ", error);
        }
        return Donate.page();
    },
    

    page: function() {
        // Code to get donations here
        web3.eth.getAccounts(function(error, accounts) {
            if (error) {
                console.log(error);
            }

            Donate.account = accounts[0];
            console.log(Donate.account,"line 67");
            web3.eth.getBalance(Donate.account, function(error, balance) {
                if (error) {
                    console.log(error);
                } else {
                    // Get the balance in ether
                    var balanceInEther = web3.fromWei(balance, "ether");
                    // get it to be a number
                    balanceInEther = Number(balanceInEther);
                    console.log(balanceInEther);
                    // Display the balance in ether

                    $("#accountBalance").text(balanceInEther);
                    $("#accountBalance").css("display", "block");
                    $("#accountBalance").css("text-align", "center");
                }
            });
            // get the Donation History
            
            Donate.contracts.Donation.deployed().then(function(instance) {
                donationInstance = instance;

                
                return donationInstance.getDonationsHistory();
            }).then(function(result) {
                const donationsHistory = result;
                const messages = donationsHistory[2].map(hexMessage => web3.toAscii(hexMessage));
                console.log(messages);
                console.log(result);
                // render the donations
                for (let i = 0; i < result[0].length; i++) {
                    let donor = result[0][i];
                    let amount = web3.fromWei(result[1][i], "ether");
                    // let message = result[2][i];

                    let donationRow = `<tr><td>${donor}</td><td>${amount}</td></tr>`;
                    $("#donationMessages tbody").append(donationRow);
                }
            }).catch(function(err) {
                console.log(err.message);
            });

        });
        
    },

    handleDonation: function() {
        // Code to handle a donation here
        console.log("Handling donation...");
        web3.eth.getAccounts(function(error, accounts) {
            if (error) {
                console.log(error);
            }

            Donate.account = accounts[0];
            console.log(Donate.account);
            var donationInstance;
            Donate.contracts.Donation.deployed().then(function(instance) {
                donationInstance = instance;

                var donationAmount = $("#donationAmount").val();
                var donationMessage = $("#donationMessage").val();
                console.log(donationAmount, donationMessage);

                return donationInstance.donate(donationMessage, {from: Donate.account, value: web3.toWei(donationAmount, "ether")});
            }).then(function(result) {
                console.log(result);
                alert("Donation successful!");
            }).catch(function(err) {
                console.log(err.message);
            });
        }
        );
    }

};

$(function() {
    $(window).load(function() {
        Donate.init();
    });
});