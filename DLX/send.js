const amqp = require("amqplib");

// URI RabbitMQ poslužitelja
const uri = "amqp://localhost";

// ime reda poruka
const targetQueue = "even_odd";

// ime DLX burze
const DLExchangeName = "even_odd_dlx";

// sadržaj poruke (argument naredbenog retka: node send.js "poruka") ili podrazumijevani sadržaj
// broj točaka na kraju teksta poruke reprezentira trajanje obrade poruke u sekundama, npr.
// obrada poruke "looooong......" će trajati 6s, a "short." samo jednu sekundu
const msg = process.argv.slice(2).join(" ") || "Hello World!";

worker();

async function worker() {

    // stvori vezu prema RabbitMQ poslužitelju
    const connection = await amqp.connect(uri);

    // stvori kanal unutar veze prema poslužitelju
    const channel = await connection.createChannel();

    // stvaranje DLX
    channel.assertExchange(DLExchangeName, "fanout", { durable: false });

    // stvori (ako već ne postoji) ne-trajni red poruka (parametar {durable: false})
    await channel.assertQueue(targetQueue, {
        durable: false,
        arguments: {
            'x-dead-letter-exchange': DLExchangeName,       // ime Dead Letter Exchange
            'x-message-ttl': 10000   // rok trajanja poruke u redu (u ms) (nakon isteka roka, poruka se briše ili ide u DLX)
        }
    });

    // slanje poruke u imenovani red poruka
    await channel.sendToQueue(targetQueue, Buffer.from(msg));
    console.log(`poruka poslana u red ${targetQueue} ...`);

    // čekanje na završetak slanja
    await sleep(500);

    //zatvaranje veze prema RabbitMQ poslužitelju, prestanak rada klijenta
    await connection.close();
};

// pomoćna funkcija za čekanje
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};
