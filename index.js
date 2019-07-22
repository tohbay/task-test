import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import passport from 'passport';

import Routes from './routes/v1';
import './helpers/passport/google';
import './helpers/passport/github';

dotenv.config();

const app = express();

app.use(passport.initialize());

const swaggerdoc = yaml.load('./swagger.yaml');

app.use(cors());

app.use(require('morgan')('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerdoc));

Routes(app);

app.use('/welcome', (req, res) => {
  res.status(200).json({
    message: `Welcome to the ErrorSwag backend page`
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    message: `Page Not Found on ErrorSwag`
  });
});

// finally, let's start our server...
const server = app.listen(process.env.PORT || 3000, () => {
  process.stdout.write(`Listening on port ${server.address().port}`);
});

export default app;
