import { MongoClient } from 'mongodb';
import faker from 'faker';
import dotenv from 'dotenv';

dotenv.config();

interface Image {
  userId: string;
  url: string;
  createdAt: Date;
}

async function startWriter() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('test');
    const collection = db.collection<Image>('images');

    // Generate and insert data every second
    setInterval(async () => {
      const image: Image = {
        userId: 'test-user',
        url: faker.image.imageUrl(),
        createdAt: new Date()
      };

      const result = await collection.insertOne(image);
      console.log(`Inserted image with ID: ${result.insertedId}`);
    }, 1000);

    // Keep the process running
    process.stdin.resume();

  } catch (err) {
    console.error('Error:', err);
    await client.close();
  }
}

startWriter().catch(console.error); 