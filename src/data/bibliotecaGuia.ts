import type { Fuente } from './biblioteca'

// «¿Psicología o psiquiatría?» y «Así cambió el nombre», de la Biblioteca. Las opciones públicas y
// los costos se revisaron en octubre de 2026: cambian, así que conviene revisarlos cada 6 meses.

type Guia = {
  urgente: string
  quien: { id: string; titulo: string; que: string; cuando: string; fuentes: Fuente[] }[]
  primeraCita: string[]
  llevar: string[]
  opciones: { nombre: string; como: string; costo: string; url?: string }[]
  costos: string
  fuentes: Fuente[]
  nombres: { antes: string; ahora: string; cuando: string; porque: string; fuentes: Fuente[] }[]
}

export const GUIA: Guia = {
  urgente: 'No esperes cita si alguien puede hacerse daño o dañar a otra persona, piensa en morir y tiene un plan, de pronto tiene mucha confusión, oye o ve cosas que le asustan, o consumió algo y se ve mal. Llama al 911 o ve a urgencias. Para hablar ya: Línea de la Vida, 800 911 2000.',
  quien: [
    {
      id: 'psicologia',
      titulo: 'Psicología',
      que: 'Te escucha, evalúa lo que pasa y da terapia: aprendes formas de manejar lo que sientes, piensas y haces. En México no puede recetar medicamentos; eso lo hace un médico.',
      cuando: 'Cuando algo te pesa desde hace semanas, te cuesta con la escuela, el trabajo o tu gente, o quieres aprender a manejar la ansiedad, la tristeza o un duelo. Muchas veces es un buen primer paso.',
      fuentes: [
        {
          texto: 'Ley General de Salud, art. 28 Bis (texto vigente, última reforma DOF 15-01-2026): enumera quiénes pueden prescribir medicamentos; la psicología no está en la lista.',
          url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LGS.pdf',
        },
        {
          texto: 'Child Mind Institute. Guía de especialistas en salud mental (psicólogos: no son médicos y no pueden recetar; usan terapias con evidencia).',
          url: 'https://childmind.org/es/guia/guia-de-especialistas-en-salud-mental/',
        },
      ],
    },
    {
      id: 'psiquiatria',
      titulo: 'Psiquiatría',
      que: 'Quien la ejerce estudió medicina y se especializó en salud mental. Revisa también tu salud física, puede diagnosticar y, si hace falta, recetar medicamento y darle seguimiento. Muchas veces trabaja junto con psicología.',
      cuando: 'Cuando el malestar es muy fuerte o no mejora con terapia, hay cambios grandes de ánimo, sueño o energía, se oyen o ven cosas que otras personas no, o ya tomas medicamento y hay que revisarlo.',
      fuentes: [
        {
          texto: 'Ley General de Salud, art. 28 Bis: los médicos pueden prescribir medicamentos.',
          url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LGS.pdf',
        },
        {
          texto: 'Child Mind Institute. Guía de especialistas en salud mental (psiquiatras: médicos; buscar uno cuando puede hacer falta medicamento; suelen trabajar con psicología).',
          url: 'https://childmind.org/es/guia/guia-de-especialistas-en-salud-mental/',
        },
        {
          texto: 'NHS. Mental health assessments (la valoración la suele hacer psiquiatría).',
          url: 'https://www.nhs.uk/mental-health/nhs-voluntary-charity-services/nhs-services/mental-health-assessments',
        },
      ],
    },
    {
      id: 'medicina-general',
      titulo: 'Medicina general (primer contacto)',
      que: 'Tu médico familiar o del centro de salud te escucha, revisa si algo del cuerpo o algún medicamento influye y, si hace falta, te manda a psicología o psiquiatría. En el IMSS es la puerta de entrada.',
      cuando: 'Si no sabes por dónde empezar, no te alcanza para consulta privada o tienes seguro social. Puedes contarlo aunque vayas por otra cosa.',
      fuentes: [
        {
          texto: 'NIMH. Consejos sobre cómo hablar con su proveedor de atención médica sobre su salud mental (NIH 22-MH-8094S): si no sabe por dónde empezar, hable con su médico de atención primaria, que puede referirle.',
          url: 'https://www.nimh.nih.gov/health/publications/espanol/consejos-para-hablar-con-su-proveedor',
        },
        {
          texto: 'IMSS. Comunicado 543/2026 (15-10-2026): el médico familiar hace la valoración inicial y puede solicitar Psicología o referir a Psiquiatría.',
          url: 'https://www.imss.gob.mx/prensa/archivo/202610/543',
        },
      ],
    },
    {
      id: 'infancia',
      titulo: 'Paidopsiquiatría y psicología infantil',
      que: 'La paidopsiquiatría es psiquiatría para niñas, niños y adolescentes, con formación extra en esas edades; puede recetar si hace falta. La psicología infantil da terapia adaptada a la edad.',
      cuando: 'Si una niña, niño o adolescente cambia mucho su conducta, su sueño o su forma de comer, o ya no quiere ir a la escuela. Muchas veces se empieza con el pediatra, que puede mandar a especialistas.',
      fuentes: [
        {
          texto: 'Child Mind Institute. Guía de especialistas en salud mental (psiquiatras de niños y adolescentes; el pediatra suele ser el primer contacto).',
          url: 'https://childmind.org/es/guia/guia-de-especialistas-en-salud-mental/',
        },
        {
          texto: 'CONASAMA (10-01-2024). Hospital Psiquiátrico Infantil «Juan N. Navarro», parte de su red de hospitales.',
          url: 'https://www.gob.mx/conasama/prensa/en-2023-conasama-atiende-mas-de-339-mil-personas-en-salud-mental-y-consumo-de-sustancias',
        },
      ],
    },
  ],
  primeraCita: [
    'No es un examen: es una plática para entender qué te pasa y qué ayuda necesitas.',
    'Te preguntarán qué sientes, desde cuándo, qué tan fuerte y qué tan seguido.',
    'También cómo duermes y comes, y cómo van la escuela o el trabajo, el dinero, tu casa y tu gente.',
    'Suelen preguntar por tu salud física, tus medicamentos y si consumes alcohol u otras sustancias.',
    'Pueden preguntarte si has pensado en hacerte daño. Es parte de la plática y sirve para cuidarte.',
    'Lo que cuentas es privado. Si tienes dudas de quién se entera, pregúntalo al inicio.',
    'También te preguntarán qué te ayuda y qué esperas. Tú puedes preguntar todo lo que quieras.',
  ],
  llevar: [
    'Lo que sientes, por escrito: desde cuándo, qué tan fuerte y qué tan seguido.',
    'La lista de todo lo que tomas: medicamentos, vitaminas, tés o suplementos.',
    'Si alguien de tu familia ha tenido problemas de salud mental.',
    'Cambios o golpes recientes: pérdidas, mudanzas, problemas en casa, la escuela o el trabajo.',
    'Tus preguntas anotadas, para que no se te olviden.',
    'Si quieres, una persona de confianza que te acompañe y te ayude a tomar notas.',
  ],
  opciones: [
    {
      nombre: 'IMSS (si tienes seguro)',
      como: 'Ve a tu Unidad de Medicina Familiar (UMF). Tu médico familiar te valora y, si hace falta, te manda a psicología o a psiquiatría. Para orientación por teléfono: 800 2222 668, opción 4.',
      costo: 'Sin costo para derechohabientes',
      url: 'https://www.imss.gob.mx/prensa/archivo/202610/543',
    },
    {
      nombre: 'ISSSTE (si tienes seguro)',
      como: 'Empieza en tu clínica o unidad de medicina familiar y cuenta lo que te pasa; desde ahí te pueden referir a psicología o psiquiatría. En CDMX está su Clínica de Especialidades de Neuropsiquiatría.',
      costo: 'Sin costo para derechohabientes',
      url: 'https://www.sdpnoticias.com/estados/issste-recomienda-atender-la-salud-mental-con-profesionales/',
    },
    {
      nombre: 'IMSS-Bienestar y centros de salud (sin seguridad social)',
      como: 'Si no tienes IMSS ni ISSSTE, ve a tu centro de salud. Ahí te pueden atender o mandar a un servicio especializado en salud mental. En el portal de IMSS-Bienestar te puedes registrar con tu CURP.',
      costo: 'Gratuito para personas sin seguridad social',
      url: 'https://www.cronica.com.mx/nacional/2026/08/19/imss-bienestar-2026-requisitos-como-y-donde-registrarte/',
    },
    {
      nombre: 'Centros Comunitarios de Salud Mental y Adicciones (CECOSAMA)',
      como: 'Dan orientación y tratamiento para depresión, ansiedad, consumo de sustancias y más, y apoyo a la familia. Algunos piden referencia del centro de salud, CURP y comprobante de domicilio. Para ubicar el tuyo, llama a la Línea de la Vida.',
      costo: 'Gratuito para personas sin seguridad social',
      url: 'https://www.gob.mx/conasama/prensa/en-2023-conasama-atiende-mas-de-339-mil-personas-en-salud-mental-y-consumo-de-sustancias',
    },
    {
      nombre: 'Línea de la Vida',
      como: 'Llama al 800 911 2000 desde celular o fijo. Te escuchan, te dan apoyo si estás en crisis y, si hace falta, te mandan a un servicio cercano. También orienta sobre alcohol y otras sustancias.',
      costo: 'Gratuita, las 24 horas, los 365 días',
      url: 'https://www.gob.mx/conasama/articulos/linea-de-la-vida-800-911-2000',
    },
    {
      nombre: 'SAPTEL',
      como: 'Llama al 55 5259 8121. Es apoyo psicológico e intervención en crisis por teléfono. Es un número de CDMX: desde otros estados marca los 10 dígitos.',
      costo: 'Gratuito, las 24 horas',
      url: 'https://www.saptel.org.mx/',
    },
    {
      nombre: 'Centros de Integración Juvenil (CIJ)',
      como: 'Prevención y tratamiento por consumo de alcohol y otras drogas, y también atención en salud mental, con unidades en todo el país. Informes: 55 5212 1212.',
      costo: 'La orientación a distancia es gratuita; pregunta el costo del tratamiento en tu unidad',
      url: 'https://www.gob.mx/salud/cij',
    },
    {
      nombre: 'Facultades de psicología (por ejemplo, UNAM)',
      como: 'La Facultad de Psicología de la UNAM tiene una línea de atención a distancia: 55 5025 0855, de lunes a viernes de 9 a 18 h, y centros con atención de estudiantes supervisados. Muchas universidades de los estados tienen clínicas parecidas.',
      costo: 'La línea es gratuita; pregunta el costo de la atención presencial',
      url: 'https://www.psicologia.unam.mx/centros-de-formacion/',
    },
    {
      nombre: 'Hospital Psiquiátrico Fray Bernardino Álvarez (CDMX)',
      como: 'Hospital público para personas adultas, en Tlalpan. Tiene urgencias para síntomas graves o que empezaron hace poco, o cuando hay riesgo para la vida. Tel. 55 5487 4271. Para menores de edad: Hospital Psiquiátrico Infantil Juan N. Navarro, 55 5573 2486.',
      costo: 'Gratuito para personas sin seguridad social',
      url: 'https://www.gob.mx/conasama/prensa/en-2023-conasama-atiende-mas-de-339-mil-personas-en-salud-mental-y-consumo-de-sustancias',
    },
    {
      nombre: 'Instituto Nacional de Psiquiatría Ramón de la Fuente Muñiz (CDMX)',
      como: 'Instituto de alta especialidad, en Tlalpan. La primera vez se entra por el servicio de Preconsulta, que hace una valoración inicial. Informes: 55 4160 5372.',
      costo: 'Pregunta por los costos al llamar',
      url: 'https://www.inprf.gob.mx/',
    },
  ],
  costos: 'Como orientación, con precios de 2026 que cambian mucho según la ciudad: una sesión privada de psicología suele costar entre 500 y 1,500 pesos, y en línea desde unos 350. Una primera consulta privada de psiquiatría suele ir de 1,500 a 3,500 pesos; las de seguimiento cuestan menos. Pregunta antes de agendar.',
  fuentes: [
    {
      texto: 'CONASAMA. Detengamos el suicidio: «Si es una urgencia, no lo dudes, marca al 911»; Línea de la Vida 800 911 2000.',
      url: 'https://www.gob.mx/conasama/articulos/detengamos-el-suicidio?idiom=es',
    },
    {
      texto: 'CONASAMA (10-01-2024). Los hospitales psiquiátricos tienen urgencias para síntomas graves, de inicio reciente o conductas que ponen en riesgo la vida o la seguridad.',
      url: 'https://www.gob.mx/conasama/prensa/en-2023-conasama-atiende-mas-de-339-mil-personas-en-salud-mental-y-consumo-de-sustancias',
    },
    {
      texto: 'NIMH. Consejos sobre cómo hablar con su proveedor de atención médica sobre su salud mental (lista de medicamentos y suplementos, historia familiar, síntomas, estrés reciente, preguntas, acompañante, confidencialidad).',
      url: 'https://www.nimh.nih.gov/health/publications/espanol/consejos-para-hablar-con-su-proveedor',
    },
    {
      texto: 'NHS. Mental health assessments (no es un examen; temas: síntomas, salud física, vivienda, dinero, trabajo, relaciones, alcohol y drogas, seguridad, fortalezas y esperanzas; puedes llevar a alguien y notas).',
      url: 'https://www.nhs.uk/mental-health/nhs-voluntary-charity-services/nhs-services/mental-health-assessments',
    },
    {
      texto: 'IMSS. Comunicado 543/2026 (15-10-2026): ruta por el médico familiar y Servicio de Orientación Telefónica en Salud Mental 800 2222 668, opción 4.',
      url: 'https://www.imss.gob.mx/prensa/archivo/202610/543',
    },
    {
      texto: 'SDP Noticias (11-10-2026). ISSSTE recomienda atender la salud mental con profesionales (Clínica de Especialidades de Neuropsiquiatría: psiquiatría, paidopsiquiatría y psicología; 26,309 consultas en 2026).',
      url: 'https://www.sdpnoticias.com/estados/issste-recomienda-atender-la-salud-mental-con-profesionales/',
    },
    {
      texto: 'La Crónica de Hoy (19-08-2026). IMSS-Bienestar 2026: requisitos (gratuito para personas sin seguridad social; registro en línea con CURP).',
      url: 'https://www.cronica.com.mx/nacional/2026/08/19/imss-bienestar-2026-requisitos-como-y-donde-registrarte/',
    },
    {
      texto: 'El Imparcial (11-10-2024). IMSS-Bienestar consolida la salud mental como derecho humano (Unemes, Cecosamas y hospitales psiquiátricos, atención gratuita).',
      url: 'https://www.elimparcial.com/mexico/2024/10/11/imss-bienestar-consolida-la-salud-mental-como-derecho-humano-en-mexico/',
    },
    {
      texto: 'CONASAMA (10-01-2024). En 2023, Conasama atiende más de 339 mil personas (341 Cecosama gratuitos sin seguridad social; hospitales Fray Bernardino Álvarez, Samuel Ramírez Moreno y Juan N. Navarro con urgencias).',
      url: 'https://www.gob.mx/conasama/prensa/en-2023-conasama-atiende-mas-de-339-mil-personas-en-salud-mental-y-consumo-de-sustancias',
    },
    {
      texto: 'CONASAMA (23-10-2025). La Línea de la Vida, te escucha: 800 911 2000, gratuita, 24 h, 365 días.',
      url: 'https://www.gob.mx/conasama/articulos/linea-de-la-vida-800-911-2000',
    },
    {
      texto: 'SAPTEL. Sitio oficial: (55) 5259-8121, 24 horas, servicio gratuito.',
      url: 'https://www.saptel.org.mx/',
    },
    {
      texto: 'CIJ en gob.mx: 120 unidades, prevención, tratamiento y rehabilitación.',
      url: 'https://www.gob.mx/salud/cij/que-hacemos',
    },
    {
      texto: 'Facultad de Psicología UNAM. Centros de Formación y Servicios Psicológicos y Programa de Atención Psicológica a Distancia (55 5025 0855, L-V 9-18 h).',
      url: 'https://www.psicologia.unam.mx/centros-de-formacion/',
    },
    {
      texto: 'Defensoría de los Derechos Universitarios UAM. Directorio de instituciones que ofrecen atención psicológica gratuita o de bajo costo (actualizado abril de 2026): teléfonos de CIJ, INPRF, Fray Bernardino, Juan N. Navarro, SAPTEL, UNAM y requisitos del CECOSAMA Iztapalapa.',
      url: 'https://defensoria.uam.mx/wp-content/uploads/Directorio-apoyo-psicologico-2026.pdf',
    },
    {
      texto: 'INPRF. Servicio de Preconsulta: información para quienes acuden por primera vez (informes 55 4160 5372).',
      url: 'https://inprf.gob.mx/transparencia/archivos/pdfs/preconsulta_2024.pdf',
    },
    {
      texto: '¿Cuánto me cuesta? Psicólogo privado en México (precios actualizados abril de 2026; estimaciones, sin muestra declarada).',
      url: 'https://cuantomecuesta.com/mx/psicologo-privado/',
    },
    {
      texto: '¿Cuánto me cuesta? Psiquiatra privado en México (abril de 2026; dice haber consultado a 15 psiquiatras privados).',
      url: 'https://cuantomecuesta.com/mx/psiquiatra-privado/',
    },
    {
      texto: 'Posta Durango (22-01-2026). Esto cuesta una cita con el psicólogo en Durango en 2026: entre 500 y 700 pesos por sesión.',
      url: 'https://www.posta.com.mx/durango/esto-cuesta-una-cita-con-el-psicologo-de-durango-en-el-2026/vl2154588',
    },
  ],
  nombres: [
    {
      antes: 'Retraso mental',
      ahora: 'Discapacidad intelectual',
      cuando: 'Ley de Rosa en EE. UU. (2010); DSM-5 (2013)',
      porque: 'El nombre viejo se había vuelto ofensivo y se usaba como insulto; el nuevo describe la condición y no hiere a la persona.',
      fuentes: [
        {
          texto: 'Public Law 111-256, «Rosa\'s Law» (5-10-2010): sustituye «mental retardation» por «intellectual disability» en la ley federal.',
          url: 'https://www.govinfo.gov/content/pkg/PLAW-111publ256/html/PLAW-111publ256.htm',
        },
        {
          texto: 'Federal Register 78(148), 1-08-2013 (SSA): la APA reemplazó el término en el DSM-5; el viejo «tiene connotaciones negativas» y «se volvió ofensivo para muchas personas».',
          url: 'https://www.govinfo.gov/content/pkg/FR-2013-08-01/html/2013-18552.htm',
        },
      ],
    },
    {
      antes: 'Histeria',
      ahora: 'Trastorno neurológico funcional',
      cuando: 'Se fue dejando desde el DSM-III (1980); el DSM-5 (2013) agregó el nombre «trastorno de síntomas neurológicos funcionales»',
      porque: '«Histeria» viene de la palabra griega para útero y se volvió una palabra para burlarse. El nombre nuevo dice lo que pasa: el cerebro y el cuerpo no se están comunicando bien.',
      fuentes: [
        {
          texto: 'North, C. S. (2015). The Classification of Hysteria and Related Disorders: Historical and Phenomenological Considerations. Behavioral Sciences, 5(4), 496-517 (origen en «hystera», útero; término «peyorativo»; subtítulo nuevo en DSM-5).',
          url: 'https://doi.org/10.3390/bs5040496',
        },
        {
          texto: 'MedlinePlus en español. Trastorno funcional neurológico (nombres alternativos: trastorno de conversión; la comunicación entre el cerebro y el cuerpo no funciona bien).',
          url: 'https://medlineplus.gov/spanish/ency/article/000954.htm',
        },
      ],
    },
    {
      antes: 'La homosexualidad como «trastorno»',
      ahora: 'No es un diagnóstico: es una orientación sexual',
      cuando: 'Asociación Psiquiátrica Estadounidense, diciembre de 1973; OMS, 17 de mayo de 1990',
      porque: 'La evidencia mostró que no es una enfermedad ni algo que haya que «curar». Por eso el 17 de mayo es el día contra la homofobia.',
      fuentes: [
        {
          texto: 'Drescher, J. (2015). Out of DSM: Depathologizing Homosexuality. Behavioral Sciences, 5(4), 565-575.',
          url: 'https://doi.org/10.3390/bs5040565',
        },
        {
          texto: 'CONAVIM, gob.mx (17-05-2016). Día Nacional de la Lucha contra la Homofobia: el 17 de mayo de 1990 la OMS eliminó la homosexualidad de su clasificación de enfermedades mentales.',
          url: 'https://www.gob.mx/conavim/articulos/dia-nacional-de-la-lucha-contra-la-homofobia-31642',
        },
      ],
    },
    {
      antes: 'Transexualismo y trastorno de identidad de género',
      ahora: 'Incongruencia de género, fuera de los trastornos mentales',
      cuando: 'CIE-11 de la OMS (aprobada en 2019, vigente desde 2022)',
      porque: 'La OMS explicó que las identidades trans no son trastornos mentales y que llamarlas así causaba un estigma enorme. Se dejó un código para que se pueda recibir atención de salud.',
      fuentes: [
        {
          texto: 'OMS. Gender incongruence and transgender health in the ICD (preguntas frecuentes).',
          url: 'https://www.who.int/standards/classifications/frequently-asked-questions/gender-incongruence-and-transgender-health-in-the-icd',
        },
        {
          texto: 'OMS. ICD-11 Implementation: la CIE-11 entró en vigor el 1 de enero de 2022.',
          url: 'https://www.who.int/standards/classifications/frequently-asked-questions/icd-11-implementation',
        },
      ],
    },
    {
      antes: '«Enfermedad de la mente dividida» (esquizofrenia, en Japón)',
      ahora: '«Trastorno de integración»',
      cuando: 'Japón, 2002',
      porque: 'Se cambió para bajar el estigma. El nombre viejo casi desapareció de los periódicos, pero las noticias siguieron ligándolo al crimen: cambiar el nombre ayuda, pero no basta.',
      fuentes: [
        {
          texto: 'Koike, S., et al. (2016). Effect of Name Change of Schizophrenia on Mass Media Between 1985 and 2013 in Japan. Schizophrenia Bulletin, 42(3), 552-559.',
          url: 'https://doi.org/10.1093/schbul/sbv159',
        },
        {
          texto: 'Universidad de Tokio. Resumen del estudio: el término viejo casi desapareció después de 2004; los titulares ligados al crimen no cambiaron.',
          url: 'https://www.u-tokyo.ac.jp/focus/en/articles/a_00432.html',
        },
      ],
    },
    {
      antes: '«Abuso» y «dependencia» de sustancias; «adicto»',
      ahora: 'Trastorno por consumo de sustancias; «una persona con…»',
      cuando: 'DSM-5 (2013) unió abuso y dependencia; guías de lenguaje como la del NIDA',
      porque: '«Abuso» suena a culpa y castigo. Nombrar primero a la persona deja claro que es un problema de salud, y el estigma hace que menos gente busque tratamiento.',
      fuentes: [
        {
          texto: 'Hasin, D. S., et al. (2013). DSM-5 Criteria for Substance Use Disorders: Recommendations and Rationale. American Journal of Psychiatry, 170(8), 834-851.',
          url: 'https://pubmed.ncbi.nlm.nih.gov/23903334/',
        },
        {
          texto: 'NIDA (2021). Las palabras importan: términos preferidos al hablar de la adicción.',
          url: 'https://nida.nih.gov/es/informacion-sobre-drogas/la-ciencia-de-la-adiccion/las-palabras-importan-terminos-preferidos-al-hablar-de-adiccion',
        },
      ],
    },
    {
      antes: '«Cometer suicidio»',
      ahora: '«Murió por suicidio»',
      cuando: 'Guías de lenguaje actuales sobre suicidio (por ejemplo, IASP, 2023)',
      porque: '«Cometer» se usa para delitos, y esa idea estigmatiza. «Murió por suicidio» habla de una muerte, no de una culpa.',
      fuentes: [
        {
          texto: 'IASP Asia Pacific Regional Forum (2023). Language Guidelines: evitar «commit» por su asociación con el crimen; usar «died by suicide».',
          url: 'https://www.iasp.info/wp-content/uploads/APRF-Language-Guidelines-1.pdf',
        },
      ],
    },
    {
      antes: 'Psicosis maniaco-depresiva',
      ahora: 'Trastorno bipolar',
      cuando: 'DSM-III (1980)',
      porque: 'El nombre nuevo describe el patrón: el ánimo se mueve entre dos polos. Y deja atrás «maniaco», una palabra que mucha gente usa como insulto.',
      fuentes: [
        {
          texto: 'Mason, B. L., Brown, E. S., & Croarkin, P. E. (2016). Historical Underpinnings of Bipolar Disorder Diagnostic Criteria. Behavioral Sciences, 6(3), 14 (el DSM-III de 1980 da forma al diagnóstico «ahora llamado» trastorno bipolar).',
          url: 'https://doi.org/10.3390/bs6030014',
        },
      ],
    },
  ],
}
