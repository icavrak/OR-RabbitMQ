const amqp = require("amqplib");

// URI RabbitMQ poslužitelja
const uri = "amqp://localhost";

// ime exchange-a
const exchangeName = "topic_logs";

worker();

async function worker() {

    // stvori vezu prema RabbitMQ poslužitelju
    const connection = await amqp.connect(uri);

    // stvori kanal unutar veze prema poslužitelju
    const channel = await connection.createChannel();

    // stvori (ako već ne postoji) ne-trajnu burzu poruka (parametar {durable: false})
    // burza je tipa "topic" - poruka se prosljeđuje samo onim redovima spojenim na burzu,
    //  čiji se ključ vezivanja podudara s ključem usmjeravanja poruke (uključujući
    //  specijalne znakove * i # u definiciji ključa vezivanja reda na burzu)
    await channel.assertExchange(exchangeName, "topic", { durable: false });

    // stvori ekskluzivan i anoniman (RabbitMQ određuje ime) red poruka za ovog klijenta 
    // red poruka će biti obrisan nakon odspajanja klijenta od RabbitMQ poslužitelja
    // samo klijent koji je stvorio ekskluzivan red poruka može taj red poruka i koristiti
    const queue = await channel.assertQueue("", { exclusive: true });

    // za svaki argument naveden kod pokretanja programa (imena topica - info, warning, error)
    //  posebna registracija reda poruka na burzu poruka s tako imenovanim (info, warning, error)
    //  ključem vezivanja (red poruka može biti višestruko vezan na burzu poruka!)
    process.argv.splice(0, 2);
    process.argv.forEach( async (topic_pattern) => {
        await channel.bindQueue(queue.queue, exchangeName, topic_pattern);
    });
       
    // prihvaćanje poruka pristiglih u red poruka, primitak poruke se
    // ne potvrđuje RabbitMQ poslužitelju
    channel.consume(queue.queue, (msg) => {
        console.log(" [x] %s", msg.content.toString());
    }, { noAck: true });
};
