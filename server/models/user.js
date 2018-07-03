// server/models.user.js
const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    email: {
        type: String, 
        required: true,
        minlength: 1,
        trim: true,
        unique: true, 
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email'
        }
    },
    password: {
        type: String,
        require: true,
        minlength: 6
    },
    tokens: [{
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }]
});

UserSchema.methods.toJSON = function() {
    const user = this;
    const userObject = user.toObject();

    return _.pick(userObject, ['email', '_id']);
}

UserSchema.methods.generateAuthToken = function() {
    const user = this;
    const access = 'auth';
    const token = jwt.sign({_id: user._id.toHexString(), access}, process.env.JWT_SECRET).toString();

    user.tokens = user.tokens.concat([{access, token}]);

    return user.save().then(() => {
        return token;

    });
}

UserSchema.methods.removeToken = function(token){
    const user = this;

    return user.update({
        $pull: {
            tokens: {
                token: token
            }
        }
    });
}

UserSchema.statics.findByToken = function(token) {
    const User = this; //odwołanie do modelu
    let decoded;

    try{
        decoded = jwt.verify(token, process.env.JWT_SECRET);

    } catch (err) {
        return Promise.reject();
    }

    return User.findOne({
        '_id': decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    });
}

UserSchema.statics.findByCredentials = function(email, password){
    const User = this; //odwołanie do modelu

    // najpierw musimy wyszukać użytkownika o zadanym email
    return User.findOne({email}).then(user => {
        if(!user){
            return Promise.reject();
        }

        return new Promise((resolve, reject) => {
            //use bcrypt.compare password and user.password
            //jeśli się zgadzają (response jest true) wywołujemy resolve(user)
            //jeśli się nie zgadzają wywołujemy reject
            bcrypt.compare(password, user.password, (err, res) => {
                if(res){
                    resolve(user);
                } else {
                    reject();
                }
            });
        });
    })
}



UserSchema.pre('save', function(next){
    const user = this;

    if(user.isModified('password')){
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            });
        })
    } else {
        next();
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = {User};