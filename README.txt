pokretanje i zaustavljanje RabbitMQ instance
---------------------------------------------
brew services start rabbitmq
/opt/homebrew/sbin/rabbitmqctl enable_feature_flag all

brew services stop rabbitmq




admin konzola
---------------------------------------------
http://localhost:15672/#/queues
guest, guest




naredbe
---------------------------------------------
rabbitmqctl list_queues		- popis redova




Primjeri
---------------------------------------------

HelloWorld
    Jednostavan promjer proizvođača i potrošača poruka, moguće je pokrenuti više potrošača koji uzimaju poruke
    iz istog reda poruka (round robin alokacija poruka na trenutno spojene potrošače). 
    Postoji djelomična prostorna sprega između proizvođača i potrošača - poruke se postavljaju izravno u imenovani
    red poruka.
 

CompetingConsumers
    Dva ili više potrošača spojena su na isti red poruka, uzimaju poruke jednu po jednu (nema round robin alokacije)
    i izvršavaju ih simulirajući različito trajanje obrade (broj točaka na kraju poruke označava broj sekundi trajanja 
    obrade poruke). Proizvođač postavlja poruke izravno u imenovani red poruka, red poruka je trajan, 
    a poruke su perzistentne (pokušati ponovno pokretanje RabbitMQ poslužitelja i vidjeti da li su nepotrošene
    poruke unutar reda poruka očuvane). Potrošač mora potvrditi primitak poruke iz reda.


Routing
    Proizvođač šalje poruke u netrajnu burzu poruka tipa "direct" i navodi ključ usmjeravanja (info, warning, error).
    Potrošač stvara ekskluzivan i anoniman red poruka, povezuje taj red s burzom poruka s onoliko veza (korištenjem
    različitih ključeva vezivanja) koliko je ključnih riječi navedeno kao parametara kod pokretanja potrošača
    (npr. node receive.js warning error - povezat će red poruka s dvije veze prema burzi poruka). 
    Ne postoji niti prostorna niti vremenska sprega između proizvođača i potrošača.


PubSub
    Dva ili više potrošača spojena su, korištenjem anonimnih i ekskluzivnih redova poruka, na istu burzu poruka tipa "fanout".
    Sve poruke (oblika kao i kod CompetingConsumers primjera, ne koriste ključ usmjeravanja), se šalju svim trenutno na burzu 
    spojenim potrošačima, potrošači simuliraju trajanje izvršavanje poslova, ne potvrđuju primitak poruka RabbitMQ poslužitelju.


Topics
    Proizvođač šalje poruke formata <tip> <poruka>, gdje je tip složena riječ u kojoj su dijelovi odvojeni točkama,
    npr. "user.update.address", "warning.disk" itd. Poruka se šalje na burzu poruka tipa "topic" gdje se usmjerava prema
    trenutno spojenim redovima poruka na osnovu ključeva vezivanja tih redova i ključu usmjeravanja poruke (uključujući
    korištenje specijalnih znakova * i # u ključevima vezivanja). Potrošači stvaraju anonimne i ekskluzivne redove poruka
    koji su vezani na "topic" burzu poruka korištenjem jednog ili više ključeva vezivanja koji su navedeni kod pokretanja potrošača
    (npr. node receive.js error.user.* warning#). Primitak poruka se ne potvrđuje RabbitMQ poslužitelju.


RPC
    Primjer poziva udaljene procedure korištenjem razmjene poruka. Klijent prvo stvara ekskluzivni red poruka za prohvaćanje
    odgovora od strane poslužitelja. Klijent šalje pozivnu poruku (koja sadrži UUID poziva i ime reda poruka u kojem očekuje
    poruku odgovora) u imenovani red poruka poslužitelja (prostorna sprega postoji). Poslužitelj čeka na poruke zahtjeva
    u svom redu poruka, simulira obradu zahtjeva (čeka 1s) i šalje poruku odgovora s istim UUID prosljeđenim u poruci zahtjeva
    (polje correlationId:) i u red poruka klijenta navedenim u zahglavlju poruke zahtjeva (polje replyTo:). Niti klijent niti 
    poslužitelj ne potvrđuju primitak poruka RabbitMQ poslužitelju.

PublisherConfirms
    Primjer korištenja potvrda u postupku slanja poruka od pošiljatelja do RabbitMQ poslužitelja (PublisherConfirms mehanizam) i
    mehanizma alternativne burze, kojoj se prosljeđuju sve poruke iz originalne burze, a koje nisu mogle biti prosljeđene niti u 
    jedan red poruka (niti jedan red poruka trenutno nije vezan na burzu ili poruka ne zadovoljava niti jedan uvjet usmjeravanja
    u neki od povezanih redova poruka). Primjer proširuje prethodni primjer Routing: proizvođač šalje poruku (tip, sadržaj) na
    burzu tipa "direct": ako poruka odgovara ključu vezivanja jednog ili više vezanih ekskluzivnih redova poruka, prosljeđuje se udaljene
    taj/te redove poruka, inače se prosljeđuje alternativnoj burzi tipa "fanout", koja pak prosljeđuje tu poruku svim vezanim
    potrošačima implementiranim programskim kodom u datoteci receiveX.js


DLX
    Dva ili više potrošača spojena su na isti red poruka, uzimaju poruke jednu po jednu (nema round robin alokacije)
    i izvršavaju ih simulirajući različito trajanje obrade (broj točaka na kraju poruke označava broj sekundi trajanja 
    obrade poruke). Dva su tipa potrošača; receiveEven obrađuje samo poruke čija obrada traja paran broj sekundi, 
    a "neparne" poslove vraća u red poruka, dok receiveOdd radi obrnuto. Ukoliko potrošači naiđu na posao koji traje 0s
    (nema niti jednu točku kao sufiks), odbijaju posao (vraćaju posao bez mogućnosti vraćanja u red poruka).
    Proizvođač postavlja poruke izravno u imenovani red poruka, red poruka je netrajan i ograničava vrijeme pohrane
    pojedine poruke u redu na 10s, nakon toga poruka se briše. Na red poruka je vezana burza DLX
    (dead letter exchange) koja prihvaća obrisane i odbijene poruke iz reda i prosljeđuje ih povezanom redu poruka. Iz povezanog
    reda poruke preuzime potrošač receiveDead koji ih ispisuje.
    