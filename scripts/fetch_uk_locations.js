const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function fetchUkLocations() {
    console.log("Fetching UK locations from OpenStreetMap...");
    
    // Overpass API query for UK mainland
    const query = `
    [out:json][timeout:90];
    (
      node["place"~"city|town|village|hamlet|suburb"](50.0,-8.0,59.0,2.0);
    );
    out body;
    >;
    out skel qt;
    `;
    
    try {
        console.log("Sending query to Overpass API...");
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
        console.log(`Received response with ${data.elements?.length || 0} elements`);
        
        if (!data.elements || data.elements.length === 0) {
            console.log("No elements found in response. Response data:", JSON.stringify(data, null, 2));
            return;
        }
        
        const locations = new Set(); // Set to handle duplicates
        
        // Process the response
        data.elements.forEach(element => {
            if (element.type === 'node') {
                const tags = element.tags || {};
                const name = tags.name;
                const placeType = tags.place;
                
                // Skip if no name or invalid place type
                if (!name || !placeType) return;
                
                // Determine the location type
                let type = 'other';
                switch(placeType) {
                    case 'city':
                        type = 'city';
                        break;
                    case 'town':
                        type = 'town';
                        break;
                    case 'village':
                        type = 'village';
                        break;
                    case 'hamlet':
                        type = 'hamlet';
                        break;
                    case 'suburb':
                        type = 'suburb';
                        break;
                }
                
                locations.add(JSON.stringify({
                    name: name,
                    lat: element.lat,
                    lon: element.lon,
                    type: type,
                    population: tags.population || null
                }));
            }
        });
        
        // Convert Set to Array and sort
        const locationsArray = Array.from(locations)
            .map(location => JSON.parse(location))
            .sort((a, b) => {
                // Sort by type
                const typeOrder = { city: 1, town: 2, village: 3, hamlet: 4, suburb: 5, other: 6 };
                if (typeOrder[a.type] !== typeOrder[b.type]) {
                    return typeOrder[a.type] - typeOrder[b.type];
                }
                // Sort alphabetically within each type
                return a.name.localeCompare(b.name);
            });
        
        console.log(`Found ${locationsArray.length} locations`);
        console.log('Breakdown by type:');
        const typeCounts = locationsArray.reduce((acc, curr) => {
            acc[curr.type] = (acc[curr.type] || 0) + 1;
            return acc;
        }, {});
        Object.entries(typeCounts).forEach(([type, count]) => {
            console.log(`${type}: ${count}`);
        });
        
        // Save to file
        const outputFile = path.join(__dirname, '../data/uk_locations.json');
        fs.writeFileSync(
            outputFile,
            JSON.stringify({ elements: locationsArray }, null, 4),
            'utf8'
        );
        
        console.log(`Saved locations to ${outputFile}`);
        
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', await error.response.text());
        }
    }
}

// Run the script
fetchUkLocations(); 