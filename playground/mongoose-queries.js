const {ObjectID} = require('mongodb');

const {mongoose} = require('./../server/db/mongoose');
const {Todo} = require('./../server/models/todo');
const {User} = require('./../server/models/user');

// const id = "5a9fc8f5623e24fc24157bef11";

// if(!ObjectID.isValid(id)){
//     console.log('Id not valid');
// }

// Todo.find({
//     _id: id
// }).then(todos => {
//     console.log('Todos', todos);
// });


// Todo.findOne({
//     _id: id
// }).then(todo => {
//     console.log('Todo', todo);
// });

// Todo.findById(id).then(todo => {
//     if(!todo){
//         return console.log('Id not found');
//     }
//     console.log('Todo By ID', todo);
// }).catch(err => console.log(err));
const id = "5a9eccacd9bedd40435efdd3";

if(!ObjectID.isValid(id)){
    console.log('Id not valid');
}

User.findById(id).then(user => {
    if(!user){
        return console.log('User not found');
    }
    console.log('User by ID', user);
}).catch(err => console.log(err));
