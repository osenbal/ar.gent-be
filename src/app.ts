import path from 'path';
import express from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import morgan from 'morgan';
import errorMiddleware from '@middlewares/error.middleware';
import corsOptions from '@config/cors.config';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { connect, ConnectOptions, set } from 'mongoose';
import { Routes } from '@interfaces/routes.interface';
import { dbConnection } from '@/databases';
import { LOG_FORMAT } from '@config/config';
import { stream, logger } from '@utils/logger';

class App {
  public app: express.Application;
  public env: string;
  public port: string | number;

  constructor(routes: Routes[]) {
    this.app = express();
    this.env = process.env.NODE_ENV || 'development';
    this.port = process.env.APP_PORT || 8760;

    this.connectToDatabase();
    this.initialViewEngginge();
    this.initialMiddlewares();
    this.initializeRoutes(routes);
    this.initializeSwagger();
    this.initializeNotFoundRouter();
    this.initializeErrorHandling();
  }

  public getServer() {
    return this.app;
  }

  private connectToDatabase() {
    if (this.env !== 'production') {
      set('debug', true);
    }

    connect(dbConnection.url, dbConnection.options as ConnectOptions);

    console.log('Connected to database');
  }

  /**
   * Initialize middlewares
   *
   **/
  private initialMiddlewares() {
    this.app.use(morgan(LOG_FORMAT, { stream }));
    this.app.use(cookieParser());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());
    // this.app.use(express.json());
    // this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cors(corsOptions));
    this.app.use(express.static(path.join(__dirname, 'public')));
    this.app.use('/public', express.static('public'));
  }

  private initialViewEngginge() {
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, 'views'));
  }

  /**
   * Initialize all routes
   *
   **/
  private initializeRoutes(routes: Routes[]) {
    routes.forEach((route) => {
      this.app.use('/', route.router);
    });
  }

  /**
   * Initialize swagger api documentation
   *
   **/
  private initializeSwagger() {
    const options = {
      swaggerDefinition: {
        info: {
          title: 'REST API',
          version: '1.0.0',
          description: 'Documentation for REST API',
        },
      },
      apis: ['swagger.yaml'],
    };

    const specs = swaggerJSDoc(options);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }

  private initializeNotFoundRouter() {
    // Handle 404
    this.app.all('*', (req, res) => {
      res.status(404);

      if (req.accepts('html')) {
        res.render('pages/404');
        return;
      } else if (req.accepts('json')) {
        res.json({ status: 404, error: 'Not found' });
        return;
      } else {
        res.type('txt').send('Not found');
        return;
      }
    });
  }

  /**
   * Method for listen app in server.ts
   *
   **/
  public listen() {
    this.app.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 App listening on the port ${this.port}`);
      logger.info(`=================================`);
    });
  }
}

export default App;
