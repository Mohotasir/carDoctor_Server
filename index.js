const express  = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
///////////////////////


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ey9o5hx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const databaseCollection = client.db("carDoctor").collection("services");
    const bookingCollection = client.db("carDoctor").collection("booking");
    app.get('/',(req,res)=>{
        res.send("app running");
    })
     app.get("/services",async(req,res)=>{
        const cursor = databaseCollection.find();
        const result = await  cursor.toArray();
        res.send(result);
    })
    app.get("/services/:id",async(req,res)=>{
         const id = req.params.id;
         const query = { _id: new ObjectId(id)};
         const options = {
            projection : {name:1 ,price:1,url:1},

         }
         const result = await databaseCollection.findOne(query,options)
         res.send(result);
    })
    app.get('/booking',async(req,res)=>{
        let query = {};
        if(req.query?.email){
            query = {email: req.query.email}
        }
        const result = await bookingCollection.find(query).toArray();
        res.send(result);
    })

    app.post('/services',async(req,res)=>{
         const service = req.body;
         const result = await databaseCollection.insertOne(service)
         res.send(result)
    })
    app.post('/booking',async(req,res)=>{
         const book = req.body;
         const result = await bookingCollection.insertOne(book)
         res.send(result)
    })
    app.delete('/booking/:id',async(req,res)=>{
        const id = req.params.id;
        console.log("deleted id is:",id)
        const query = {_id : new ObjectId(id)};
        const result = await bookingCollection.deleteOne(query);
        res.send(result)
 })
    app.listen(port,()=>{
        console.log(`app running on port : ${port}`)
    })
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
    //await client.close();
  }
}
run().catch(console.dir);
///////////////////////////////////////////////////////

