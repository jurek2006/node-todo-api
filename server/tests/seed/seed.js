// server/tests/seed/seed.js
const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Todo} = require('./../../models/todo');
const {User} = require('./../../models/user');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();
const users = [{
    _id: userOneId,
    email: 'valid@node.pl',
    password: 'superPass',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id: userOneId.toHexString(), access: 'auth'}, 'secret123').toString()
    }]
}, 
{
    _id: userTwoId,
    email: 'notgood@node.pl',
    password: 'costam2',
}];

const todos = [
    {_id: new ObjectID(), text: 'First test to do'},
    {_id: new ObjectID(), text: 'Second test to do', completed: true, completedAt: 123},
];

const populateTodos = done => {
    Todo.remove({}).then(() => {
        return Todo.insertMany(todos);
    }).then(() => done());
}

const populateUsers = done => {
    User.remove({}).then(() => {
        const userOne = new User(users[0]).save();
        const userTwo = new User(users[1]).save();

        return Promise.all([userOne, userTwo]);

    }).then(() => done());
}

module.exports = {todos, populateTodos, users, populateUsers};