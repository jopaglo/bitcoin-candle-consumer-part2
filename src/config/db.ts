import 'dotenv/config';
import { connect } from 'mongoose';

export const connectToMongoDb = async () => {
  await connect(`${process.env.MONGODB_CONNECTION_URL}`);
  console.log('Connected in MongoDB');
}