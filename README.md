# backend_CRUD_app

Welcome to the Backend CRUD project!.

This project is a RESTful API with JWT authentifation that allows users to store, retrieve, update and delete key-value pairs in a MySQL database. 

The project is built using Node.js, Express.js, Prisma as ORM, and Docker.

## Framework and Dependencies

- Node.js
- Express.js
- JWT
- Prisma
- MySQL
- Docker

## Database Schema

The database schema consists of three main models: User, Data, and Profile.

### User
- id (Primary Key)
- username (Unique)
- email (Unique)
- password
- full_name
- age
- gender
- createdAt (Timestamp)
- updatedAt (Timestamp)

### Data
- id (Primary Key)
- key (Unique)
- value
- data This relationship links the `Data` model to the `User` model based on the `userid` field.
- userid (Foreign Key to User)

## Instructions to Run the Code
1.First clone this repo:

```
git clone https://github.com/habeeb-an/backend_CRUD_app.git
```

2. Navigate to the project directory:
   
```
cd backend_assignment
```

3. Install project dependencies:
   ```
   npm install
   ```
4. Set up environment variables:

Create a `.env` file in the project root directory and add the following:
```
DATABASE_URL="mysql://newuser:password@mysql:3306/backendtest"
JWT_SECRET_KEY="your-secret-key"
```

5. Build and run Docker containers:
```
docker-compose up --build
```
or (according to you system setup)
```
docker compose up --build
```
6. In order to setup locally
```
npx nodemon index.js
```
```
npx prisma migrate dev --name init
```
7. Access the API:

The API will be available at `http://localhost:3000/api`.

## API Endpoints

- POST `/api/data`: Store a key-value pair in the database.
- GET `/api/data/:key`: Retrieve the value associated with a given key.
- UPDATE `/api/data/:key` : Update value with a given key
- DELETE `/api/data/:key`: Delete a key-value pair from the database.

## Contributing

We welcome contributions from the community! If you'd like to contribute, please fork the repository, make your changes, and submit a pull request.




