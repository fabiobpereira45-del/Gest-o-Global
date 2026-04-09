const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://vevivqcluyutlatwsnjh.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldml2cWNsdXl1dGxhdHdzbmpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY1NTYxOCwiZXhwIjoyMDkwMzg3Mzg5fQ.42Gk_uOBezQfMpWp6mpPLjFYmwf_te13DEz9Pek1oj0";

const supabase = createClient(supabaseUrl, supabaseServiceKey);
console.log("Supabase URL:", supabaseUrl);
console.log("Key Length:", supabaseServiceKey ? supabaseServiceKey.length : 0);
console.log("Key Prefix:", supabaseServiceKey ? supabaseServiceKey.substring(0, 20) : "N/A");

const students = [
    { name: "ANA LIMA DE OLIVEIRA SANTOS", cpf: "28201337549", birth_date: "17/11/1998", street: "Travessa Izídio", number: "3", neighborhood: "Cosme de Farias", city: "Salvador", state: "Bahia", phone: "71988749944", email: "analima5689@gmail.com" },
    { name: "ANDRÉIA PIANCÓ BITENCOURT", cpf: "48331724534", birth_date: "14/07/1970", street: "Rua Maria Augusta Maia", number: "167", neighborhood: "Brotas", city: "Salvador", state: "BA", phone: "71991436191", email: "Piancojt@gmail.com" },
    { name: "CLAUDIO DA GLORIA DE ALMEIDA", cpf: "90627334504", birth_date: "12/02/1974", street: "Rua Machado de Assis", number: "50 - fundo", neighborhood: "Brotas", city: "Salvador", state: "BA", phone: "71987565698", email: "clausampoli@hotmail.com" },
    { name: "CLEIDINAY BISPO DE JESUS", cpf: "94381275500", birth_date: "21/04/1977", street: "Rua Cosme de Farias", number: "190", neighborhood: "Cosme de Farias", city: "Salvador", state: "BA", phone: "71987424830", email: "cleidinay@gmail.com" },
    { name: "CLEONICE LIMA DE OLIVEIRA CONCEIÇÃO", cpf: "60648528504", birth_date: "04/11/1972", street: "Primeira Travessa Lima Teixeira", number: "8", neighborhood: "Cosme de Farias", city: "Salvador", state: "BA", phone: "71991032702", email: "Cleonice-lima@hotmail.com" },
    { name: "CREMILDA SILVA DA SILVA", cpf: "33556431572", birth_date: "14/10/1964", street: "Araçatuba, Alto do Cruzeiro", number: "57", neighborhood: "Cosme de Farias", city: "Salvador", state: "BA", phone: "71986928978", email: "cremi3244@gmail.com" },
    { name: "CREUSBETE ARAÚJO SILVA", cpf: "59938110568", birth_date: "23/08/1968", street: "", number: "", neighborhood: "Cosme de farias", city: "Salvador", state: "BA", phone: "71991858054", email: "betymuzart@gmail.com" },
    { name: "DENISE SANTOS DE ALMEIDA", cpf: "92399886534", birth_date: "20/06/1978", street: "Rua Machado de Assis", number: "50 A", neighborhood: "Brotas", city: "Salvador", state: "BA", phone: "71988526925", email: "denise_2008@hotmail.com" },
    { name: "EDILEIDE ALMEIDA SANTOS PAIXÃO", cpf: "82367892504", birth_date: "18/08/1982", street: "Segunda travessa Açatuba, Alto do Cruzeiro", number: "12", neighborhood: "Cosme de Farias", city: "Salvador", state: "BA", phone: "71988365624", email: "edileidepaixao@hotmail.com" },
    { name: "EDILEUZA MERCES DE JESUS", cpf: "78481791504", birth_date: "26/04/1978", street: "Rua São Crispim", number: "24", neighborhood: "Cosme de farias", city: "Salvador", state: "BA", phone: "71986513823", email: "acompanhamdorc@gmail.com" },
    { name: "EDIVALDO DO CARMO DA CONCEIÇÃO", cpf: "51939959500", birth_date: "29/10/1967", street: "Primeira Travessa Lima Teixeira", number: "8", neighborhood: "Cosme de Farias", city: "Salvador", state: "BA", phone: "71991127875", email: "Edivaldo-39@hotmail.com" },
    { name: "EDMILSON LIMA CAETANO", cpf: "1796548537", birth_date: "30/01/1984", street: "Rua Alto do Saldanha 25", number: "25", neighborhood: "Pq. Bela Vista", city: "Salvador", state: "BA", phone: "71999236670", email: "edmilsonlima16@yahoo.com.br" },
    { name: "EDMILSON OLIVEIRA DA SILVA", cpf: "62705997504", birth_date: "30/11/1970", street: "18 de outubro", number: "140 B", neighborhood: "Cosme de farias", city: "Salvador", state: "BA", phone: "71992956513", email: "edmilson-38@hotmail.com" },
    { name: "ELIANA OLIVEIRA DOS SANTOS DA SILVA", cpf: "54775949500", birth_date: "22/02/1967", street: "Rua Cosme de Farias", number: "202", neighborhood: "Cosme de Farias", city: "Salvador", state: "Bahia", phone: "71991546493", email: "elianaoss423@gmail.com" },
    { name: "ELIAS FERREIRA DA SILVA NETO", cpf: "85981537531", birth_date: "22/10/2000", street: "Cosme de Farias Alto do Poeta", number: "202", neighborhood: "Cosme de Farias", city: "Salvador", state: "Bahia", phone: "719912190631", email: "ferreiraelias206@gmail.com" },
    { name: "ELLEN BIANCA LIMA DA CONCEIÇÃO", cpf: "86113293505", birth_date: "15/11/1997", street: "Rua 10 de Janeiro", number: "33", neighborhood: "Pernambués", city: "Salvador", state: "BA", phone: "71999475148", email: "ellenbianca.adv@gmail.com" },
    { name: "FELIPE DE QUEIROZ SANTOS NEVES", cpf: "10704651513", birth_date: "26/02/2004", street: "", number: "", neighborhood: "", city: "", state: "", phone: "71988819799", email: "felipequeirozsantosneves@gmail.com" },
    { name: "FLÁVIA GUIMARÃES DE ARAÚJO", cpf: "82955506591", birth_date: "16/03/1984", street: "Avenida Jorentino", number: "32 A", neighborhood: "Cosme de Farias", city: "Salvador", state: "BA", phone: "71991878475", email: "Pedagogiaflaviaguimaraes86@yahoo.com" },
    { name: "JACINELLA SANTANA SOUZA", cpf: "29378974520", birth_date: "05/03/1963", street: "Rua nova do Sossego", number: "3 E térreo", neighborhood: "Cosme de Farias", city: "Salvador", state: "BA", phone: "71988677237", email: "Jaciilsantana7@gmail.com" },
    { name: "JAILMA DE BRITO PAIXÃO OLIVEIRA", cpf: "01905203535", birth_date: "13/06/1985", street: "Arthur de Almeida Couto", number: "416 - Apt 1002", neighborhood: "Vila Laura", city: "Salvador", state: "BA", phone: "71999358816", email: "jailbritop@gmail.com" },
    { name: "JERUSA CERQUEIRA DA COSTA", cpf: "35907827572", birth_date: "20/10/1962", street: "2ª Travessa Heitor Dias", number: "88E", neighborhood: "Cosme de Farias", city: "Salvador", state: "BA", phone: "71983360251", email: "Cerqueiradacostajerua@gmail.com" },
    { name: "JOCILENE BATISTA DOS SANTOS", cpf: "1207508560", birth_date: "12/05/1985", street: "Rua Jose Petitinga", number: "39", neighborhood: "Cosme de Farias", city: "Salvador", state: "BA", phone: "71991000728", email: "jocilenesantos@gmail.com" },
    { name: "JOEL SANTOS DA CONCEIÇÃO", cpf: "28091310587", birth_date: "20/12/1961", street: "RUA 10 DE JANEIRO", number: "33", neighborhood: "PERNAMBUÉS", city: "SALVADOR", state: "BA", phone: "71991326325", email: "prjoel1@yahoo.com.br" },
    { name: "JOSE CARLOS LIMA DE OLIVEIRA", cpf: "58023283553", birth_date: "01/09/1969", street: "OSORIO VILAS BOAS", number: "5", neighborhood: "COSME DE FARIAS", city: "SALVADOR", state: "BA", phone: "71981289008", email: "josecarlosoliveira669@gmail.com" },
    { name: "JOSÉ HENRIQUE SILVA DOS SANTOS", cpf: "01291983589", birth_date: "02/09/1985", street: "Rua professor Fernando tude de Souza", number: "72", neighborhood: "Matatu", city: "Salvador", state: "Bahia", phone: "71988403164", email: "josericksantos@gmail.com" },
    { name: "JOSEMILSON SALES BARBOSA", cpf: "95312374504", birth_date: "26/09/1980", street: "Irmã Maria Regina", number: "9 Subsolo", neighborhood: "Brotas", city: "Salvador", state: "BA", phone: "71984305169", email: "_sjsalles007@gmail.com" },
    { name: "JOSUE CARLOS DA PAIXÃO DOS SANTOS", cpf: "88781143591", birth_date: "19/08/1974", street: "2ª Travessa Araçatuba", number: "12", neighborhood: "Cosme de Farias", city: "Salvador", state: "Bahia", phone: "71981468097", email: "josue2015paixao@gmail.com" },
    { name: "LAURA MARLI SANTANA DOS SANTOS CAETANO", cpf: "78613132553", birth_date: "27/01/1975", street: "Alto do Saldanha", number: "25", neighborhood: "Parque Bela Vista", city: "Salvador", state: "BA", phone: "71991966981", email: "slauramarli@yahoo.com.br" },
    { name: "LÉIA VERÔNICA BARBOSA DOS SANTOS", cpf: "78544297587", birth_date: "04/11/1978", street: "Professor Fernando Tude de Souza", number: "72", neighborhood: "Matatu", city: "Salvador", state: "BA", phone: "72987404286", email: "veronic.ba09@gmail.com" },
    { name: "LISANDRA DE JESUS DOS SANTOS", cpf: "80015360504", birth_date: "01/01/1979", street: "Direta Cosme de Farias", number: "140", neighborhood: "Cosme de Farias", city: "Salvador", state: "Bahia", phone: "71988119914", email: "lisa.santana130@gmail.com" },
    { name: "LUCAS RICARDO DE JESUS SANTOS", cpf: "7016015580", birth_date: "22/05/1994", street: "Gandarela", number: "50", neighborhood: "Cosme de Farias", city: "Salvador", state: "Bahia", phone: "71985000000", email: "Lukasguitarplayer@hotmail.com" },
    { name: "LUCI MARIA SANTOS DE OLIVEIRA LIMA", cpf: "52763340563", birth_date: "08/03/1969", street: "Osório Vilas Boas", number: "5", neighborhood: "Cosme de Farias", city: "Salvador", state: "BA", phone: "71991865461", email: "lucimariasn991865461@gmail.com" },
    { name: "MARIA DAS CANDEIAS CONCEIÇÃO SILVA", cpf: "90341562572", birth_date: "05/12/1973", street: "Almirante Alves Câmara", number: "32 apt 101", neighborhood: "Engenho Velho de Brotas", city: "Salvador", state: "BA", phone: "71985254364", email: "maradejesus4@gmail.com" },
    { name: "MARISA SANTOS SILVA", cpf: "19491085549", birth_date: "12/06/1960", street: "Araçatuba", number: "57 A", neighborhood: "Cosme de farias", city: "Salvador", state: "BA", phone: "71987911796", email: "Mariss5860@gmail.com" },
    { name: "MOISÉS SOUZA NEVES", cpf: "94258686549", birth_date: "10/06/1975", street: "Segunda Travessa Santa Luzia", number: "148E", neighborhood: "Vila- laura", city: "Salvador", state: "BA", phone: "71988577880", email: "moisarock5@gmail.com" },
    { name: "NÁDIA SILVA LIMA DA CONCEIÇÃO", cpf: "70040800563", birth_date: "18/04/1971", street: "10 de Janeiro", number: "33", neighborhood: "Pernambués", city: "Salvador", state: "BA", phone: "71986413393", email: "nadialima1@gmail.com" },
    { name: "NIVALDO MARCELINO DOS SANTOS CISTA", cpf: "05354978572", birth_date: "09/01/1947", street: "2ª Travessa do Saboeiro", number: "89", neighborhood: "Saboeiro", city: "Salvador", state: "BA", phone: "71988482860", email: "nivaldo.marcelino@yahoo.com.br" },
    { name: "PAULA DE OLIVEIRA SANTOS", cpf: "03948944563", birth_date: "07/12/1984", street: "", number: "", neighborhood: "", city: "Salvador", state: "BA", phone: "71987532927", email: "e.voxxi@gmail.com" },
    { name: "PAULO NADSON DA LUZ", cpf: "26040794534", birth_date: "13/05/1963", street: "Edgard Reys Navarro", number: "326", neighborhood: "Santo Agostinho", city: "Salvador", state: "BA", phone: "71987487388", email: "nadson.luz13@gmail.com" },
    { name: "POLIANA SANTOS DE ALMEIDA", cpf: "07925523506", birth_date: "12/06/2000", street: "Machado de Assis", number: "50 A - Fundo", neighborhood: "Brotas", city: "Salvador", state: "BA", phone: "71986447934", email: "polly10069@gmail.com" },
    { name: "RAIMUNDO NONATO RIBEIRO", cpf: "37977563568", birth_date: "12/04/1966", street: "Av. barral", number: "15", neighborhood: "Cosme de farias", city: "Salvador", state: "BA", phone: "71987406103", email: "nonatoribe@hotmail.com" },
    { name: "RITA DE CÁSSIA DE QUEIROZ SANTOS NEVES", cpf: "1211436519", birth_date: "10/06/1982", street: "Segunda travessa santa luzia", number: "148", neighborhood: "Vila laura", city: "Salvador", state: "BA", phone: "71986673146", email: "rita.cassiaqueiroz@hotmail.com" },
    { name: "RUTE LOPES RIBEIRO", cpf: "09504323502", birth_date: "03/03/2003", street: "", number: "", neighborhood: "", city: "", state: "", phone: "7186673146", email: "rute100lopes24@gmail.com" },
    { name: "SANDRA DE OLIVEIRA CASTRO", cpf: "57662029549", birth_date: "29/08/1971", street: "Baixa do Silva", number: "S/n", neighborhood: "Cosme de Farias", city: "Salvador", state: "BA", phone: "71992366716", email: "sandraoliveir9417@gmail.com" },
    { name: "SILVANA DE OLIVEIRA NASCIMENTO", cpf: "70239720563", birth_date: "19/09/1973", street: "Luis Anselmo, BC.Heliodoro villa jauá", number: "23", neighborhood: "Matatu- Brotas", city: "Salvador", state: "Bahia", phone: "71986289558", email: "sn2001886@gmail.com" },
    { name: "TÂMARA CONCEIÇÃO DO NASCIMENTO", cpf: "81616392567", birth_date: "04/07/1981", street: "Travessa Santana Cosme de Farias", number: "34", neighborhood: "Cosme de Farias", city: "Salvador", state: "BA", phone: "71988836267", email: "tamaranascimento805@gmail.com" },
    { name: "TIAGO PEREIRA DOS SANTOS", cpf: "03772792502", birth_date: "21/02/1984", street: "AV CHURUPITA", number: "4", neighborhood: "VILA LAURA", city: "SALVADOR", state: "BA", phone: "71986430318", email: "tiagopereira202424@gmail.com" },
    { name: "VALMIR LIMA DE OLIVEIRA", cpf: "57685053500", birth_date: "21/12/1971", street: "2 trav.heitor dias", number: "28e", neighborhood: "Cosme de farias", city: "Salvador", state: "BA", phone: "71987976965", email: "Valmirlimadeoliveira618@gmail.com" },
    { name: "WALDECIR AQUINO MELO DOS SANTOS", cpf: "33983569587", birth_date: "28/08/1960", street: "Avenida Santa Ursula", number: "46", neighborhood: "Cosme de Farias", city: "Salvador", state: "BA", phone: "71984206814", email: "waldecyaquinomelo@gmail.com" }
];

async function registerAll() {
    console.log(`Iniciando cadastro de ${students.length} alunos...`);

    // 1. Get or Create Class "Cosme de Farias"
    let { data: cls, error: clsErr } = await supabase.from('classes').select('id').eq('name', 'Cosme de Farias').maybeSingle();
    if (clsErr) {
        console.error("Erro ao buscar turma:", clsErr);
        return;
    }
    if (!cls) {
        console.log("Criando turma 'Cosme de Farias'...");
        const { data: newCls, error: createClsErr } = await supabase.from('classes').insert({ name: 'Cosme de Farias', shift: 'ead', max_students: 100 }).select().single();
        if (createClsErr) {
            console.error("Erro ao criar turma:", createClsErr);
            return;
        }
        cls = newCls;
    }
    const classId = cls.id;

    for (const s of students) {
        console.log(`Processando: ${s.name}...`);
        try {
            const password = "IBAD2026";
            const cleanCpf = s.cpf.replace(/\D/g, '');
            const email = s.email.toLowerCase().trim();

            // 1. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name: s.name, type: 'student' }
            });

            if (authError) {
                if (authError.message.includes("already registered")) {
                    console.log(`Usuário ${email} já existe no Auth. Pulando criação de Auth.`);
                    // Try to find the existing user to link
                    const { data: existingUser } = await supabase.from('students').select('id').eq('email', email).maybeSingle();
                    if (existingUser) continue; // Already in DB too
                } else {
                    console.error(`Erro Auth para ${s.name}:`, authError.message);
                    continue;
                }
            }

            const authUserId = authData.user ? authData.user.id : null;
            const matricula = `2026${Math.floor(1000 + Math.random() * 9000)}`;

            // 2. Insert into students table
            const { error: dbError } = await supabase.from('students').insert({
                auth_user_id: authUserId,
                name: s.name.toUpperCase(),
                cpf: cleanCpf,
                email: email,
                enrollment_number: matricula,
                phone: s.phone,
                birth_date: s.birth_date,
                street: s.street,
                number: s.number,
                neighborhood: s.neighborhood,
                city: s.city,
                state: s.state,
                status: 'active',
                class_id: classId
            });

            if (dbError) {
                console.error(`Erro DB para ${s.name}:`, dbError.message);
            } else {
                console.log(`✅ ${s.name} cadastrado com sucesso!`);
            }
        } catch (err) {
            console.error(`Falha fatal para ${s.name}:`, err);
        }
    }
    console.log("Processo concluído.");
}

registerAll();
