//import dependencies
const express     = require('express');
const bodyParser  = require('body-parser'); //convert the body of incoming requests into JSON objects
const cors        = require('cors');
const helmet      = require('helmet'); // helps to secure Express apps with various HTTP headers
const morgan      = require('morgan'); // adds some logging capabilities to the Express app
const jwt         = require('express-jwt');
const jwksRsa     = require('jwks-rsa');

// define the Express app
const app = express();

// the database
const questions = [];

// enhance your app security with Helmet
app.use(helmet());

// use bodyParser to parse application/json content-type
app.use(bodyParser.json());

// enable all CORS requests
app.use(cors());

// log HTTP requests
app.use(morgan('combined'));

// retrieve all questions
app.get('/', (request, response) => {
  const qs = questions.map(q => ({
    id: q.id,
    title: q.title,
    description: q.description,
    answers: q.answers.length,
  }));
  response.send(qs);
});

// get a specific question
app.get('/:id', (request, response) => {
  const question = questions.filter(q => (q.id === parseInt(request.params.id)));
  if (question.length > 1) return response.status(500).send();
  if (question.length === 0) return response.status(404).send();
  response.send(question[0]);
});

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://dev-1zdfefgw.auth0.com/.well-known/jwks.json`
  }),

  //Validate the audience and the issuer
  audience: 'I1gha7zmap4Wz45Amy3C4GMXbPc4q5x1',
  issuer: `https://dev-1zdfefgw.auth0.com/`,
  algorithms: ['RS256']
});

// insert a new question
app.post('/', checkJwt, (request, response) => {
  const {title, description} = request.body;
  const newQuestion = {
    id: questions.length + 1,
    title,
    description,
    answers: [],
    author: request.user.name,
  };
  questions.push(newQuestion);
  response.status(200).send();
});

// insert a new answer to a question
app.post('/answer/:id', checkJwt, (request, response) => {
  const {answer} = request.body;

  const question = questions.filter(q => (q.id === parseInt(request.params.id)));
  if (question.length > 1) return response.status(500).send();
  if (question.length === 0) return response.status(404).send();

  question[0].answers.push({
    answer,
    author: request.user.name,
  });

  response.status(200).send();
});

// start the server
app.listen(8081, () => console.log('listening on port 8081'));