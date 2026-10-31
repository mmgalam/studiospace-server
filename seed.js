import "dotenv/config";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);

const owner = {
  ownerName: "Demo Host",
  ownerEmail: "host@studiospace.test",
};

const studios = [
  {
    title: "Lumen Cyc Wall Photo Studio",
    category: "Photo Studio",
    hourlyRate: 45,
    securityDeposit: 100,
    maxCapacity: 12,
    location: "Gulshan 2, Dhaka",
    image:
      "https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=1200",
    amenities: [
      "Cyc Wall",
      "Strobe Lights",
      "Backdrop Rolls",
      "Makeup Station",
      "Wi-Fi",
    ],
    overview:
      "A bright 1,200 sq ft studio with a seamless white cyc wall, ideal for product, fashion and portrait shoots. Includes a changing room and a client lounge.",
    rating: 4.9,
  },
  {
    title: "Monolith Cinema Sound Stage",
    category: "Film Stage",
    hourlyRate: 120,
    securityDeposit: 300,
    maxCapacity: 40,
    location: "Banani, Dhaka",
    image:
      "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=1200",
    amenities: [
      "Soundproofing",
      "Lighting Grid",
      "Green Screen",
      "Power Backup",
      "Green Room",
    ],
    overview:
      "A fully soundproofed stage with a motorized lighting grid and a green screen corner. Built for short films, commercials and music videos.",
    rating: 4.8,
  },
  {
    title: "Echo Room Podcast Lounge",
    category: "Podcast Lounge",
    hourlyRate: 30,
    securityDeposit: 50,
    maxCapacity: 5,
    location: "Dhanmondi, Dhaka",
    image:
      "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200",
    amenities: [
      "4 Shure Mics",
      "Audio Interface",
      "Acoustic Panels",
      "Sofa Seating",
      "Coffee Bar",
    ],
    overview:
      "A cozy acoustically treated room with four broadcast microphones and a mixing desk. Perfect for interviews, solo shows and live-streamed panels.",
    rating: 4.7,
  },
  {
    title: "Vinyl Loop Music Recording Suite",
    category: "Music Suite",
    hourlyRate: 65,
    securityDeposit: 150,
    maxCapacity: 8,
    location: "Uttara, Dhaka",
    image:
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200",
    amenities: [
      "Vocal Booth",
      "Studio Monitors",
      "Grand Piano",
      "MIDI Controllers",
      "Engineer On Request",
    ],
    overview:
      "A two-room recording suite with an isolated vocal booth and a live room. Includes a grand piano and a full set of studio monitors.",
    rating: 4.9,
  },
  {
    title: "Clay & Canvas Art Workshop",
    category: "Workshop",
    hourlyRate: 25,
    securityDeposit: 40,
    maxCapacity: 20,
    location: "Mirpur 10, Dhaka",
    image:
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200",
    amenities: [
      "Easels",
      "Pottery Wheels",
      "Kiln Access",
      "Natural Light",
      "Storage Lockers",
    ],
    overview:
      "A sunlit workshop with easels, pottery wheels and a shared kiln. Great for classes, community sessions and personal projects.",
    rating: 4.6,
  },
  {
    title: "Golden Hour Rooftop Photo Deck",
    category: "Photo Studio",
    hourlyRate: 38,
    securityDeposit: 80,
    maxCapacity: 15,
    location: "Bashundhara R/A, Dhaka",
    image:
      "https://images.unsplash.com/photo-1527011046414-4781f1f94f8c?w=1200",
    amenities: [
      "Open Sky Light",
      "Reflectors",
      "Props Library",
      "Changing Room",
      "Wi-Fi",
    ],
    overview:
      "A rooftop deck with warm natural light and skyline views, best for sunset portraits, lifestyle shoots and brand campaigns.",
    rating: 4.5,
  },
  {
    title: "Black Box Film Studio",
    category: "Film Stage",
    hourlyRate: 95,
    securityDeposit: 250,
    maxCapacity: 30,
    location: "Mohakhali, Dhaka",
    image:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200",
    amenities: [
      "Blackout Walls",
      "LED Panels",
      "Dolly Track",
      "Monitor Station",
      "Parking",
    ],
    overview:
      "A compact blackout stage with LED panel lighting and a dolly track, suited for interviews, documentaries and cinematic tests.",
    rating: 4.7,
  },
  {
    title: "Soundwave Voiceover Booth",
    category: "Podcast Lounge",
    hourlyRate: 22,
    securityDeposit: 30,
    maxCapacity: 2,
    location: "Farmgate, Dhaka",
    image:
      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1200",
    amenities: [
      "Neumann Mic",
      "Pop Filter",
      "Soundproof Booth",
      "Headphone Amp",
    ],
    overview:
      "A small, quiet booth with a studio-grade condenser microphone. Ideal for voiceovers, audiobooks and dubbing sessions.",
    rating: 4.4,
  },
  {
    title: "Analog Dreams Band Rehearsal Suite",
    category: "Music Suite",
    hourlyRate: 40,
    securityDeposit: 90,
    maxCapacity: 10,
    location: "Mohammadpur, Dhaka",
    image:
      "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=1200",
    amenities: ["Drum Kit", "Guitar Amps", "PA System", "Air Conditioning"],
    overview:
      "A rehearsal room fitted with a full drum kit, amps and a PA system. Bring your instruments and plug in.",
    rating: 4.6,
  },
  {
    title: "Ink & Palette Painting Loft",
    category: "Workshop",
    hourlyRate: 28,
    securityDeposit: 50,
    maxCapacity: 14,
    location: "Lalmatia, Dhaka",
    image:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200",
    amenities: [
      "Large Windows",
      "Easels",
      "Paint Supplies Shelf",
      "Sink Station",
    ],
    overview:
      "A bright loft with large windows and a dedicated sink station for painting, calligraphy and mixed-media workshops.",
    rating: 4.5,
  },
  {
    title: "Neon Alley Content Creator Studio",
    category: "Photo Studio",
    hourlyRate: 35,
    securityDeposit: 70,
    maxCapacity: 8,
    location: "Dhanmondi 27, Dhaka",
    image:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200",
    amenities: ["Neon Sets", "Ring Lights", "Tripods", "Fast Wi-Fi"],
    overview:
      "A themed studio with neon sets and ring lights, built for short-form video, reels and social media content.",
    rating: 4.3,
  },
  {
    title: "Grand Hall Live Session Stage",
    category: "Film Stage",
    hourlyRate: 150,
    securityDeposit: 400,
    maxCapacity: 80,
    location: "Motijheel, Dhaka",
    image:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200",
    amenities: [
      "Stage Lighting",
      "Multi-Cam Setup",
      "Backstage Rooms",
      "Generator Backup",
    ],
    overview:
      "A large hall with a raised stage, a multi-camera rig and backstage rooms, made for concerts, live sessions and event recordings.",
    rating: 4.8,
  },
];

async function seed() {
  try {
    await client.connect();
    const col = client.db("studiospace").collection("studios");

    await col.deleteMany({ ownerEmail: owner.ownerEmail });

    const docs = studios.map((s) => ({
      ...s,
      ...owner,
      createdAt: new Date(),
    }));

    const result = await col.insertMany(docs);
    console.log(`Inserted ${result.insertedCount} studios`);
  } catch (err) {
    console.error("Seed failed:", err);
  } finally {
    await client.close();
  }
}

seed();
