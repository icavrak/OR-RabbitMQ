const amqp = require("amqplib");

// URI RabbitMQ poslužitelja
const uri = "amqp://localhost";

// ime reda poruka
const targetQueue = "task_queue";

// sadržaj poruke (argument naredbenog retka: node send.js "poruka") ili podrazumijevani sadržaj
// broj točaka na kraju teksta poruke reprezentira trajanje obrade poruke u sekundama, npr.
// obrada poruke "looooong......" će trajati 6s, a "short." samo jednu sekundu
const msg = process.argv.slice(2).join(" ") || "Hello World!";

worker();

async function worker() {

    // stvori vezu prema RabbitMQ poslužitelju
    const connection = await amqp.connect(uri);

    // stvori kanal unutar veze prema pioslužitelju
    const channel = await connection.createChannel();

    // stvori (ako već ne postoji) trajan red poruka (parametar {durable: true});
    // red poruka neće biti će obrisan nakon prestanka rada poslužitelja
    //  (trajnost reda ne podrazumijeva i trajnost poruka u redu - potrebne su dodatne akcije!)
    await channel.assertQueue(targetQueue, { durable: true });

    // slanje poruke u imenovani red poruka, poslana poruka je perzistentna (bit će zapisana
    //  na disk i preživjet će restart RabbitMQ poslužitelja = persistency + durable queue)
    await channel.sendToQueue(targetQueue, Buffer.from(msg), {persistent: true});

    // čekanje na završetak slanja
    await sleep(500);
    console.log("poruka poslana...");

    // zatvaranje veza prema RabbitMQ poslužitelju
    await connection.close();
};

// pomoćna funkcija za čekanje
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

