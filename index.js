require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(cors());

// Token Verify Midddlewares
const verifyToken = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "Unauthorized access!!" });
  }
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access!!" });
    }
    req.decoded = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hqlh5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Database
    const DB = client.db("Prime-Pillar");
    const apartmentCollection = DB.collection("Apartments");
    const agreementCollection = DB.collection("Agreements");
    const announcementCollection = DB.collection("Announcements");
    // JWT API
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1200h",
      });
      res.send({ token });
    });
    // Get all apartments
    app.get("/apartments", async (req, res) => {
      const result = await apartmentCollection.find().toArray();
      res.send(result);
    });
    // Post Agrements
    app.post("/agreements", async (req, res) => {
      const agreement = req.body;
      const query = { email: agreement.email };
      const data = await agreementCollection.findOne(query);
      if (data) {
        return res.send({
          message: "Oops! You already have an active agreement",
        });
      }
      const result = await agreementCollection.insertOne(agreement);
      res.send(result);
    });
    // Announcement
    app.post("/announcements", async (req, res) => {
      const announcement = req.body;
      const result = await announcementCollection.insertOne(announcement);
      res.send(result);
    });
    // Connect MongoDB Client
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello From PrimePillar...");
});

app.listen(port, () => {
  console.log(`PrimePillar is running on port ${port}`);
});
