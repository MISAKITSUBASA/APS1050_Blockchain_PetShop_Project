const express = require('express');
const fs = require('fs');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

app.post('/savePet', (req, res) => {
    // Extract pet data from req.body
    const petData = req.body;

    // Convert pet data to JSON
    const petDataJson = JSON.stringify(petData, null, 2);

    // Write pet data to a JSON file
    fs.writeFile('pets.json', petDataJson, (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error saving pet data');
        } else {
            res.send('Pet data saved successfully');
        }
    });
});

app.listen(3000, () => console.log('Server listening on port 3000'));