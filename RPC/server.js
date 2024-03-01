const amqp = require("amqplib");

// URI RabbitMQ poslužitelja
const uri = "amqp://localhost";

// ime reda poruka
const queueName = "rpcQueue";

worker();

async function worker() {

    // stvori vezu prema RabbitMQ poslužitelju
    const connection = await amqp.connect(uri);

    // stvori kanal unutar veze prema poslužitelju
    const channel = await connection.createChannel();

    // stvori (ako već ne postoji) ne-trajni red poruka (parametar {durable: false})
    // u koji treba poslati pozivnu poruku RPC poziva
    await channel.assertQueue(queueName, { durable: false });
  
    //pretplata na poruke u rpcQueue
    channel.consume(queueName, async (msg) => {
        
        console.log("Received: " + msg.content.toString());
        await sleep(1000);    
        
        const returnQueue = msg.properties.replyTo;
        console.log("RPC processing ended... replying to " + returnQueue);
        await channel.sendToQueue(msg.properties.replyTo, Buffer.from("RPC reply content"), {correlationId: msg.properties.correlationId});
    }, {noAck: true});
};

// pomoćna funkcija za čekanje
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};