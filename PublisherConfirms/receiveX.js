const amqp = require("amqplib");

// URI RabbitMQ poslužitelja
const uri = "amqp://localhost";

// ime exchange-a
const exchangeName = "confirmed";

//ime alternativne burze
const alternateExchangeName = "alternateX";

worker();

async function worker() {

    // stvori vezu prema RabbitMQ poslužitelju
    const connection = await amqp.connect(uri);

    // stvori kanal unutar veze prema poslužitelju
    const channel = await connection.createChannel();

    // NE POZIVAMO channel.assertExchange - burza mora biti stvorena od strane programskog koda u klijentu
    //  i već postojati prije no što bude korištena od strane primatelja !!!
    //await channel.assertExchange(exchangeName, "direct", { durable: false });

    // stvori ekskluzivan i anoniman (RabbitMQ određuje ime) red poruka za ovog klijenta 
    // red poruka će biti obrisan nakon odspajanja klijenta od RabbitMQ poslužitelja
    // samo klijent koji je stvorio ekskluzivan red poruka može taj red poruka i koristiti
    const queue = await channel.assertQueue("", { exclusive: true });

    // red poruka vežemo na alternativnu burzu tipa "fanout" - primamo sve poruke koje
    //  nisu mogle biti isporučene od strane originalne burze "confirmed"
    await channel.bindQueue(queue.queue, alternateExchangeName);

    // prihvaćanje poruka pristiglih u red poruka, primitak poruke se
    // ne potvrđuje RabbitMQ poslužitelju
    channel.consume(queue.queue, (msg) => {
        console.log(" [x] %s", msg.content.toString());
    }, { noAck: true });
};
