-- 🏛️ SCRIPT ÚNICO: CONFIGURAÇÃO DE CAMPOS E CADASTRO DE ALUNOS
-- Este script faz tudo: cria as colunas, garante que o CPF seja único e insere os 49 alunos.
-- Execute este script no SQL Editor do Supabase.

DO $$
DECLARE
    v_class_id UUID;
BEGIN
    -- 1. ADICIONAR COLUNAS (Caso não existam)
    ALTER TABLE public.students ADD COLUMN IF NOT EXISTS birth_date TEXT;
    ALTER TABLE public.students ADD COLUMN IF NOT EXISTS street TEXT;
    ALTER TABLE public.students ADD COLUMN IF NOT EXISTS number TEXT;
    ALTER TABLE public.students ADD COLUMN IF NOT EXISTS neighborhood TEXT;
    ALTER TABLE public.students ADD COLUMN IF NOT EXISTS city TEXT;
    ALTER TABLE public.students ADD COLUMN IF NOT EXISTS state TEXT;

    -- 2. GARANTIR QUE O CPF SEJA ÚNICO (Para o ON CONFLICT funcionar)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'students_cpf_key'
    ) THEN
        ALTER TABLE public.students ADD CONSTRAINT students_cpf_key UNIQUE (cpf);
    END IF;

    -- 3. GARANTIR QUE A TURMA EXISTA
    SELECT id INTO v_class_id FROM public.classes WHERE name = 'Cosme de Fárias' LIMIT 1;
    
    IF v_class_id IS NULL THEN
        INSERT INTO public.classes (name, shift, max_students, day_of_week)
        VALUES ('Cosme de Fárias', 'hibrido', 100, 'friday,saturday')
        RETURNING id INTO v_class_id;
    END IF;

    -- 4. INSERIR ALUNOS (Com ON CONFLICT para evitar nomes duplicados)
    INSERT INTO public.students 
    (name, cpf, email, enrollment_number, phone, birth_date, street, number, neighborhood, city, state, class_id, status)
    VALUES
    ('ANA LIMA DE OLIVEIRA SANTOS', '28201337549', 'analima5689@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71988749944', '17/11/1998', 'Travessa Izídio', '3', 'Cosme de Farias', 'Salvador', 'Bahia', v_class_id, 'active'),
    ('ANDRÉIA PIANCÓ BITENCOURT', '48331724534', 'Piancojt@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71991436191', '14/07/1970', 'Rua Maria Augusta Maia', '167', 'Brotas', 'Salvador', 'BA', v_class_id, 'active'),
    ('CLAUDIO DA GLORIA DE ALMEIDA', '90627334504', 'clausampoli@hotmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71987565698', '12/02/1974', 'Rua Machado de Assis', '50 - fundo', 'Brotas', 'Salvador', 'BA', v_class_id, 'active'),
    ('CLEIDINAY BISPO DE JESUS', '94381275500', 'cleidinay@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71987424830', '21/04/1977', 'Rua Cosme de Farias', '190', 'Cosme de Farias', 'Salvador', 'BA', v_class_id, 'active'),
    ('CLEONICE LIMA DE OLIVEIRA CONCEIÇÃO', '60648528504', 'Cleonice-lima@hotmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71991032702', '04/11/1972', 'Primeira Travessa Lima Teixeira', '8', 'Cosme de Farias', 'Salvador', 'BA', v_class_id, 'active'),
    ('CREMILDA SILVA DA SILVA', '33556431572', 'cremi3244@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71986928978', '14/10/1964', 'Araçatuba, Alto do Cruzeiro', '57', 'Cosme de Farias', 'Salvador', 'BA', v_class_id, 'active'),
    ('CREUSBETE ARAÚJO SILVA', '59938110568', 'betymuzart@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71991858054', '23/08/1968', '', '', 'Cosme de farias', 'Salvador', 'BA', v_class_id, 'active'),
    ('DENISE SANTOS DE ALMEIDA', '92399886534', 'denise_2008@hotmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71988526925', '20/06/1978', 'Rua Machado de Assis', '50 A', 'Brotas', 'Salvador', 'BA', v_class_id, 'active'),
    ('EDILEIDE ALMEIDA SANTOS PAIXÃO', '82367892504', 'edileidepaixao@hotmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71988365624', '18/08/1982', 'Segunda travessa Açatuba, Alto do Cruzeiro', '12', 'Cosme de Farias', 'Salvador', 'BA', v_class_id, 'active'),
    ('EDILEUZA MERCES DE JESUS', '78481791504', 'acompanhamdorc@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71986513823', '26/04/1978', 'Rua São Crispim', '24', 'Cosme de farias', 'Salvador', 'BA', v_class_id, 'active'),
    ('EDIVALDO DO CARMO DA CONCEIÇÃO', '51939959500', 'Edivaldo-39@hotmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71991127875', '29/10/1967', 'Primeira Travessa Lima Teixeira', '8', 'Cosme de Farias', 'Salvador', 'BA', v_class_id, 'active'),
    ('EDMILSON LIMA CAETANO', '1796548537', 'edmilsonlima16@yahoo.com.br', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71999236670', '30/01/1984', 'Rua Alto do Saldanha 25', '25', 'Pq. Bela Vista', 'Salvador', 'BA', v_class_id, 'active'),
    ('EDMILSON OLIVEIRA DA SILVA', '62705997504', 'edmilson-38@hotmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71992956513', '30/11/1970', '18 de outubro', '140 B', 'Cosme de farias', 'Salvador', 'BA', v_class_id, 'active'),
    ('ELIANA OLIVEIRA DOS SANTOS DA SILVA', '54775949500', 'elianaoss423@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71991546493', '22/02/1967', 'Rua Cosme de Farias', '202', 'Cosme de Farias', 'Salvador', 'Bahia', v_class_id, 'active'),
    ('ELIAS FERREIRA DA SILVA NETO', '85981537531', 'ferreiraelias206@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '719912190631', '22/10/2000', 'Cosme de Farias Alto do Poeta', '202', 'Cosme de Farias', 'Salvador', 'Bahia', v_class_id, 'active'),
    ('ELLEN BIANCA LIMA DA CONCEIÇÃO', '86113293505', 'ellenbianca.adv@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71999475148', '15/11/1997', 'Rua 10 de Janeiro', '33', 'Pernambués', 'Salvador', 'BA', v_class_id, 'active'),
    ('FELIPE DE QUEIROZ SANTOS NEVES', '10704651513', 'felipequeirozsantosneves@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71988819799', '26/02/2004', '', '', '', '', '', v_class_id, 'active'),
    ('FLÁVIA GUIMARÃES DE ARAÚJO', '82955506591', 'Pedagogiaflaviaguimaraes86@yahoo.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71991878475', '16/03/1984', 'Avenida Jorentino', '32 A', 'Cosme de Farias', 'Salvador', 'BA', v_class_id, 'active'),
    ('JACINELLA SANTANA SOUZA', '29378974520', 'Jaciilsantana7@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71988677237', '05/03/1963', 'Rua nova do Sossego', '3 E térreo', 'Cosme de Farias', 'Salvador', 'BA', v_class_id, 'active'),
    ('JAILMA DE BRITO PAIXÃO OLIVEIRA', '01905203535', 'jailbritop@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71999358816', '13/06/1985', 'Arthur de Almeida Couto', '416 - Apt 1002', 'Vila Laura', 'Salvador', 'BA', v_class_id, 'active'),
    ('JERUSA CERQUEIRA DA COSTA', '35907827572', 'Cerqueiradacostajerua@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71983360251', '20/10/1962', '2ª Travessa Heitor Dias', '88E', 'Cosme de Farias', 'Salvador', 'BA', v_class_id, 'active'),
    ('JOCILENE BATISTA DOS SANTOS', '1207508560', 'jocilenesantos@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71991000728', '12/05/1985', 'Rua Jose Petitinga', '39', 'Cosme de Farias', 'Salvador', 'BA', v_class_id, 'active'),
    ('JOEL SANTOS DA CONCEIÇÃO', '28091310587', 'prjoel1@yahoo.com.br', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71991326325', '20/12/1961', 'RUA 10 DE JANEIRO', '33', 'PERNAMBUÉS', 'SALVADOR', 'BA', v_class_id, 'active'),
    ('JOSE CARLOS LIMA DE OLIVEIRA', '58023283553', 'josecarlosoliveira669@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71981289008', '01/09/1969', 'OSORIO VILAS BOAS', '5', 'COSME DE FARIAS', 'SALVADOR', 'BA', v_class_id, 'active'),
    ('JOSÉ HENRIQUE SILVA DOS SANTOS', '01291983589', 'josericksantos@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71988403164', '02/09/1985', 'Rua professor Fernando tude de Souza', '72', 'Matatu', 'Salvador', 'Bahia', v_class_id, 'active'),
    ('JOSEMILSON SALES BARBOSA', '95312374504', '_sjsalles007@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71984305169', '26/09/1980', 'Irmã Maria Regina', '9 Subsolo', 'Brotas', 'Salvador', 'BA', v_class_id, 'active'),
    ('JOSUE CARLOS DA PAIXÃO DOS SANTOS', '88781143591', 'josue2015paixao@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71981468097', '19/08/1974', '2ª Travessa Araçatuba', '12', 'Cosme de Farias', 'Salvador', 'Bahia', v_class_id, 'active'),
    ('LAURA MARLI SANTANA DOS SANTOS CAETANO', '78613132553', 'slauramarli@yahoo.com.br', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71991966981', '27/01/1975', 'Alto do Saldanha', '25', 'Parque Bela Vista', 'Salvador', 'BA', v_class_id, 'active'),
    ('LÉIA VERÔNICA BARBOSA DOS SANTOS', '78544297587', 'veronic.ba09@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '72987404286', '04/11/1978', 'Professor Fernando Tude de Souza', '72', 'Matatu', 'Salvador', 'BA', v_class_id, 'active'),
    ('LISANDRA DE JESUS DOS SANTOS', '80015360504', 'lisa.santana130@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71988119914', '01/01/1979', 'Direta Cosme de Farias', '140', 'Cosme de Farias', 'Salvador', 'Bahia', v_class_id, 'active'),
    ('LUCAS RICARDO DE JESUS SANTOS', '7016015580', 'Lukasguitarplayer@hotmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71985000000', '22/05/1994', 'Gandarela', '50', 'Cosme de Farias', 'Salvador', 'Bahia', v_class_id, 'active'),
    ('LUCI MARIA SANTOS DE OLIVEIRA LIMA', '52763340563', 'lucimariasn991865461@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71991865461', '08/03/1969', 'Osório Vilas Boas', '5', 'Cosme de Farias', 'Salvador', 'BA', v_class_id, 'active'),
    ('MARIA DAS CANDEIAS CONCEIÇÃO SILVA', '90341562572', 'maradejesus4@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71985254364', '05/12/1973', 'Almirante Alves Câmara', '32 apt 101', 'Engenho Velho de Brotas', 'Salvador', 'BA', v_class_id, 'active'),
    ('MARISA SANTOS SILVA', '19491085549', 'Mariss5860@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71987911796', '12/06/1960', 'Araçatuba', '57 A', 'Cosme de farias', 'Salvador', 'BA', v_class_id, 'active'),
    ('MOISÉS SOUZA NEVES', '94258686549', 'moisarock5@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71988577880', '10/06/1975', 'Segunda Travessa Santa Luzia', '148E', 'Vila- laura', 'Salvador', 'BA', v_class_id, 'active'),
    ('NÁDIA SILVA LIMA DA CONCEIÇÃO', '70040800563', 'nadialima1@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71986413393', '18/04/1971', '10 de Janeiro', '33', 'Pernambués', 'Salvador', 'BA', v_class_id, 'active'),
    ('NIVALDO MARCELINO DOS SANTOS CISTA', '05354978572', 'nivaldo.marcelino@yahoo.com.br', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71988482860', '09/01/1947', '2ª Travessa do Saboeiro', '89', 'Saboeiro', 'Salvador', 'BA', v_class_id, 'active'),
    ('PAULA DE OLIVEIRA SANTOS', '03948944563', 'e.voxxi@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71987532927', '07/12/1984', '', '', '', 'Salvador', 'BA', v_class_id, 'active'),
    ('PAULO NADSON DA LUZ', '26040794534', 'nadson.luz13@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71987487388', '13/05/1963', 'Edgard Reys Navarro', '326', 'Santo Agostinho', 'Salvador', 'BA', v_class_id, 'active'),
    ('POLIANA SANTOS DE ALMEIDA', '07925523506', 'polly10069@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71986447934', '12/06/2000', 'Machado de Assis', '50 A - Fundo', 'Brotas', 'Salvador', 'BA', v_class_id, 'active'),
    ('RAIMUNDO NONATO RIBEIRO', '37977563568', 'nonatoribe@hotmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71987406103', '12/04/1966', 'Av. barral', '15', 'Cosme de farias', 'Salvador', 'BA', v_class_id, 'active'),
    ('RITA DE CÁSSIA DE QUEIROZ SANTOS NEVES', '1211436519', 'rita.cassiaqueiroz@hotmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71986673146', '10/06/1982', 'Segunda travessa santa luzia', '148', 'Vila laura', 'Salvador', 'BA', v_class_id, 'active'),
    ('RUTE LOPES RIBEIRO', '09504323502', 'rute100lopes24@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '7186673146', '03/03/2003', '', '', '', '', '', v_class_id, 'active'),
    ('SANDRA DE OLIVEIRA CASTRO', '57662029549', 'sandraoliveir9417@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71992366716', '29/08/1971', 'Baixa do Silva', 'S/n', 'Cosme de Farias', 'Salvador', 'BA', v_class_id, 'active'),
    ('SILVANA DE OLIVEIRA NASCIMENTO', '70239720563', 'sn2001886@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71986289558', '19/09/1973', 'Luis Anselmo, BC.Heliodoro villa jauá', '23', 'Matatu- Brotas', 'Salvador', 'Bahia', v_class_id, 'active'),
    ('TÂMARA CONCEIÇÃO DO NASCIMENTO', '81616392567', 'tamaranascimento805@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71988836267', '04/07/1981', 'Travessa Santana Cosme de Farias', '34', 'Cosme de Farias', 'Salvador', 'BA', v_class_id, 'active'),
    ('TIAGO PEREIRA DOS SANTOS', '03772792502', 'tiagopereira202424@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71986430318', '21/02/1984', 'AV CHURUPITA', '4', 'VILA LAURA', 'SALVADOR', 'BA', v_class_id, 'active'),
    ('VALMIR LIMA DE OLIVEIRA', '57685053500', 'Valmirlimadeoliveira618@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71987976965', '21/12/1971', '2 trav.heitor dias', '28e', 'Cosme de farias', 'Salvador', 'BA', v_class_id, 'active'),
    ('WALDECIR AQUINO MELO DOS SANTOS', '33983569587', 'waldecyaquinomelo@gmail.com', '2026' || floor(random() * (9999-1000+1) + 1000)::text, '71984206814', '28/08/1960', 'Avenida Santa Ursula', '46', 'Cosme de Farias', 'Salvador', 'BA', v_class_id, 'active')
    ON CONFLICT (cpf) DO NOTHING;
END $$;
