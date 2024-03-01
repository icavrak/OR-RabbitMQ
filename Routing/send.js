const amqp = require("amqplib");

// URI RabbitMQ poslužitelja
const uri = "amqp://localhost";

// ime exchange-a
const exchangeName = "direct_logs";

// sadržaj poruke je formata node send.js <tip poruke> <sadržaj poruke>, gdje tip poruke može
//  biti riječ info, warning ili error (čini ključ usmjeravanja poruke),
//  a sadržaj poruke se može sastojati od nijedne ili više riječi
const args = process.argv.slice(2);
const msg = args.slice(1).join(" ") || "Hello World!";
const routing_key = (args.length > 0) ? args[0] : 'info';

worker();

async function worker() {
    
    // stvori vezu prema RabbitMQ poslužitelju
    const connection = await amqp.connect(uri);

    // stvori kanal unutar veze prema poslužitelju
    const channel = await connection.createChannel();

    // stvori (ako već ne postoji) ne-trajnu burzu poruka (parametar {durable: false})
    // burza je tipa "direct" - poruka se prosljeđuje samo onim redovima spojenim na burzu,
    //  čiji se ključ vezivanja u potpunosti podudara s ključem usmjeravanja poruke
    await channel.assertExchange(exchangeName, "direct", { durable: false });

    // slanje poruke u imenovanu burzu poruka, s ključem usmjeravanja
    await channel.publish(exchangeName, routing_key, Buffer.from(msg));

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
