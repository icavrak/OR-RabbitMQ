const amqp = require("amqplib");

// URI RabbitMQ poslužitelja
const uri = "amqp://localhost";

// ime reda poruka
const targetQueue = "hello";

// podrazumijevani sadržaj poruke (ako nije naveden kao
// dio naredbenog retka)
const msg = "Hello, World!";


worker();

async function worker() {

    // stvori vezu prema RabbitMQ poslužitelju
    const connection = await amqp.connect(uri);

    // stvori kanal unutar veze prema RabbitMQ poslužitelju
    const channel = await connection.createChannel();

    // stvori (ako već ne postoji) netrajan red poruka
    // (bit će obrisan nakon prestanka rada RabbitMQ poslužitelja)
    await channel.assertQueue(targetQueue, { durable: false });

    // slanje poruke izravno u red poruka
    await channel.sendToQueue(targetQueue, Buffer.from( process.argv[2] || msg));
    
    // čekanje na završetak slanja
    await sleep(500);
    console.log("message sent...");

    // zatvaranje veza prema RabbitMQ poslužitelju
    await connection.close();
};

// pomoćna funkcija za čekanje
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
