import { MongoClient, Sort } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

interface Image {
  _id: string;
  userId: string;
  url: string;
  createdAt: Date;
}

async function startClient() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('test');
    const collection = db.collection<Image>('images');

    // Set up change stream
    const changeStream = collection.watch([], {
      fullDocument: 'updateLookup'
    });

    // Track latency
    const latencyMap = new Map<string, number>();

    // Listen for changes
    changeStream.on('change', (change: any) => {
      if (change.operationType === 'insert') {
        const insertTime = new Date().getTime();
        const docId = change.fullDocument._id.toString();
        const createdAt = change.fullDocument.createdAt.getTime();
        const latency = insertTime - createdAt;

        latencyMap.set(docId, latency);
        console.log(`New image detected! Latency: ${latency}ms`);
        console.log('Document:', change.fullDocument);
      }
    });

    // Initial query
    const query = { userId: 'test-user' };
    const options = {
      sort: { createdAt: -1 } as Sort,
      limit: 10
    };

    const initialImages = await collection.find(query, options).toArray();
    console.log('Initial images:', initialImages);

    // Keep the process running
    process.stdin.resume();

  } catch (err) {
    console.error('Error:', err);
    await client.close();
  }
}

startClient().catch(console.error); 