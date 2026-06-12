Manual for å kjøre nettsiden fra github appen:

Steg 1: clone ved å trykk på add knappen ved siden av navnet til current repoet du er i på github, dermed velg url og lim in https://github.com/ArmanKaya/ArBank

Steg 2: høyre trykk på prosjektet «arbank» og åpne i visual studio code

Steg 3: åpne terminalen ved å dra baren fra bunnen av skjermen i visual studio code

Steg 4: last ned dependencies, ved å lime inn eller skrive i terminalen «npm install»

Steg 5: skriv i terminalen «npm run dev», Dermed skal nettsiden kjøre!

(om du sliter med å finne den i browser er det bare å skrive 127.0.0.1:3001 i address baren)




Manual for å clone til appen fra browser:

steg 1: trykk på den grønne knappen hvor det står code

steg 2: trykk open with github desktop 

Steg 3: høyre trykk på prosjektet «arbank» og åpne i visual studio code

Steg 4: åpne terminalen ved å dra baren fra bunnen av skjermen i visual studio code

Steg 5: last ned dependencies, ved å lime inn eller skrive i terminalen «npm install»

Steg 6: skriv i terminalen «npm run dev», Dermed skal nettsiden kjøre!

(om du sliter med å finne den i browser er det bare å skrive 127.0.0.1:3001 i address baren)

VIKTIG INFOMRASJON:
dersom det står at mail oppsett mangler dette fordi den er i en privat .env siden den inneholder privat informasjon,
dersom du vill legge til eget opprett en .env fil og skriv inni den som følger:
SUPPORT_MAIL="mailen du ønsker å sende fra"
SUPPORT_MAIL_PASSWORD="google app passkeyen til denne brukeren"
SUPPORT_RECEIVER="mailen som skal mota mailene"


Logiske valg og begrunnelser 12/06/2026

jeg utviklet denne web appen med promises, try catch statements og async functions så den kan handle flere klienter samtidig

jeg valgte å slette brukere fra databasen, med en seperat for konto(accounts) og en for brukere(users), dete er for å kunne velge mer spesifikt og kjøre ting en om gangen og suitet promisesene mine bedre.

jeg brukte SQLite fordi det kjører raskere enn andre database engines for nettsider som min som ikke har mange klienter.

jeg valgte å bruke express rate limiter, for å unngå brute forcing, jeg gjorde det på den måten fordi det er viktig å sjekke hvilken ip som gjetter, ikke bare hvilken bruker de gjetter, da kunne andre med villje sperret venner eller folk sine kontoer, 
men med IP, sperrer vi den som faktisk skriver in feil passord ovenfor brukeren som det blir skrevet feil på, i tillegg unngår dette at de prøver 5 ganger på alle brukere med en bot.
