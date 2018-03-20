// server/tests/server.test.js
const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');

const todos = [
    {_id: new ObjectID(), text: 'First test to do'},
    {_id: new ObjectID(), text: 'Second test to do', completed: true, completedAt: 123},
]

beforeEach(done => {
    Todo.remove({}).then(() => {
        return Todo.insertMany(todos);
    }).then(() => done());
});

describe('POST /todos',  () => {
    it('should create a new todo', done => {
        const text = 'Test todo text';

        request(app)
            .post('/todos')
            .send({text})
            .expect(200)
            .expect(res => {
                expect(res.body.text).toBe(text)
            })
            .end((err, res) => {
                if(err){
                   return done(err);
                }

                Todo.find({text}).then(todos => {
                    expect(todos.length).toBe(1);
                    expect(todos[0].text).toBe(text);
                    done();
                }).catch(err => done(err));
            });
    });

    it('should not create todo with invalid body data', done => {
        request(app)
            .post('/todos')
            .send({})
            .expect(400)
            .end((err, res) => {
                if(err){
                    return done(err);
                }
                 
                Todo.find().then(todos => {
                    expect(todos.length).toBe(2);
                    done();
                }).catch(err => done(err));
            });
    });
});

describe('GET /todos', () => {
    it('should get all todos', done => {
        request(app)
            .get('/todos')
            .expect(200)
            .expect(res => {
                expect(res.body.todos.length).toBe(2);
            })
            .end(done);
    });
});

// 1. jeśli podamy niewłaściwe id - otrzymamy 404
// 2. jeśli podamy właściwe id ale nie ma takiego elementu - otrzymamy 404
// 3. jeśli podamy id dla którego można znaleźć element - zostanie on zwrócony

describe('GET /todos/:id', () => {
    it('should get todo doc with matching id', done => {
        request(app)
            .get(`/todos/${todos[0]._id.toHexString()}`)
            .expect(200)
            .expect(res => {
                expect(res.body.todo.text).toBe(todos[0].text);
            })
            .end(done);
    });

    it('should return 404 if todo not found', done => {
        request(app)
            .get(`/todos/${new ObjectID().toHexString()}`)
            .expect(404)
            .end(done);
    });

    it('should return 404 for invalid id', done => {
        request(app)
            .get(`/todos/123`)
            .expect(404)
            .end(done);
    });
});

describe('DELETE /todos/:id', () => {
    it('should remove a todo', done => {

        request(app)
            .delete(`/todos/${todos[0]._id.toHexString()}`)
            .expect(200)
            .expect(res => {
                expect(res.body.todo._id).toBe(todos[0]._id.toHexString());
            })
            .end((err, res) => {
                if(err){
                    return done(err);
                }

                Todo.findById(todos[0]._id.toHexString()).then(todo => {
                    expect(todo).toNotExist();
                    done();
                }).catch(err => done(err));
            });
    });

    it('should return 404 if todo not found', done => {
        request(app)
            .delete(`/todos/${new ObjectID().toHexString()}`)
            .expect(404)
            .end(done);
    });

    it('should return 404 for invalid id', done => {
        request(app)
            .delete(`/todos/123`)
            .expect(404)
            .end(done);
    });
});

describe('PATCH /todos/:id', () => {
    it('should update the todo', done => {
        // grab id of first item
        const firstItemId = todos[0]._id.toHexString();
        const textAfterUptade = 'Updated text';

        request(app)
            .patch(`/todos/${firstItemId}`)
            // update text, set completed to true
            .send({text: textAfterUptade, completed: true})
            // 200
            .expect(200)
            .expect(res => {
                // text is changed, completed is true, completedAt is a number (.toBeA)
                expect(res.body.todo.text).toBe(textAfterUptade);
                expect(res.body.todo.completed).toBe(true);
                expect(res.body.todo.completedAt).toBeA('number');
            })
            .end(done);
    });

    it('should clear completedAt when todo is not completed', done => {
        // grab id of second item
        const secondItemId = todos[1]._id.toHexString();
        const textAfterUptade = 'Newly Updated text';

        request(app)
        .patch(`/todos/${secondItemId}`)
        // update test, set completed to false
        .send({text: textAfterUptade, completed: false})
        // 200
        .expect(200)
        .expect(res => {
            // text is changed, completed is false, completedAt is null (.toNotExist)
            expect(res.body.todo.text).toBe(textAfterUptade);
            expect(res.body.todo.completed).toBe(false);
            expect(res.body.todo.completedAt).toNotExist();
        })
        .end(done);
    });
});