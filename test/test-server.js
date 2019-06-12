'use strict'

const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');

const { app, runServer, closeServer } = require('../server');
const { JWT_SECRET, TEST_DATABASE_URL } = require('../config')
const { User } = require('../users')

const expect = chai.expect;
chai.use(chaiHttp);

describe('Protect levels endpoint', function() {
    const username = 'testName';
    const password = 'testPassword';
    const firstName = 'testFirst';
    const lastName = 'testLast';
    const description = '';
    const image = '';

    before(function() {
        return runServer(TEST_DATABASE_URL);
    });

    beforeEach(function() {
        return User.hashPassword(password)
            .then(password => 
                User.create({
                    username,
                    password,
                    firstName,
                    lastName,
                    description,
                    image
                })
        );
    });

    afterEach(function() {
        return User.deleteOne({});
    });

    after(function() {
        return closeServer();
    });

    describe('Get API', function() {
        it('should 200 on GET', function() {
            return chai
                .request(app)
                .get('/api')
                .then(function(res) {
                    expect(res).to.have.status(200);
                });
        });
    });

    describe('/api/users/folks/*', function() {

        const authToken = jwt.sign(
            {
                user: {
                    username,
                    firstName,
                    lastName
                }
            },
            JWT_SECRET,
            {
                algorithm: 'HS256',
                subject: username,
                expiresIn: '7d'
            }
        );

        it(`should GET all folks`, function() {
            return chai
                .request(app)
                .get('/api/users/folks')
                .set('Authorization', `Bearer ${authToken}`)
                .then(function(res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('array');
                    res.body.forEach(function(user) {
                        expect(user).to.be.an('object');
                        expect(user).to.contain.keys(
                            'username',
                            'firstName',
                            'lastName',
                            'description',
                            'image'
                        );
                    });
                });
        });

        it(`should GET one user by ID`, function() {
            return User
                .findOne()
                .then(function(user) {
                    let id = user._id;

                    return chai 
                        .request(app)
                        .get(`/api/users/folks/${id}`)
                        .set('Authorization', `Bearer ${authToken}`)
                        .then(function(res) {
                            expect(res).to.have.status(200);
                            expect(res).to.be.json;
                            expect(res.body).to.be.an('object');
                            expect(res.body).to.contain.keys(
                                'username',
                                'firstName',
                                'lastName',
                                'description',
                                'image'
                            );
                        });
            });
            
        });

        it(`Should update user info with PUT by ID`, function() {
            const newInfo = {
                description: "Test description",
                image: "test.image"
            };

            return User
                .findOne()
                .then(function(user) {
                    newInfo.id = user._id;

                    return chai 
                        .request(app)
                        .put(`/api/users/folks/${user._id}`)
                        .send(newInfo)
                        .set('Authorization', `Bearer ${authToken}`);
                })
                .then(function(res) {
                    expect(res).to.have.status(204);
                    return User.findById(newInfo.id);
                })
                .then(function(updatedUser) {
                    expect(updatedUser.description).to.equal(newInfo.description);
                    expect(updatedUser.image).to.equal(newInfo.image);
                });
        });
    });
});