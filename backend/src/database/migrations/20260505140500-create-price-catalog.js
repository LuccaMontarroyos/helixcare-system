'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('price_catalog', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      service_kind: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'APPOINTMENT ou EXAM',
      },
      service_code: {
        type: Sequelize.STRING(120),
        allowNull: false,
        comment: 'Chave técnica para match automático',
      },
      display_name: {
        type: Sequelize.STRING(180),
        allowNull: false,
      },
      base_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      market_price_min: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      market_price_max: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      default_payment_method: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'PIX',
      },
      due_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addConstraint('price_catalog', {
      fields: ['service_kind', 'service_code'],
      type: 'unique',
      name: 'uq_price_catalog_kind_code',
    });

    await queryInterface.addIndex('price_catalog', ['service_kind', 'is_active'], {
      name: 'idx_price_catalog_kind_active',
    });

    const now = new Date();

    // Valores referenciais para clínicas privadas no Brasil (faixas típicas de mercado).
    // Devem ser ajustados por região/especialidade pela equipe administrativa.
    const appointmentRows = [
      ['RETORNO', 'Consulta de Retorno', 180, 120, 250],
      ['CONSULTA_URGENCIA', 'Consulta de Urgência', 260, 180, 380],
      ['PRIMEIRA_CONSULTA', 'Primeira Consulta', 280, 180, 420],
      ['CONSULTA_ROTINA', 'Consulta de Rotina', 220, 140, 320],
      ['CONSULTA_PREVENTIVA', 'Consulta Preventiva', 230, 150, 330],
      ['CHECKUP_EXECUTIVO', 'Checkup Executivo', 650, 450, 1200],
      ['TELEATENDIMENTO', 'Teleatendimento', 170, 100, 260],
      ['CONSULTA_PEDIATRICA', 'Consulta Pediátrica', 230, 140, 340],
      ['CONSULTA_GERIATRICA', 'Consulta Geriátrica', 260, 170, 390],
      ['CONSULTA_PRENATAL', 'Consulta Pré-natal', 240, 150, 360],
      ['CONSULTA_PSIQUIATRICA', 'Consulta Psiquiátrica', 350, 220, 550],
      ['CONSULTA_NUTRICIONAL', 'Consulta Nutricional', 220, 130, 320],
      ['CONSULTA_FISIOTERAPIA', 'Consulta Fisioterapia', 160, 90, 250],
      ['CONSULTA_ODONTOLOGICA', 'Consulta Odontológica', 200, 120, 300],
      ['CONSULTA_PRE_OPERATORIA', 'Consulta Pré-operatória', 280, 170, 420],
      ['CONSULTA_POS_OPERATORIA', 'Consulta Pós-operatória', 220, 130, 320],
      ['CONSULTA_RESULTADO_EXAMES', 'Consulta de Resultado de Exames', 180, 100, 260],
      ['CONSULTA_PLANEJAMENTO_FAM', 'Consulta de Planejamento Familiar', 230, 140, 340],
      ['CRESCIMENTO_DESENVOLVIMENTO', 'Consulta de Crescimento e Desenvolvimento', 230, 140, 340],
      ['USG_ABDOMINAL', 'Ultrassonografia Abdominal', 260, 180, 380],
      ['USG_OBSTETRICA', 'Ultrassonografia Obstétrica', 290, 200, 450],
      ['USG_TRANSVAGINAL', 'Ultrassonografia Transvaginal', 260, 170, 380],
      ['USG_MORFOLOGICA', 'Ultrassonografia Morfológica', 520, 350, 800],
      ['USG_MAMARIA', 'Ultrassonografia Mamária', 270, 180, 400],
      ['MAMOGRAFIA', 'Mamografia', 280, 190, 430],
      ['RAIO_X', 'Raio-X', 140, 80, 220],
      ['TOMOGRAFIA', 'Tomografia', 520, 320, 850],
      ['RESSONANCIA_MAGNETICA', 'Ressonância Magnética', 950, 600, 1700],
      ['DENSITOMETRIA_OSSEA', 'Densitometria Óssea', 260, 160, 390],
      ['CINTILOGRAFIA', 'Cintilografia', 1200, 800, 2200],
      ['PET_CT', 'PET-CT', 3200, 2200, 5200],
      ['ELETROCARDIOGRAMA', 'Eletrocardiograma', 140, 80, 220],
      ['ECOCARDIOGRAMA', 'Ecocardiograma', 320, 220, 500],
      ['HOLTER', 'Holter', 340, 220, 520],
      ['MAPA', 'MAPA (24h)', 290, 180, 430],
      ['TESTE_ESFORCO', 'Teste Ergométrico', 330, 220, 520],
      ['CATETERISMO', 'Cateterismo', 6200, 4200, 11000],
      ['ENDOSCOPIA', 'Endoscopia', 620, 380, 980],
      ['COLONOSCOPIA', 'Colonoscopia', 980, 650, 1700],
      ['COLPOSCOPIA', 'Colposcopia', 300, 180, 460],
      ['RETOSSIGMOIDOSCOPIA', 'Retossigmoidoscopia', 620, 380, 980],
      ['ELETROENCEFALOGRAMA', 'Eletroencefalograma', 320, 200, 520],
      ['ELETROMIOGRAFIA', 'Eletromiografia', 850, 550, 1500],
      ['POTENCIAL_EVOCADO', 'Potencial Evocado', 920, 600, 1600],
      ['ESPIROMETRIA', 'Espirometria', 220, 130, 340],
      ['POLIGRAFIA_SONO', 'Poligrafia do Sono', 1200, 700, 2100],
      ['COLETA_LABORATORIAL', 'Coleta Laboratorial', 70, 40, 120],
      ['CURVA_GLICEMICA', 'Curva Glicêmica', 180, 110, 280],
      ['PREVENTIVO_PAPANICOLAU', 'Preventivo (Papanicolau)', 140, 80, 220],
      ['BIOPSIA', 'Biópsia', 520, 280, 900],
      ['TESTE_ALERGIA', 'Teste de Alergia', 380, 250, 650],
      ['VACINACAO', 'Vacinação (aplicação)', 90, 50, 140],
      ['CURATIVO', 'Curativo', 90, 50, 150],
      ['INFILTRACAO', 'Infiltração', 280, 160, 450],
      ['RETIRADA_PONTOS', 'Retirada de Pontos', 90, 50, 150],
      ['INALACAO', 'Inalação', 80, 40, 130],
      ['DRENAGEM', 'Drenagem', 320, 180, 520],
      ['CAUTERIZACAO', 'Cauterização', 220, 130, 360],
      ['PEQUENA_CIRURGIA', 'Pequena Cirurgia Ambulatorial', 850, 450, 1600],
      ['APLICACAO_MEDICAMENTO', 'Aplicação de Medicamento', 80, 40, 130],
      ['OUTRO', 'Procedimento / Consulta (Outro)', 220, 120, 380],
    ].map((item) => ({
      id: Sequelize.literal('gen_random_uuid()'),
      service_kind: 'APPOINTMENT',
      service_code: item[0],
      display_name: item[1],
      base_price: item[2],
      market_price_min: item[3],
      market_price_max: item[4],
      default_payment_method: 'PIX',
      due_days: 0,
      is_active: true,
      created_at: now,
      updated_at: now,
    }));

    const examRows = [
      ['HEMOGRAMA_COMPLETO', 'Hemograma Completo', 75, 40, 120],
      ['GLICEMIA_JEJUM', 'Glicemia de Jejum', 30, 15, 55],
      ['LIPIDOGRAMA', 'Lipidograma', 85, 45, 140],
      ['TSH_T4_LIVRE', 'TSH + T4 Livre', 130, 70, 220],
      ['PCR_ULTRASSENSIVEL', 'PCR Ultrassensível', 75, 35, 130],
      ['URINA_TIPO_1', 'Urina Tipo 1', 35, 18, 60],
      ['UROCULTURA', 'Urocultura', 70, 35, 120],
      ['PARASITOLOGICO_FEZES', 'Parasitológico de Fezes', 35, 18, 60],
      ['VITAMINA_D_25OH', 'Vitamina D (25-OH)', 160, 80, 260],
      ['FERRITINA', 'Ferritina', 90, 45, 150],
      ['HBA1C', 'Hemoglobina Glicada (HbA1c)', 95, 50, 160],
      ['DENGUE_IGM_IGG', 'Dengue IgM/IgG', 150, 85, 260],
      ['COVID_RT_PCR', 'COVID-19 RT-PCR', 130, 70, 220],
      ['BETA_HCG', 'Beta-hCG Quantitativo', 60, 30, 110],
      ['PSA_TOTAL_LIVRE', 'PSA Total + Livre', 130, 70, 220],
    ].map((item) => ({
      id: Sequelize.literal('gen_random_uuid()'),
      service_kind: 'EXAM',
      service_code: item[0],
      display_name: item[1],
      base_price: item[2],
      market_price_min: item[3],
      market_price_max: item[4],
      default_payment_method: 'PIX',
      due_days: 0,
      is_active: true,
      created_at: now,
      updated_at: now,
    }));

    await queryInterface.bulkInsert('price_catalog', [...appointmentRows, ...examRows], {});
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('price_catalog', 'uq_price_catalog_kind_code');
    await queryInterface.removeIndex('price_catalog', 'idx_price_catalog_kind_active');
    await queryInterface.dropTable('price_catalog');
  },
};
