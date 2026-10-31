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

  // নিজের studio-র তালিকা
  app.get('/api/my-studios', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    const data = await studios.find({ ownerEmail: email }).sort({ createdAt: -1 }).toArray();
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

    // নতুন studio যোগ
  app.post('/api/studios', async (req, res) => {
    const {
      title, category, hourlyRate, securityDeposit, maxCapacity,
      location, image, amenities, overview, ownerName, ownerEmail,
    } = req.body;

    const rate = Number(hourlyRate);
    const deposit = Number(securityDeposit);
    const capacity = Number(maxCapacity);

    if (!title?.trim() || !category || !location?.trim() || !image || !overview?.trim()) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    }
    if (!ownerEmail || !ownerName) {
      return res.status(400).json({ message: 'Host information is missing.' });
    }
    if (!(rate > 0) || !(deposit >= 0) || !(capacity > 0)) {
      return res.status(400).json({ message: 'Rate, deposit and capacity must be valid numbers.' });
    }

    const doc = {
      title: title.trim(),
      category,
      hourlyRate: rate,
      securityDeposit: deposit,
      maxCapacity: capacity,
      location: location.trim(),
      image,
      amenities: Array.isArray(amenities) ? amenities : [],
      overview: overview.trim(),
      rating: 0,
      ownerName,
      ownerEmail,
      createdAt: new Date(),
    };

    const result = await studios.insertOne(doc);
    res.status(201).json({ insertedId: result.insertedId });
  });

  // studio মুছে ফেলা
  app.delete('/api/studios/:id', async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const result = await studios.deleteOne({
      _id: new ObjectId(req.params.id),
      ownerEmail: email,
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Studio not found or you are not the owner.' });
    }
    res.json({ deleted: true });
  });

  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
}

start().catch(console.error);