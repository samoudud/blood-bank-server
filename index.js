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

        // Get login Api
        app.post('/login', async (req, res) => {
            console.log(req.body)
            const query = { email: req.body.email, password: req.body.password }
            const result = await donorsCollection.findOne(query);
            if (result) {
                const user = {
                    address: result.address,
                    age: result.age,
                    bloodGroup: result.bloodGroup,
                    email: result.email,
                    gander: result.gander,
                    lDonate: result.lDonate,
                    mobile: result.mobile,
                    name: result.name,
                    _id: result._id
                }
                res.json(user)
            }
            else {
                res.status(401).send({
                    message: 'Wrong email/password !'
                });
            }
        })

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
                console.log(result)
                res.json(result);
            }
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
})