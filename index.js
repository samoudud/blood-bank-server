const { MongoClient } = require('mongodb');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;
const express = require('express');
const app = express();
const cors = require('cors');

const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l4fja.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();
        const database = client.db('blood_bank');
        const donorsCollection = database.collection('donors')
        const requestCollection = database.collection('requests')



        // Post donor Api
        app.post('/donors', async (req, res) => {
            const donor = req.body;
            const query = { email: donor.email }
            const exist = await donorsCollection.findOne(query);

            if (exist?.email == query.email) {
                res.json({ message: 'User already exist' });
            }
            else {
                const result = await donorsCollection.insertOne(donor);
                res.json(result);
            }
        });

        // Get donors api
        app.get('/donors/:bloodGroup', async (req, res) => {
            const bloodGroup = req.params.bloodGroup;
            const query = { bloodGroup: bloodGroup }
            const result = await donorsCollection.find(query).toArray();

            if (result.length > 0) {
                const donors = result.filter(dt => {
                    let ageInMilliseconds = new Date() - new Date(dt.lDonate);
                    let age = Math.floor(ageInMilliseconds / 1000 / 60 / 60 / 24);
                    return age > 90
                })
                res.json(donors)

            }
            else {
                res.status(404).send({
                    message: 'Donor Not Found'
                });
            }
        });

        // get single blood group
        app.get('/donor/:email', async (req, res) => {
            const query = { email: req.params.email }
            const result = await donorsCollection.findOne(query);
            let isAdmin = false;
            if (result?.role === 'admin') {
                isAdmin = true;
            }
            if (result) {
                const user = {
                    bloodGroup: result.bloodGroup,
                    _id: result._id,
                    admin: isAdmin
                }
                res.json(user)
            }
            else {
                res.status(401).send({
                    message: 'user not found'
                });
            }
        })


        // get admin api
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await donorsCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });

        // post request api
        app.post('/request', async (req, res) => {
            const data = req.body
            const result = await requestCollection.insertOne(data);
            res.json(result);
        });


        // get blood request api
        app.get('/request/:q', async (req, res) => {
            const query = req.params.q;
            let result;
            if (query === 'all') {
                result = await requestCollection.find({}).toArray();
                res.json(result)
            }
            else {
                result = await requestCollection.find({ bloodGroup: query, status: 'pending' }).toArray()
                console.log(query, result)
                res.json(result)
            }
        });

        // put request api
        app.put('/request/:id', async (req, res) => {
            const id = req.params.id;
            const updatedReq = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: updatedReq.status,
                },
            };
            const result = await requestCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        // delete request api
        app.delete('/request/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await requestCollection.deleteOne(query);
            res.json(result);
        })


    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`app listening at http://localhost:${port}`)
});


// https://kcp-blood-bank-server.herokuapp.com/