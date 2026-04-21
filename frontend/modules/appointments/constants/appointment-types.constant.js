angular.module('helixcare.appointments')
.constant('APPOINTMENT_TYPES', [
  {
    group: 'Consultas Clínicas Gerais',
    types: [
      { value: 'PRIMEIRA_CONSULTA',           label: 'Primeira Consulta',                  duration: 60  },
      { value: 'RETORNO',                     label: 'Retorno',                            duration: 30  },
      { value: 'CONSULTA_URGENCIA',           label: 'Urgência / Encaixe',                 duration: 20  },
      { value: 'CONSULTA_ROTINA',             label: 'Consulta de Rotina',                 duration: 40  },
      { value: 'CONSULTA_PREVENTIVA',         label: 'Consulta Preventiva',                duration: 40  },
      { value: 'CHECKUP_EXECUTIVO',           label: 'Check-up Executivo',                 duration: 90  },
      { value: 'TELEATENDIMENTO',             label: 'Teleatendimento / Teleconsulta',     duration: 30  },
    ]
  },
  {
    group: 'Consultas Especializadas',
    types: [
      { value: 'CONSULTA_PEDIATRICA',         label: 'Pediátrica',                         duration: 45  },
      { value: 'CONSULTA_GERIATRICA',         label: 'Geriátrica',                         duration: 60  },
      { value: 'CONSULTA_PRENATAL',           label: 'Pré-natal',                          duration: 30  },
      { value: 'CONSULTA_PSIQUIATRICA',       label: 'Psiquiátrica / Saúde Mental',        duration: 60  },
      { value: 'CONSULTA_NUTRICIONAL',        label: 'Nutricional',                        duration: 45  },
      { value: 'CONSULTA_FISIOTERAPIA',       label: 'Fisioterapia',                       duration: 50  },
      { value: 'CONSULTA_ODONTOLOGICA',       label: 'Odontológica',                       duration: 45  },
    ]
  },
  {
    group: 'Acompanhamento / Cirúrgico',
    types: [
      { value: 'CONSULTA_PRE_OPERATORIA',     label: 'Pré-operatória',                     duration: 45  },
      { value: 'CONSULTA_POS_OPERATORIA',     label: 'Pós-operatória',                     duration: 30  },
      { value: 'CONSULTA_RESULTADO_EXAMES',   label: 'Resultado de Exames',                duration: 30  },
      { value: 'CONSULTA_PLANEJAMENTO_FAM',   label: 'Planejamento Familiar',              duration: 45  },
      { value: 'CRESCIMENTO_DESENVOLVIMENTO', label: 'Crescimento e Desenvolvimento',      duration: 40  },
    ]
  },
  {
    group: 'Exames de Imagem',
    types: [
      { value: 'USG_ABDOMINAL',               label: 'Ultrassonografia Abdominal',         duration: 30  },
      { value: 'USG_OBSTETRICA',              label: 'Ultrassonografia Obstétrica',        duration: 30  },
      { value: 'USG_TRANSVAGINAL',            label: 'Ultrassonografia Transvaginal',      duration: 20  },
      { value: 'USG_MORFOLOGICA',             label: 'Ultrassonografia Morfológica',       duration: 60  },
      { value: 'USG_MAMARIA',                 label: 'Ultrassonografia Mamária',           duration: 25  },
      { value: 'MAMOGRAFIA',                  label: 'Mamografia',                         duration: 20  },
      { value: 'RAIO_X',                      label: 'Raio-X',                             duration: 15  },
      { value: 'TOMOGRAFIA',                  label: 'Tomografia Computadorizada',         duration: 30  },
      { value: 'RESSONANCIA_MAGNETICA',       label: 'Ressonância Magnética',              duration: 60  },
      { value: 'DENSITOMETRIA_OSSEA',         label: 'Densitometria Óssea',               duration: 20  },
      { value: 'CINTILOGRAFIA',               label: 'Cintilografia',                      duration: 90  },
      { value: 'PET_CT',                      label: 'PET-CT',                             duration: 120 },
    ]
  },
  {
    group: 'Exames Cardiológicos',
    types: [
      { value: 'ELETROCARDIOGRAMA',           label: 'Eletrocardiograma (ECG)',            duration: 20  },
      { value: 'ECOCARDIOGRAMA',              label: 'Ecocardiograma',                     duration: 45  },
      { value: 'HOLTER',                      label: 'Holter 24h (aplicação)',             duration: 20  },
      { value: 'MAPA',                        label: 'MAPA (aplicação)',                   duration: 15  },
      { value: 'TESTE_ESFORCO',               label: 'Teste de Esforço / Ergometria',      duration: 45  },
      { value: 'CATETERISMO',                 label: 'Cateterismo Cardíaco',               duration: 90  },
    ]
  },
  {
    group: 'Exames Digestivos / Endoscópicos',
    types: [
      { value: 'ENDOSCOPIA',                  label: 'Endoscopia Digestiva Alta',          duration: 30  },
      { value: 'COLONOSCOPIA',                label: 'Colonoscopia',                       duration: 45  },
      { value: 'COLPOSCOPIA',                 label: 'Colposcopia',                        duration: 30  },
      { value: 'RETOSSIGMOIDOSCOPIA',         label: 'Retossigmoidoscopia',               duration: 30  },
    ]
  },
  {
    group: 'Exames Neurológicos',
    types: [
      { value: 'ELETROENCEFALOGRAMA',         label: 'Eletroencefalograma (EEG)',          duration: 60  },
      { value: 'ELETROMIOGRAFIA',             label: 'Eletromiografia (EMG)',              duration: 60  },
      { value: 'POTENCIAL_EVOCADO',           label: 'Potencial Evocado',                 duration: 60  },
    ]
  },
  {
    group: 'Exames Pulmonares',
    types: [
      { value: 'ESPIROMETRIA',                label: 'Espirometria',                       duration: 30  },
      { value: 'POLIGRAFIA_SONO',             label: 'Polissonografia / Sono',             duration: 30  },
    ]
  },
  {
    group: 'Laboratoriais / Coletas',
    types: [
      { value: 'COLETA_LABORATORIAL',         label: 'Coleta de Sangue / Laboratorial',   duration: 15  },
      { value: 'CURVA_GLICEMICA',             label: 'Curva Glicêmica',                   duration: 120 },
      { value: 'PREVENTIVO_PAPANICOLAU',      label: 'Preventivo / Papanicolau',           duration: 20  },
      { value: 'BIOPSIA',                     label: 'Biópsia',                            duration: 30  },
      { value: 'TESTE_ALERGIA',               label: 'Teste de Alergia',                  duration: 40  },
    ]
  },
  {
    group: 'Procedimentos Menores',
    types: [
      { value: 'VACINACAO',                   label: 'Vacinação',                          duration: 15  },
      { value: 'CURATIVO',                    label: 'Curativo',                           duration: 20  },
      { value: 'INFILTRACAO',                 label: 'Infiltração / Injeção',              duration: 20  },
      { value: 'RETIRADA_PONTOS',             label: 'Retirada de Pontos',                duration: 15  },
      { value: 'INALACAO',                    label: 'Inalação / Nebulização',             duration: 30  },
      { value: 'DRENAGEM',                    label: 'Drenagem de Abscesso',               duration: 30  },
      { value: 'CAUTERIZACAO',                label: 'Cauterização',                       duration: 20  },
      { value: 'PEQUENA_CIRURGIA',            label: 'Pequena Cirurgia Ambulatorial',      duration: 60  },
      { value: 'APLICACAO_MEDICAMENTO',       label: 'Aplicação de Medicamento',           duration: 15  },
    ]
  },
  {
    group: 'Outro',
    types: [
      { value: 'OUTRO',                       label: 'Outro (definir duração manualmente)',duration: 30  },
    ]
  }
]);