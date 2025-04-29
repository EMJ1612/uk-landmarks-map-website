const fs = require('fs');
const path = require('path');

function filterTouristSpots() {
    try {
        // Read the original data
        const dataDir = path.join(__dirname, '..', 'data');
        const inputPath = path.join(dataDir, 'osm_tourist_spots.json');
        const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

        // Define categories and their criteria
        const categories = {
            landmarks: {
                name: 'Landmarks',
                filter: (item) => {
                    const tags = item.tags || {};
                    return (
                        tags.historic === 'monument' ||
                        tags.historic === 'memorial' ||
                        tags.historic === 'castle' ||
                        tags.historic === 'ruins' ||
                        tags.tourism === 'attraction' ||
                        tags.man_made === 'lighthouse' ||
                        tags.man_made === 'obelisk' ||
                        tags.man_made === 'tower'
                    );
                }
            },
            entertainment: {
                name: 'Entertainment',
                filter: (item) => {
                    const tags = item.tags || {};
                    return (
                        tags.tourism === 'theme_park' ||
                        tags.tourism === 'zoo' ||
                        tags.tourism === 'aquarium' ||
                        tags.leisure === 'amusement_arcade' ||
                        tags.leisure === 'water_park' ||
                        tags.leisure === 'miniature_golf' ||
                        tags.leisure === 'bowling_alley'
                    );
                }
            },
            museums_galleries: {
                name: 'Museums & Galleries',
                filter: (item) => {
                    const tags = item.tags || {};
                    return (
                        tags.tourism === 'museum' ||
                        tags.tourism === 'gallery' ||
                        tags.tourism === 'artwork'
                    );
                }
            },
            outdoor_activities: {
                name: 'Outdoor Activities',
                filter: (item) => {
                    const tags = item.tags || {};
                    return (
                        tags.leisure === 'park' ||
                        tags.leisure === 'garden' ||
                        tags.leisure === 'nature_reserve' ||
                        tags.leisure === 'golf_course' ||
                        tags.leisure === 'sports_centre' ||
                        tags.leisure === 'pitch' ||
                        tags.leisure === 'playground' ||
                        tags.leisure === 'swimming_pool'
                    );
                }
            },
            viewpoints: {
                name: 'Viewpoints',
                filter: (item) => {
                    const tags = item.tags || {};
                    return (
                        tags.tourism === 'viewpoint' ||
                        tags.natural === 'peak' ||
                        tags.natural === 'cliff'
                    );
                }
            }
        };

        // Process each category
        Object.entries(categories).forEach(([key, category]) => {
            const filteredItems = rawData.elements.filter(category.filter);
            
            // Add category information to each item
            const processedItems = filteredItems.map(item => ({
                ...item,
                category: category.name
            }));

            // Save to separate JSON file
            const outputPath = path.join(dataDir, `tourist_spots_${key}.json`);
            fs.writeFileSync(
                outputPath,
                JSON.stringify({ elements: processedItems }, null, 4)
            );

            console.log(`Saved ${processedItems.length} ${category.name} to ${outputPath}`);
        });

        // Create a summary file with all categories
        const summary = Object.entries(categories).map(([key, category]) => {
            const filteredItems = rawData.elements.filter(category.filter);
            return {
                category: category.name,
                count: filteredItems.length,
                file: `tourist_spots_${key}.json`
            };
        });

        const summaryPath = path.join(dataDir, 'tourist_spots_summary.json');
        fs.writeFileSync(
            summaryPath,
            JSON.stringify({ categories: summary }, null, 4)
        );

        console.log('\nSummary of tourist spots by category:');
        summary.forEach(item => {
            console.log(`${item.category}: ${item.count} locations`);
        });

    } catch (error) {
        console.error('Error filtering tourist spots:', error.message);
    }
}

// Run the function
filterTouristSpots(); 