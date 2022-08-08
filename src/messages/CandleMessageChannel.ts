import 'dotenv/config';
import { Channel, connect } from 'amqplib';
import * as http from 'http';
import { Server } from 'socket.io';
import CandleController from './../controllers/CandleController';
import { Candle } from 'src/models/Candle';

/* classe que abre conexao com a fila da mensageria para ver se tem algo novo,
consumir essas mensagens novas e salvar no banco e envia para o front caso queira */
export default class CandleMessageChannel {

  private channel: Channel;
  private candleCtrl: CandleController;
  private io: Server;

  constructor(server: http.Server) {
    this.candleCtrl = new CandleController();
    this.io = new Server(server, {
      cors: {
        origin: process.env.SOCKET_CLIENT_SERVER,
        methods: ["GET", "POST", "PUT", "DELETE"],
      }
    });
    this.io.on('connection', () => console.log('Web Socket connection created!'));
  }

  private async createMessageChannel() {
    try {
      const connection = await connect(process.env.AMQP_SERVER);
      this.channel = await connection.createChannel();
      this.channel.assertQueue(process.env.QUEUE_NAME);
    } catch (error) {
      console.log('Connection to RabbitMQ failed!');
      console.log(error);
    }
  }

  /* Consumir as nova mensagens que chegam na fila. IMPORTANTE: só passo chamar essa função 
  depois de criar o canal de mensagens caso contrário ele vai dar erro */
  async consumeMessages() {

    await this.createMessageChannel();

    if (this.channel) {
      this.channel.consume(process.env.QUEUE_NAME, async (msg) => {
        // a mensagem chega formatada stringFy e preciso dar o parse
        const candleObj = JSON.parse(msg.content.toString());
        console.log('======== Message received! ============');
        console.log(candleObj);

        // preciso setar que eu já recebi (conhecimento) a mensagem para ele tirar da fila
        this.channel.ack(msg);

        // agora eu converto em candle para salvar no banco
        const candle: Candle = candleObj;
        await this.candleCtrl.save(candle);
        console.log('======== Candle saved in database =============');

        //agora eu uso o socket para avisar o front caso queira
        this.io.emit(process.env.SOCKET_EVENT_NAME, candleObj);
        console.log('============== New candle emited by web socket =======');
      });
      console.log('==== Candle consumer started!!! ============');
    }
  }
}