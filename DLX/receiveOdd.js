const amqp = require("amqplib");

// URI RabbitMQ poslužitelja
const uri = "amqp://localhost";

// ime reda poruka
const targetQueue = "even_odd";

// ime DLX burze
const DLExchangeName = "even_odd_dlx";

worker();

async function worker() {

    // stvori vezu prema RabbitMQ poslužitelju
    const connection = await amqp.connect(uri);

    // stvori kanal unutar veze prema poslužitelju
    const channel = await connection.createChannel();

    // stvaranje DLX
    channel.assertExchange(DLExchangeName, "fanout", { durable: false });

    // podrazumijeva se postojanje netrajnog imenovanog reda poruka
    // ili će isti biti stvoren, posebni argumenti reda definiraju
    // povezani DLX i trajanje poruka u redu
    await channel.assertQueue(targetQueue, {
        durable: false,
        arguments: {
            'x-dead-letter-exchange': DLExchangeName,       // ime Dead Letter Exchange burze
            'x-message-ttl': 10000   // rok trajanja poruke u redu (u ms) (nakon isteka roka, poruka se briše ili ide u DLX)
        }
    });

    // prosljeđivanje dolaznih poruka u red jedna-po-jedna (čeka se da neki radnik
    // završi obradu prethodne poruke prije no što mu se proslijedi sljedeća)
    // za vidljivost natjecanja za poslove u redu, istovremeno pokrenuti dva ili više klijenata!!!
    await channel.prefetch(1);

    // prihvaćanje poruka pristiglih u red poruka, primitak poruke mora se
    // eksplicitno potvrditi RabbitMQ poslužitelju (poruka ostaje u redu poruka
    // sve dok njen primitak nije potvrđen od strane klijenta)
    channel.consume(targetQueue, async function (msg) {

        // iz sadržaja poruke uzmi simulirano vrijeme trajanja obrade poruke
        const secs = msg.content.toString().split('.').length - 1;

        // ako je trajanje posla nula, odbaci posao bez ponovnog stavljanja u red poruka
        if (secs == 0) {
            console.log(" [x] Trajanje posla %s je 0, odbacuje se", msg.content.toString());
            channel.reject(msg, false);
            return;
        }

        // ako je trajanje posla neparan broj, odbaci posao s ponovnim stavljanjem u red poruka
        if (secs % 2 == 0) {
            await sleep(1000);
            console.log(" [x] Trajanje posla %s je paran broj sekundi, vraća se u red", msg.content.toString());
            await channel.reject(msg, true);
            return;
        }

        // obavijest od prispijeću poruke o poslu
        console.log(" [x] Prihvatio posao %s", msg.content.toString());

        // simulacija trajanja obrade čekanjem određeni vremenski period
        setTimeout(async function () {

            // obavijest o kraju obrade poruke
            console.log(" [x] Završio s obradom " + msg.content.toString());

            // potvrda primitka poruke prema RabbitMQ poslužitelju
            // (poslužitelj tek po primitku ack briše poruku iz reda poruka)
            await channel.ack(msg);
            await sleep(1000);
        }, secs * 1000);
    }, { noAck: false });
};

// pomoćna funkcija za čekanje
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};