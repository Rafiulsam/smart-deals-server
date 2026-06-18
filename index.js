const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config()

const dns = require('dns');

dns.setServers([
  '1.1.1.1',
  '8.8.8.8',
])

// Middlewares
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('smart server is running!');
});

//Direct connection string — no DNS SRV lookup needed
const uri = process.env.MONGODB_URI;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const productsCollection = client.db("smartDB").collection("products");
const bidCollection = client.db("smartDB").collection("bids");
const usersCollection = client.db("smartDB").collection("users");

async function run() {
  try {
    await client.connect();

    // apis for users

    app.post ("/users", async (req, res)=>{
      const newUser = req.body;
      const email = newUser.email;
      const query = { email: email };
     const existingUser = await usersCollection.findOne(query);
     if(existingUser){
       res.send({ message: "User already exists" });
     }  else{
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
     }
      
    })

    //apis for products
    app.get('/products', async (req, res) => {
       console.log(req.query);
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }
      const cursor = productsCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    app.post('/products', async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.status(201).send(result);
    });

    app.patch("/products/:id", async (req, res) => {
      const id = req.params.id;
      const updatedProduct = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          name: updatedProduct.name,
          price: updatedProduct.price
        }
      };
      const result = await productsCollection.updateOne(query, update);
      res.send(result);
    });

    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });


    // api for bids

    app.get('/bids', async (req, res)=>{
      const email = req.query.email;
      const query = {};
      if(email){
        query.buyer_email = email;
      } 
      const result = await bidCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/bids', async (req, res)=>{
      const bid = req.body;
      const result = await bidCollection.insertOne(bid);
      res.status(201).send(result);
    })




    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");

  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});