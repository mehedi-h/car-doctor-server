const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// Build In Milldeware-------------------------------------------->
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(cookieParser())

// Custom Middleware------------------------------------>
const logger = async(req, res, next) => {
    console.log('Custom middleware called', req.hostname, req.originalUrl);
    next();
}

const verifyToken = async(req, res, next) => {
    const token = req.cookies?.token;
    console.log('value of token of middleware', token);
    if (!token) {
        return res.status(401).send({message: 'Forbidden'})
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        // if error----------------------->
        
        if (err) {
            console.log(err);
            return res.status(401).send({message: 'Unauthorized'})
        }

        // if token is valid it would be decoded---------------------->
        console.log('value in the decoded', decoded);
        req.user = decoded;
        next()
    })
    
}

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
        app.post('/jwt', logger, async(req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1hr'})

            res
            .cookie('token', token, {
                httpOnly: true,
                secure: false,
                
            })
            .send({success: true})
        })

        app.post('/logout', async(req, res) => {
            const user = req.body;
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })

        // Services related api connection------------------------------------>
        app.get('/services', logger, async(req, res) => {
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
        app.get('/checkouts', logger, verifyToken, async(req, res) => {
            console.log('ticktok token', req.cookies);
            console.log('ticktok token2', req.query.email);
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