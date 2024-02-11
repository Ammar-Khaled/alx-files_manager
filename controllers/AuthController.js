import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';

const sha1 = require('sha1');
const dbClient = require('../utils/db');

class AuthController {
  static getConnect(req, res) {
    const b64Auth = req.headers.authorization.split(' ')[1];
    const decodedAuth = Buffer.from(b64Auth, 'base64').toString('utf-8');
    const email = decodedAuth.split(':')[0];
    const password = decodedAuth.split(':')[1];

    dbClient.users
      .findOne({
        email,
        password: sha1(password),
      })
      .then((result) => {
        if (!result) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }

        const token = uuidv4();
        const key = `auth_${token}`;
        redisClient.set(key, result._id.toString(), 24 * 60 * 60);
        res.status(200).json({ token });
      });
  }

  static getDisconnect(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    redisClient.get(key).then((userId) => {
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      redisClient.del(key);
      res.status(204).json();
    });
  }
}

module.exports = AuthController;
