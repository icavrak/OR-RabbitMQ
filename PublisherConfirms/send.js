const amqp = require("amqplib");

// URI RabbitMQ poslužitelja
const uri = "amqp://localhost";

// ime exchange-a
const exchangeName = "confirmed";

//ime alternativne burze
const alternateExchangeName = "alternateX";

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

    // stvori kanal unutar veze prema poslužitelju - kanal koristi Publisher Confirms mehanizam -
    //  pošiljatelj može čekati na eksplicitnu potvrdu od strane RabbitMQ da je poruka zaprimljena
    const channel = await connection.createConfirmChannel();

    // stvori (ako već ne postoji) ne-trajnu burzu poruka (parametar {durable: false})
    // burza je tipa "fanout" - poruka se prosljeđuje svim povezanim redovima poruka
    // ova burza služi kao "alternate exchange" burzi "confirmed"
    await channel.assertExchange(alternateExchangeName, "fanout", { durable: false});

    // stvori (ako već ne postoji) ne-trajnu burzu poruka (parametar {durable: false})
    // burza je tipa "direct" - poruka se prosljeđuje samo onim redovima spojenim na burzu,
    //  čiji se ključ vezivanja u potpunosti podudara s ključem usmjeravanja poruke
    await channel.assertExchange(exchangeName, "direct", { durable: false, alternateExchange: alternateExchangeName });

    // slanje poruke u imenovanu burzu poruka, s ključem usmjeravanja
    await channel.publish(exchangeName, routing_key, Buffer.from(msg));
    console.log("poruka poslana...");

    // čekanje na potvrdu da je poruka zaprimljena u RabbitMQ (prosljeđena u neki od redova poruka)
    // ovaj mehanizam ne označava da je poruka prosljeđena potrošaču, samo da je zaprimljena interno u RabbitMQ!
    await channel.waitForConfirms();
    console.log("potvrda pristigla...");

    // čekanje na završetak slanja
    //await sleep(500);
    
    //zatvaranje veze prema RabbitMQ poslužitelju, prestanak rada klijenta
    await connection.close();
};

// pomoćna funkcija za čekanje
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};
