import { v4 as uuidv4 } from 'uuid';

const { ObjectId } = require('mongodb');
const fs = require('fs');
const mime = require('mime-types');
const dbClient = require('../utils/db');
const getUser = require('../utils/getUser');

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const user = await getUser(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name } = req.body;
    const { type } = req.body;
    let parentId = req.body.parentId || 0;
    const isPublic = req.body.isPublic || false;
    const { data } = req.body;

    // parentId can be integer 0 for root or a given string
    parentId = parentId === '0' ? 0 : parentId;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || ['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId !== 0) {
      const file = await dbClient.files.findOne({ _id: ObjectId(parentId) });
      if (!file) {
        return res.status(400).json({ error: 'Parent not found' });
      }

      if (file.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const newFile = {
      userId: user._id,
      name,
      type,
      isPublic,
      parentId,
    };

    if (type === 'folder') {
      await dbClient.files.insertOne(newFile);
      const id = newFile._id;
      delete newFile._id;
      return res.status(201).json({
        id,
        ...newFile,
      });
    }

    // file or image
    const fileName = uuidv4();
    const localPath = `${FOLDER_PATH}/${fileName}`;

    fs.mkdir(FOLDER_PATH, { recursive: true }, (err) => {
      if (err) {
        return res.status(400).json({ error: err });
      }
    });

    fs.writeFile(localPath, Buffer.from(data, 'base64'), (err) => {
      if (err) {
        return res.status(400).json({ error: err });
      }
    });

    const insertionResult = await dbClient.files.insertOne({
      ...newFile,
      localPath,
    });
    return res.status(201).json({ id: insertionResult.insertedId, ...newFile });
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    const user = await getUser(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const file = await dbClient.files.findOne({
      _id: ObjectId(fileId),
      userId: user._id,
    });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    delete file._id;
    delete file.localPath;
    return res.json({ id: fileId, ...file });
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const user = await getUser(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parentId = req.query.parentId || 0;
    const page = req.query.page || 0;

    const files = await dbClient.files
      .aggregate([
        { $match: { parentId } },
        { $skip: page * 20 },
        { $limit: 20 },
      ])
      .toArray();

    const response = [];
    files.forEach((file) => {
      const id = file._id;
      delete file.localPath;
      delete file._id;
      response.push({ id, ...file });
    });

    return res.json(response);
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    const user = await getUser(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const file = await dbClient.files.findOne({
      _id: ObjectId(id),
      userId: user._id,
    });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    await dbClient.files.updateOne(file, { $set: { isPublic: true } });
    delete file._id;
    delete file.localPath;
    file.isPublic = true;
    return res.json({ id, ...file });
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    const user = await getUser(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const file = await dbClient.files.findOne({
      _id: ObjectId(id),
      userId: user._id,
    });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    await dbClient.files.updateOne(file, { $set: { isPublic: false } });
    delete file._id;
    delete file.localPath;
    file.isPublic = false;
    return res.json({ id, ...file });
  }

  static async getFile(req, res) {
    const { id } = req.params;
    const file = await dbClient.files.findOne({ _id: ObjectId(id) });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (file.isPublic === false) {
      const token = req.headers['x-token'];
      if (!token) {
        return res.status(404).json({ error: 'Not found' });
      }

      const user = await getUser(token);
      if (!user._id.equals(file.userId)) {
        return res.status(404).json({ error: 'Not found' });
      }
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    try {
      const data = await fs.promises.readFile(file.localPath);
      return res.type(mime.lookup(file.name)).send(data);
    } catch (err) {
      return res.status(404).json({ error: 'Not found' });
    }
  }
}

module.exports = FilesController;
