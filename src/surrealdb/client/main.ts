import { Surreal, Uuid } from 'surrealdb';

const db = new Surreal();
let lastUpdateTime = Date.now();

interface Image extends Record<string, unknown> {
    id: string;
    title: string;
    creator: string;
    created: string;
}

interface QueryResponse<T> {
    status: string;
    time: string;
    result: T[];
}

async function init() {
    try {
        // Connect to the database
        await db.connect('ws://localhost:8000/rpc');
        console.log('Database connection completed');

        // Signin as root user
        await db.signin({
            username: 'root',
            password: 'root',
        });
        console.log('Root user signin completed');

        // Select a specific namespace / database
        await db.use({
            namespace: 'test',
            database: 'test',
        });
        console.log('Namespace and database selection completed');

        // First get initial data
        const userId = 'user1'; // Example user ID
        const initialData = await db.query(`
            SELECT * FROM images
            WHERE creator = $userId
            ORDER BY created DESC
            LIMIT 50
        `, { userId });
        console.log('Initial data:', initialData);

        // Keep track of our current images
        let currentImages: Image[] = initialData[0];
        updateDisplay(currentImages);
        console.log('Initial display update completed');

        const queryUuid: Uuid = (await db.query(`
            LIVE SELECT * FROM images
            WHERE creator = 'user1'
        `))[0] as Uuid;
        console.log('Query UUID:', queryUuid);

        // Start live query for the images table
        db.subscribeLive<Image>(queryUuid, (action, result) => {
            console.log('Live query action:', action);
            console.log('Live query result:', result);
            
            if (action === 'CLOSE') {
                console.log('Live query closed:', result);
                return;
            }

            lastUpdateTime = Date.now();
            
            switch (action) {
                case 'CREATE': {
                    if (result.creator === userId) {
                        currentImages = [result, ...currentImages].slice(0, 50);
                    }
                    break;
                }
                case 'UPDATE': {
                    currentImages = currentImages.map(img => 
                        img.id === result.id ? result : img
                    );
                    break;
                }
                case 'DELETE': {
                    currentImages = currentImages.filter(img => 
                        img.id !== result.id
                    );
                    break;
                }
            }

            const latency = Date.now() - lastUpdateTime;
            const latencyElement = document.getElementById('latency');
            if (latencyElement) {
                latencyElement.textContent = `Last update latency: ${latency}ms`;
            }

            updateDisplay(currentImages);
        });
        console.log('Live query setup completed');

        // Cleanup function
        window.addEventListener('beforeunload', () => {
            db.kill(queryUuid);
        });
    } catch (e) {
        console.error('Connection failed:', e);
    }
}

function updateDisplay(images: Image[]) {
    const grid = document.getElementById('imageGrid');
    if (!grid) return;
    
    grid.innerHTML = ''; // Clear current content
    
    images.forEach(image => {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.innerHTML = `
            <h3>${image.title}</h3>
            <p>Created by: ${image.creator}</p>
            <p>Created at: ${new Date(image.created).toLocaleString()}</p>
        `;
        grid.appendChild(card);
    });
}

init(); 