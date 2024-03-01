const amqp = require("amqplib");

// URI RabbitMQ poslužitelja
const uri = "amqp://localhost";

// ime exchange-a
const exchangeName = "logs";

worker();

async function worker() {

    // stvori vezu prema RabbitMQ poslužitelju
    const connection = await amqp.connect(uri);

    // stvori kanal unutar veze prema poslužitelju
    const channel = await connection.createChannel();

    // stvori (ako već ne postoji) ne-trajnu burzu poruka (parametar {durable: false})
    // burza je tipa "fanout" - poruka se prosljeđuje svim redovima spojenim na burzu,
    //  bez obzira na podudaranje ključa vezivanja reda poruka i ključa usmjeravanja pojedine poruke
    // burza će biti će obrisana nakon prestanka rada RabbitMQ poslužitelja
    await channel.assertExchange(exchangeName, "fanout", { durable: false });


    // stvori ekskluzivan i anoniman (RabbitMQ određuje ime) red poruka za ovog klijenta 
    // red poruka će biti obrisan nakon odspajanja klijenta od RabbitMQ poslužitelja
    // samo klijent koji je stvorio ekskluzivan red poruka može taj red poruka i koristiti
    const queue = await channel.assertQueue("", { exclusive: true });

    // povezivanje novostvorenog reda poruka s burzom poruka
    await channel.bindQueue(queue.queue, exchangeName, "");

    // prihvaćanje poruka pristiglih u red poruka, primitak poruke se
    // ne potvrđuje RabbitMQ poslužitelju
    channel.consume(queue.queue, function (msg) {

        // iz sadržaja poruke uzmi simulirano vrijeme trajanja obrade poruke
        const secs = msg.content.toString().split('.').length - 1;

        // obavijest od prispijeću poruke o poslu
        console.log(" [x] Primio %s", msg.content.toString());

        // simulacija trajanja obrade čekanjem određeni vremenski period
        setTimeout(function () {

            // obavijest o kraju obrade poruke
            console.log(" [x] Završio s obradom " + msg.content.toString());
        }, secs * 1000);
    }, { noAck: false });
};
