# Files Manager
This project is a summary of the back-end trimester of **ALX Software Engineering Program** powered by **Holberton School** covering topics such as authentication, NodeJS, MongoDB, Redis, pagination, and background processing.

## Table of Contents
- [Learning Objectives](#learning-objectives)
- [Features](#features)
- [Key Technologies](#key-technologies)
- [Endpoints](#endpoints)
- [Installation](#installation)
- [Usage](#usage)
- [Testing](#testing)
- [License](#license)
- [Authors](#authors)

## Learning Objectives
- how to create an API with Express
- how to authenticate a user
- how to store data in MongoDB
- how to store temporary data in Redis
- how to setup and use a background worker
- and more...


## Features
The objective is to build a simple platform to upload and view files:

- User authentication via a token
- List all files
- Upload a new file
- Change permission of a file
- View a file
- Generate thumbnails for images

## Key Technologies
- **JavaScript ES6**: The programming language used.
- **Node.js**: As the runtime environment to execute JavaScript on the server side.
- **Express.js**: A web application framework for Node.js, used to build the API.
- **MongoDB**: As the primary database to store user and file data.
- **Redis**: Used for caching and session management.
- **JWT (JSON Web Tokens)**: For user authentication.
- **Pagination**: To handle large amounts of data efficiently.
- **Background Processing**: To handle tasks like generating thumbnails for images in the background.
- **Kue**: A priority job queue backed by Redis, used for job scheduling.

## Endpoints

| Endpoint                | Description                           |
|-------------------------|---------------------------------------|
| `GET /status`           | Get the status of the server           |
| `GET /stats`            | Get statistics about the server        |
| `POST /users`           | Create a new user                      |
| `GET /connect`          | Connect to the server                  |
| `GET /disconnect`       | Disconnect from the server             |
| `GET /users/me`         | Get information about the current user |
| `POST /files`           | Upload a file                          |
| `GET /files/:id`        | Get a specific file by ID              |
| `GET /files`            | Get files with pagination              |
| `PUT /files/:id/publish`   | Publish a file                        |
| `PUT /files/:id/unpublish` | Unpublish a file                      |
| `GET /files/:id/data`      | Get data of a specific file           |
----------------------------------------------------------------------


## Installation
```bash
$ git clone
$ cd files_manager
$ npm install
$ npm run start-server
Server running on port 5000
...
```

## Usage
Create a user:
```bash
$ curl 0.0.0.0:5000/users -XPOST -H "Content-Type: application/json" -d '{ "email": "bob@dylan.com", "password": "toto1234!" }' ; echo ""

{"id":"5f1e7d35c7ba06511e683b21","email":"bob@dylan.com"}
```

Authenticate user:
```bash
$ curl 0.0.0.0:5000/connect -H "Authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=" ; echo ""

{"token":"031bffac-3edc-4e51-aaae-1c121317da8a"}

$ curl 0.0.0.0:5000/users/me -H "X-Token: 031bffac-3edc-4e51-aaae-1c121317da8a" ; echo ""

{"id":"5f1e7cda04a394508232559d","email":"bob@dylan.com"}
```

Create file:
```bash
$ curl -XPOST 0.0.0.0:5000/files -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" -H "Content-Type: application/json" -d '{ "name": "myText.txt", "type": "file", "data": "SGVsbG8gV2Vic3RhY2shCg==" }' ; echo ""

{"id":"5f1e879ec7ba06511e683b22","userId":"5f1e7cda04a394508232559d","name":"myText.txt","type":"file","isPublic":false,"parentId":0}

$ ls /tmp/files_manager/
2a1f4fc3-687b-491a-a3d2-5808a02942c9

$ cat /tmp/files_manager/2a1f4fc3-687b-491a-a3d2-5808a02942c9
Hello Webstack!
```

Get files:
```bash
$ curl -XGET 0.0.0.0:5000/files -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""

[{"id":"5f1e879ec7ba06511e683b22","userId":"5f1e7cda04a394508232559d","name":"myText.txt","type":"file","isPublic":false,"parentId":0},{"id":"5f1e881cc7ba06511e683b23","userId":"5f1e7cda04a394508232559d","name":"images","type":"folder","isPublic":false,"parentId":0},{"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":true,"parentId":"5f1e881cc7ba06511e683b23"}]

$ curl -XGET 0.0.0.0:5000/files?parentId=5f1e881cc7ba06511e683b23 -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""

[{"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":true,"parentId":"5f1e881cc7ba06511e683b23"}]

$ curl -XGET 0.0.0.0:5000/files/5f1e8896c7ba06511e683b25 -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""

{"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":true,"parentId":"5f1e881cc7ba06511e683b23"}
$
```

Publish a file:
```bash
$ curl -XGET 0.0.0.0:5000/files/5f1e8896c7ba06511e683b25 -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""

{"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":false,"parentId":"5f1e881cc7ba06511e683b23"}

$ curl -XPUT 0.0.0.0:5000/files/5f1e8896c7ba06511e683b25/publish -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""

{"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":true,"parentId":"5f1e881cc7ba06511e683b23"}
```

Get a file's data:
```bash
curl -XGET 0.0.0.0:5000/files/5f1e879ec7ba06511e683b22/data -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
Hello Webstack!
```

## Testing
```bash
$ npm run test
```

## License
This project is released under the MIT License.

# Authors
Ammar Noor [GitHub](https://github.com/Ammar-Khaled) - [Linkedin](https://www.linkedin.com/in/ammar-noor)
