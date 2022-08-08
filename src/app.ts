// a lib morgan ajuda a termos logs mais detalhados
import * as express from 'express';
import * as logger from 'morgan';
import * as cors from 'cors';
import { candleRouter } from './routes/candles';

const app = express();
app.use(cors());
app.use(express.json());
app.use(logger('dev'));

app.use('/candles' , candleRouter);

export default app;

