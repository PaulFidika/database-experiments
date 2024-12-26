import { MongoClient } from 'mongodb';

async function initReplicaSet() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    // Initialize replica set
    const admin = client.db('admin').admin();
    try {
      await admin.command({
        replSetInitiate: {
          _id: 'rs0',
          members: [{ _id: 0, host: 'localhost:27017' }]
        }
      });
      console.log('Replica set initialized successfully');
    } catch (error: any) {
      if (error.codeName === 'AlreadyInitialized') {
        console.log('Replica set already initialized');
      } else {
        throw error;
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

initReplicaSet().catch(console.error); 