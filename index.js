const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// Milldeware-------------------------------------------->
app.use(express.json());
app.use(cors());


// MondoDB Connection------------------------------------>
console.log(process.env.DB_USER, process.env.DB_PASS)
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.029e7jq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version carUser-nM8FelhRFQoqKfl5
const client = new MongoClient(uri, {
    serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
    }
});

async function run() {
    try {
    // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const serviceCollection = client.db('carDoctor').collection('services');
        const checkoutCollection = client.db('carDoctor').collection('checkouts');

        // Auth Related Api------------------------------------------------->
        app.post('/jwt', (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1hr'})

            res
            .cookie('token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'none'
            })
            .send({success: true})
        })

        // Services related api connection------------------------------------>
        app.get('/services', async(req, res) => {
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/services/:id', async(req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id)};

            const options = {
                projection: { customerName: 1, price: 1, service_id: 1, img: 1, title: 1 },
            };

            const result = await serviceCollection.findOne(query, options);
            res.send(result)

        } )

        // Checkouts Related Api---------------------------------------------->
        app.get('/checkouts', async(req, res) => {
            let query = {};
            if ( req.query?.email ) {
                query = { email: req.query.email }
            }
            const result = await checkoutCollection.find(query).toArray();
            res.send(result)
        })

        app.post('/checkouts', async(req, res) => {
            const checkout = req.body;
            console.log(checkout);
            const result = await checkoutCollection.insertOne(checkout);
            res.send(result)
        })

        app.patch('/checkouts/:id', async(req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id)}
            const updatedBookings = req.body;
            console.log(updatedBookings);
            const updatedDoc = {
                $set: {
                    status: updatedBookings.status
                },
            }
            const result = await checkoutCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })

        app.delete('/checkouts/:id', async(req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id)}
            const result = await checkoutCollection.deleteOne(query);
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
    // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get( '/', (req, res) => {
    res.send('Car Doctor Is Running')
})

app.listen( port, () => {
    console.log(`Car Doctor Is Running On Port ${port}`)
})