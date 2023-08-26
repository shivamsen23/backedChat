// const mongoose = require('mongoose');
// require('dotenv').config();

// mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PW}@cluster0.s11qz.mongodb.net/chatAppMern?retryWrites=true&w=majority`, ()=> {
//   console.log('connected to mongodb')
// })
const mongoose = require('mongoose');
//const uri = process.env.ATLASURI;
//const uri = 'mongodb+srv://senshivam838:<rimpa>@cluster0.9xyl1cy.mongodb.net/mydatabase?retryWrites=true&w=majority';
const uri ='mongodb+srv://sen1:shubhi@cluster0.9xyl1cy.mongodb.net/SocketIO-Messages?retryWrites=true&w=majority';

//connect to MongoDB Atlas
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB', err));

