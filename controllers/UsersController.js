const sha1 = require('sha1');
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class UsersController {
  static postNew(req, res) {
    const { email } = req.body;
    const { password } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    dbClient.users
      .findOne({ email })
      .then((user) => {
        if (user) {
          res.status(400).json({ error: 'Already exist' });
        }
      });

    dbClient.users
      .insertOne({
        email,
        password: sha1(password),
      })
      .then((result) => {
        res.status(201).json({ id: result.insertedId, email });
      });
  }

  static getMe(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;

    // get user id by token from redis
    redisClient.get(key).then((userId) => {
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // get user by id from mongodb
      dbClient.users.findOne({ _id: ObjectId(userId) })
        .then((user) => {
          res.json({ id: user._id, email: user.email });
        })
        .catch((err) => console.log(err.message));
    });
  }
}

module.exports = UsersController;
