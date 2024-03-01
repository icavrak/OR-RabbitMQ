const amqp = require("amqplib");

// URI RabbitMQ poslužitelja
const uri = "amqp://localhost";

// ime reda poruka
const targetQueue = "even_odd";

// ime DLX burze
const DLExchangeName = "even_odd_dlx";

worker();

async function worker() {

    // stvori vezu prema RabbitMQ poslužitelju
    const connection = await amqp.connect(uri);

    // stvori kanal unutar veze prema poslužitelju
    const channel = await connection.createChannel();

    // podrazumijeva se postojanje netrajnog neimenovanog reda poruka
    const queue = await channel.assertQueue("", { exclusive: true });

    // povezivanje ekskluzivnog reda poruka s DLX burzom
    //  (pretpostavlja se da burza već postoji)
    await channel.bindQueue(queue.queue, DLExchangeName, "");

    // prihvaćanje poruka pristiglih u red poruka
    channel.consume(queue.queue, async function (msg) {

        // obavijest od prispijeću poruke o poslu
        console.log(" [x] Prihvatio posao %s s DLX...", msg.content.toString());
    }, { noAck: true });
};
