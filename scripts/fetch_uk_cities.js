const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function fetchUkCities() {
    console.log("Fetching UK cities from OpenStreetMap...");
    
    // Overpass API query to get cities in the UK
    const query = `
    [out:json][timeout:25];
    area["name:en"="United Kingdom"]["admin_level"="2"]->.uk;
    (
      node["place"="city"](area.uk);
      node["place"="town"](area.uk);
    );
    out body;
    >;
    out skel qt;
    `;
    
    try {
        // Send request to Overpass API
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: query
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const cities = new Set(); // Using Set to automatically handle duplicates
        
        // Process the response
        data.elements.forEach(element => {
            if (element.type === 'node') {
                const tags = element.tags || {};
                const name = tags.name;
                
                // Skip if no name
                if (!name) return;
                
                cities.add(JSON.stringify({
                    name: name,
                    lat: element.lat,
                    lon: element.lon
                }));
            }
        });
        
        // Convert Set to Array and sort
        const citiesArray = Array.from(cities)
            .map(city => JSON.parse(city))
            .sort((a, b) => a.name.localeCompare(b.name));
        
        console.log(`Found ${citiesArray.length} cities`);
        
        // Save to file
        const outputFile = path.join(__dirname, '../data/uk_cities.json');
        fs.writeFileSync(
            outputFile,
            JSON.stringify({ elements: citiesArray }, null, 4),
            'utf8'
        );
        
        console.log(`Saved cities to ${outputFile}`);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Run the script
fetchUkCities(); 