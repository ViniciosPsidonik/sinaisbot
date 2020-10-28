require('dotenv').config();
const mongoose = require('mongoose')


const mongoURI = process.env.MONGO
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })

var schema = new mongoose.Schema({ userId: Number, lastAction: String, login: String, pass: String, amount: Number, stopWin: Number, stopLoss: Number, conta: String, gale: Boolean, galeFactor: Number, galeLevel: Number});
mongoose.set('useFindAndModify', false)

var Players = mongoose.model('Players', schema)

module.exports = Players