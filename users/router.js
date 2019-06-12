'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const { User } = require('./models');
const router = express.Router();

const jsonParser = bodyParser.json();
const passport = require('passport');

//Create new user with POST
router.post('/', jsonParser, (req, res) => {
    const requiredFields = ['username', 'password'];
    const missingField = requiredFields.find(field => !(field in req.body));

    if(missingField) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: 'Missing field',
            location: missingField
        });
    }

    //Make sure all fields are strings
    const stringFields = ['username', 'password', 'firstName', 'lastName'];
    const nonStringField = stringFields.find(
        field => field in req.body && typeof req.body[field] !== 'string'
    );

    if(nonStringField) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: 'Incorrect field type: expected string',
            location: nonStringField
        });
    }

    //Fields that must be trimmed of white space by user
    const trimmedFields = ['username', 'password'];
    const nonTrimmedField = trimmedFields.find(
        field => req.body[field].trim() !== req.body[field]
    );

    if(nonTrimmedField) {
        return releaseEvents.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: 'Cannot start or end with whitespace',
            location: nonTrimmedField
        });
    }

    //Set Min and Max on username and password
    const sizedFields = {
        username: {
            min: 1
        },
        password: {
            min: 10,
            max: 72
        }
    };

    const underMinField = Object.keys(sizedFields).find(
        field => 
            'min' in sizedFields[field] &&
                req.body[field].trim().length < sizedFields[field].min
    );
    const overMaxField = Object.keys(sizedFields).find(
        field => 
            'max' in sizedFields[field] &&
                req.body[field].trim().length > sizedFields[field].max
    );

    if(underMinField || overMaxField) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: underMinField
                ? `Must be at lease ${sizedFields[underMinField].min} characters long`
                : `Must be at most ${sizedFields[overMaxField].max} characters long`,
            location: underMinField || overMaxField
        });
    }

    let { username, password, firstName = '', lastName = '' } = req.body;

    //Fields accepted by user in untrimmed form
    firstName = firstName.trim();
    lastName = lastName.trim();

    //Verify that username is unique
     return User.find({ username })
        .count()
        .then(count => {
            if (count > 0) {
                return Promise.reject({
                    code: 422,
                    reason: 'ValidationError',
                    message: 'Username already taken',
                    location: 'username'
                });
            }

            return User.hashPassword(password);
        })
        .then(hash => {
            return User.create({
                username,
                password: hash,
                firstName,
                lastName
            });
        })
        .then(user => {
            return res.status(201).json(user.serialize());
        })
        .catch(err => {
            if(err.reason === 'ValidationError') {
                return res.status(err.code).json(err);
            }
            res.status(500).json({
                code: 500,
                message: 'Internal server error'
            });
        });
});


//--------- Once logged in, GET "folks" & PUT current user's info -------

const jwtAuth = passport.authenticate('jwt', { session: false });

//get all folks
router.get('/folks', jwtAuth, (req, res) => {
    return User
        .find()
        .then(users => res.json(users.map(user => user.serialize())))
        .catch(err => {
            console.error(err)
            res.status(500).json({message: 'Oops! Something went wrong'})
        });
});

//get one user by id
router.get('/folks/:id', jwtAuth, (req, res) => {
    return User
        .findById(req.params.id)
        .then(user => res.json(user.serialize()))
        .catch(err => {
            console.error(err)
            res.status(500).json({message: 'Oops! Something went wrong'})
        });
});

//put new info
router.put('/folks/:id', jwtAuth, (req, res) => {
    const updated = {};
    const updateableFields = ['firstName', 'lastName', 'description', 'image'];
    updateableFields.forEach(field => {
        if(field in req.body) {
            updated[field] = req.body[field];
        }
    });

    return User
        .findByIdAndUpdate(req.params.id, { $set: updated })
        .then(() => {
            res.status(204).end();
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Something went wrong' });
        });
});

module.exports = { router };

