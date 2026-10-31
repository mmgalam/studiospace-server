import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { MongoClient, ObjectId } from 'mongodb';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const client = new MongoClient(process.env.MONGODB_URI);

async function start() {
  await client.connect();
  const db = client.db('studiospace');
  const studios = db.collection('studios');

  app.get('/', (req, res) => res.send('StudioSpace API running'));

  // Home: top-rated 6
  app.get('/api/studios/featured', async (req, res) => {
    const data = await studios.find().sort({ rating: -1 }).limit(6).toArray();
    res.json(data);
  });

  // সব studio (category ও search সহ)
  app.get('/api/studios', async (req, res) => {
    const { category, search } = req.query;
    const query = {};
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };
    res.json(await studios.find(query).toArray());
  });

  app.get('/api/studios/:id', async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }
    const studio = await studios.findOne({ _id: new ObjectId(req.params.id) });
    if (!studio) return res.status(404).json({ message: 'Studio not found' });
    res.json(studio);
  });

  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
}

start().catch(console.error);