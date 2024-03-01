const amqp = require("amqplib");

// URI RabbitMQ poslužitelja
const uri = "amqp://localhost";

// ime reda poruka
const targetQueue = "hello";

worker();

async function worker() {

    // stvori vezu prema RabbitMQ poslužitelju
    const connection = await amqp.connect(uri);

    // stvori kanal unutar veze prema pioslužitelju
    const channel = await connection.createChannel();
    
    // stvori (ako već ne postoji) netrajan red poruka
    // (bit će obrisan nakon prestanka rada RabbitMQ poslužitelja)
    await channel.assertQueue(targetQueue, { durable: false });
    
    // čekaj na poruke "gurane" od strane RabbitMQ poslužitelja 
    // iz reda poruka u naš klijent, nema slanja potvrde o primitku
    // poruke natrag prema poslužitelju
    channel.consume(targetQueue, (msg) => {
        console.log(`primio poruku:  ${msg.content.toString()}`);
    }, { noAck: true });
};


