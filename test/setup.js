process.env.TZ = 'UCT';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRY = '3m';

require('dotenv').config();

process.env.TEST_DB_URL = process.env.TEST_DB_URL
<<<<<<< HEAD
  || 'postgresql://dunder-mifflin@localhost/spaced-repetition-test';
=======
  || "postgresql://dunder_mifflin@localhost/spaced-repetition-test"
>>>>>>> 9236892488380b599acfb6428037fd924341bc67

const { expect } = require('chai');
const supertest = require('supertest');

global.expect = expect;
global.supertest = supertest;
