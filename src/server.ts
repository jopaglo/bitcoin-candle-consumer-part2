import 'dotenv/config';
import app from './app';
import { connectToMongoDb } from './config/db';
import { connection } from 'mongoose';
import CandleMessageChannel from './messages/CandleMessageChannel';

// criar o servidor depois de se conectar com o mongoDB
// caso o servidor pare, eu também encerro o mongo pra nao deixar aberto

const createServer = async () => {
  await connectToMongoDb();
  const port = process.env.PORT;
  const server = app.listen(port , () => console.log(`=========== Server running on port ${port} ===========`));

  //startar o canal de mensagens para ficar consumindo
  const candleMsgChannel = new CandleMessageChannel(server);
  candleMsgChannel.consumeMessages();
  
  /* o SIGNIT é um sinal de interrupção que indica que a aplicação foi finalizada */
  process.on('SIGINT' , async () => {
    await connection.close();
    console.log('======= Server and MongoDB was closed ===============');
  });
}

createServer();


