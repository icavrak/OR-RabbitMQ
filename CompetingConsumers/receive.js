const amqp = require("amqplib");

// URI RabbitMQ poslužitelja
const uri = "amqp://localhost";

// ime reda poruka
const targetQueue = "task_queue";

worker();

async function worker() {

    // stvori vezu prema RabbitMQ poslužitelju
    const connection = await amqp.connect(uri);

    // stvori kanal unutar veze prema pioslužitelju
    const channel = await connection.createChannel();

    // podrazumijeva se postojanje trajnog imenovanog reda poruka
    // ili će isti biti stvoren
    await channel.assertQueue(targetQueue, { durable: true });

    // prosljeđivanje dolaznih poruka u red jedna-po-jedna (čeka se da neki radnik
    // završi obradu prethodne poruke prije no što mu se proslijedi sljedeća)
    // za vidljivost natjecanja za poslove u redu, istovremeno pokrenuti dva ili više klijenata!!!
    await channel.prefetch(1);

    // prihvaćanje poruka pristiglih u red poruka, primitak poruke mora se
    // eksplicitno potvrditi RabbitMQ poslužitelju (poruka ostaje u redu poruka
    // sve dok njen primitak nije potvrđen od strane klijenta)
    channel.consume(targetQueue, function (msg) {
        
        // iz sadržaja poruke uzmi simulirano vrijeme trajanja obrade poruke
        const secs = msg.content.toString().split('.').length - 1;

        // obavijest od prispijeću poruke o poslu
        console.log(" [x] Primio %s", msg.content.toString());

        // simulacija trajanja obrade čekanjem određeni vremenski period
        setTimeout(function () {

            // obavijest o kraju obrade poruke
            console.log(" [x] Završio s obradom " + msg.content.toString());

            // potvrda primitka poruke prema RabbitMQ poslužitelju
            // (poslužitelj tek po primitku ack briše poruku iz reda poruka)
            channel.ack(msg);
        }, secs * 1000);
    }, { noAck: false });
};
