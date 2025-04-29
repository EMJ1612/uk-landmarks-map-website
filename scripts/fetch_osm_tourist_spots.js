const fs = require('fs');
const path = require('path');
const https = require('https');

// Function to make HTTP request
function makeRequest(url, data) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(url, options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve(parsedData);
                } catch (error) {
                    reject(new Error('Failed to parse response: ' + error.message));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

async function fetchTouristSpots() {
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    
    // Updated query with more specific parameters
    const query = `
    [out:json][timeout:180];
    (
      node["tourism"~"attraction|museum|gallery|zoo|theme_park|viewpoint"](49.9,-10.5,58.6,1.9);
      node["historic"~"castle|monument|memorial|ruins|archaeological_site"](49.9,-10.5,58.6,1.9);
      node["amenity"="attraction"](49.9,-10.5,58.6,1.9);
      node["leisure"~"park|garden|nature_reserve"](49.9,-10.5,58.6,1.9);
    );
    out body;
    >;
    out skel qt;
    `;

    try {
        // Create data directory if it doesn't exist
        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log('Created data directory');
        }

        console.log('Fetching data from OpenStreetMap...');
        console.log('Query:', query);
        
        const data = await makeRequest(overpassUrl, query);
        console.log('API Response received');
        console.log('Raw response:', JSON.stringify(data, null, 2));

        if (!data || !data.elements || !Array.isArray(data.elements)) {
            throw new Error('Invalid API response format');
        }

        console.log(`Total elements received: ${data.elements.length}`);
        
        // Process the elements
        const processedElements = data.elements
            .filter(element => {
                // Only include elements with valid location data and a name
                return element.lat && element.lon && element.tags && element.tags.name;
            })
            .map(element => {
                const tags = element.tags || {};
                return {
                    id: element.id,
                    type: element.type,
                    name: tags.name,
                    category: tags.historic || tags.tourism || tags.leisure || 'unknown',
                    description: tags.description || '',
                    website: tags.website || '',
                    opening_hours: tags.opening_hours || '',
                    address: tags['addr:street'] ? {
                        street: tags['addr:street'],
                        city: tags['addr:city'],
                        postcode: tags['addr:postcode']
                    } : null,
                    location: {
                        lat: element.lat,
                        lon: element.lon
                    },
                    tags: tags
                };
            });

        console.log(`Processed ${processedElements.length} tourist spots`);

        // Save to JSON file
        const outputPath = path.join(dataDir, 'osm_tourist_spots.json');
        fs.writeFileSync(outputPath, JSON.stringify({ elements: processedElements }, null, 4));

        console.log(`Successfully saved ${processedElements.length} tourist spots to ${outputPath}`);
    } catch (error) {
        console.error('Error fetching tourist spots:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
}

// Run the function
fetchTouristSpots(); 