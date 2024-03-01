const amqp = require("amqplib");

// URI RabbitMQ poslužitelja
const uri = "amqp://localhost";

// ime exchange-a
const exchangeName = "logs";

// sadržaj poruke (argument naredbenog retka: node send.js "poruka") ili podrazumijevani sadržaj
// broj točaka na kraju teksta poruke reprezentira trajanje obrade poruke u sekundama, npr.
//  obrada poruke "looooong......" će trajati 6s, a "short." samo jednu sekundu
const msg = process.argv.slice(2).join(" ") || "Hello World!";

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

    // slanje poruke u imenovanu burzu poruka, bez ključa usmjeravanja (drugi parametar poziva je "")
    await channel.publish(exchangeName, "", Buffer.from(msg));

    // čekanje na završetak slanja
    await sleep(500);
    console.log("poruka poslana...");

    //zatvaranje veze prema RabbitMQ poslužitelju, prestanak rada klijenta
    await connection.close();

};

// pomoćna funkcija za čekanje
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};
