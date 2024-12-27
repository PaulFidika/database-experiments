import { Surreal } from 'surrealdb';
import faker from 'faker';

const db = new Surreal();

async function init() {
    try {
        // Connect to the database
        await db.connect('http://127.0.0.1:8000/rpc');

        // Signin as root user
        await db.signin({
            username: 'root',
            password: 'root',
        });

        // Select a specific namespace / database
        await db.use({
            namespace: 'test',
            database: 'test',
        });

        // Create table if it doesn't exist
        try {
            await db.query(`
                DEFINE TABLE images SCHEMAFULL;
                DEFINE FIELD title ON images TYPE string;
                DEFINE FIELD creator ON images TYPE string;
                DEFINE FIELD created ON images DEFAULT time::now() VALUE $before OR time::now()
                    PERMISSIONS FULL;
            `);
        } catch (e) {
            console.error('Error creating table:', e);
        }

        // Start generating fake data
        const users = ['user1', 'user2', 'user3', 'user4', 'user5'];
        
        setInterval(async () => {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const imageData = {
                title: faker.commerce.productName(),
                creator: randomUser,
            };

            const startTime = Date.now();
            const result = await db.create('images', imageData);
            const endTime = Date.now();
            
            console.log(`Created image for ${randomUser}, write latency: ${endTime - startTime}ms`);
            console.log('Data:', result);
        }, 2000); // Generate new image every 2 seconds

    } catch (e) {
        console.error('Connection failed:', e);
    }
}

init(); 