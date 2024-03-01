const amqp = require("amqplib");
const { v4: uuidv4 } = require('uuid');

// URI RabbitMQ poslužitelja
const uri = "amqp://localhost";

// ime exchange-a
const rpcQueueName = "rpcQueue";

// sadržaj poruke
const msg = "Hello, World!";

// id poziva
const invocationID = uuidv4();


worker();

async function worker() {

    // stvori vezu prema RabbitMQ poslužitelju
    const connection = await amqp.connect(uri);

    // stvori kanal unutar veze prema poslužitelju
    const channel = await connection.createChannel();

    // stvori (ako već ne postoji) ne-trajni red poruka (parametar {durable: false})
    // u koji treba poslati pozivnu poruku RPC poziva
    await channel.assertQueue(rpcQueueName, { durable: false });

    // stvori anonimni ekskluzivni red poruka za prihvaćanje RPC odgovora
    const returnQueue = await channel.assertQueue("", { exclusive: true });

    // slanje RPC poruke u imenovani red poruka; šalje se izravno u red poruka,
    //  a ne korištenjem burze poruka (zna se kome je RPC poziv upućen!)
    // informacija o pozivatelju (red poruka za prihvaćanje odgovora) se postavlja u
    //  polje zaglavlja pozivne poruke "replyTo", a ID poziva u polje "correlationId"
    await channel.sendToQueue(rpcQueueName, Buffer.from(msg), { replyTo: returnQueue.queue, correlationId: invocationID });
    
    // prihvaćanje povratne poruke RPC poziva, primitak se ne potvrđuje RabbitMQ poslužitelju
    channel.consume(returnQueue.queue, async (msg) => {
        
        //ispis primljenog odgovora
        console.log("received reply (" + msg.properties.correlationId + "): " + msg.content.toString());

        //provjera da li su correlationId i invocationID identični (da li je to odgovor na naš poziv?)
        if (invocationID != msg.properties.correlationId)
            console.log("WARNING: correlationId mismatch!");
        else
            console.log("correlationId OK");
        //zatvaranje veze prema RabbitMQ poslužitelju, prestanak rada klijenta
        await connection.close();
    }, { noAck: true });
};
