const express  = require('express');
const cors = require('cors');
const  jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
     origin : ['http://localhost:5173',
     'https://cardoctor-946d2.web.app',
     'https://cardoctor-946d2.firebaseapp.com'
     ],
     credentials : true
}));
app.use(express.json());
app.use(cookieParser());

//////////mongodb/////////////
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ey9o5hx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

//---------------my middleWare-------------
const logger  = async(req,res,next)=>{
     console.log('called:' ,req.method,req.url)
     next();
}
const verifyToken = async(req,res,next)=>{
    const token = req?.cookies?.token;
    console.log("token ",token);
    if(!token){
       return res.status(401).send({message: 'not authorized'})
    }
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
        if(err){
            console.log(err);
            return res.status(401).send({message: 'unauthorized'})
        }
        console.log('value in the token:',decoded);
        req.user = decoded;
        next();
    })
    

}
//---------------------------------------------------------
const cookieOption = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" ? true : false,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
}
async function run() {
  try {
    //await client.connect();
    const databaseCollection = client.db("carDoctor").collection("services");
    const bookingCollection = client.db("carDoctor").collection("booking");
    //-------------start----------------------
    //auth related API 
    app.post('/jwt',async(req,res)=>{
        const user = req.body;
        console.log(user);
        const token = jwt.sign(
            user,process.env.ACCESS_TOKEN_SECRET,{ expiresIn: '1h'}
        )

        res
        .cookie('token',token,cookieOption)
        .send({success : true});
    })
    app.post('/logout',async(req,res)=>{
        const user = req.body;
        console.log('logging out' ,user);
        res.clearCookie('token',{ ...cookieOption,maxAge: 0}).send({success:true})
    })
    //------------auth related API----end----------------------
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
    app.get('/booking',logger,verifyToken, async(req,res)=>{
        if(req.query.email !== req.user.email){
            return res.status(403).send({message: 'forbidden access'})
        }
        console.log(req.cookies)
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
    app.post('/booking', async(req,res)=>{
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
   // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
    //await client.close();
  }
}
run().catch(console.dir);
///////////////////////////////////////////////////////

