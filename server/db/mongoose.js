// mongoose.js
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
let connectPath, options;
//Check if we are on Heroku
if(process.env.PORT){
 connectPath = "mongodb://todouser:Osiolek1925@ds115729.mlab.com:15729/node-todo";
 options= {
     auth: {
         user: 'todouser',
         password: 'Osiolek1925'
     }
 }
}else{
 connectPath = "mongodb://localhost:27017/TodoApp";
 options = {}
}
mongoose.connect(connectPath, options);


module.exports = { mongoose }