export const scales = ['analytical', 'technical', 'creative', 'social', 'enterprising', 'organizing', 'practical'];

const q = (ru, kk, en, fr, scale) => ({ text: { ru, kk, en, fr }, weights: { [scale]: 1 } });

const raw = [
  q('Искать закономерности в таблицах, фактах или событиях', 'Кестелерден, деректерден немесе оқиғалардан заңдылық іздеу', 'Look for patterns in data, facts, or events', 'Chercher des tendances dans des données, des faits ou des événements', 'analytical'),
  q('Разобраться, почему результат получился именно таким', 'Нәтиженің неге дәл осылай шыққанын анықтау', 'Figure out why a result turned out the way it did', 'Comprendre pourquoi un résultat est arrivé ainsi', 'analytical'),
  q('Сравнить несколько источников и проверить, кому можно верить', 'Бірнеше дереккөзді салыстырып, қайсысына сенуге болатынын тексеру', 'Compare sources and check which ones are trustworthy', 'Comparer plusieurs sources et vérifier lesquelles sont fiables', 'analytical'),
  q('Решать задачи, где ответ можно проверить', 'Жауабын тексеруге болатын есептерді шешу', 'Solve problems with an answer you can verify', 'Résoudre des problèmes dont on peut vérifier la réponse', 'analytical'),
  q('Строить прогноз на основе прошлых данных', 'Өткен деректерге сүйеніп болжам жасау', 'Make a forecast from past data', 'Faire une prévision à partir de données passées', 'analytical'),
  q('Найти слабое место в плане до того, как оно станет проблемой', 'Жоспардағы әлсіз тұсты мәселе болмай тұрып табу', 'Find a weak point in a plan before it becomes a problem', 'Repérer un point faible avant qu’il ne devienne un problème', 'analytical'),
  q('Разобраться, как устроено устройство, программа или система', 'Құрылғының, бағдарламаның немесе жүйенің қалай жұмыс істейтінін түсіну', 'Understand how a device, program, or system works', 'Comprendre le fonctionnement d’un appareil, d’un logiciel ou d’un système', 'technical'),
  q('Настроить технику или программу, чтобы всё работало надёжно', 'Техника не бағдарламаны тұрақты жұмыс істейтіндей баптау', 'Configure equipment or software so it works reliably', 'Régler un appareil ou un logiciel pour qu’il fonctionne de façon fiable', 'technical'),
  q('Собрать простое устройство по схеме', 'Қарапайым құрылғыны сызба бойынша жинау', 'Build a simple device from a diagram', 'Assembler un dispositif simple à partir d’un schéma', 'technical'),
  q('Автоматизировать повторяющееся действие', 'Қайталанатын әрекетті автоматтандыру', 'Automate a repetitive task', 'Automatiser une tâche répétitive', 'technical'),
  q('Найти и исправить техническую неисправность', 'Техникалық ақауды тауып, түзету', 'Find and fix a technical fault', 'Trouver et corriger une panne technique', 'technical'),
  q('Улучшить конструкцию, код или процесс, чтобы он выдерживал нагрузку', 'Құрылым, код немесе үдерісті жүктемеге төзімді ету', 'Improve a design, codebase, or process so it handles stress', 'Améliorer une conception, du code ou un processus pour qu’il résiste à la charge', 'technical'),
  q('Придумать несколько необычных способов решить одну задачу', 'Бір тапсырманы шешудің бірнеше ерекше жолын ойлап табу', 'Invent several unusual ways to solve one problem', 'Imaginer plusieurs façons originales de résoudre un problème', 'creative'),
  q('Создать текст, изображение, музыку или видео', 'Мәтін, сурет, музыка немесе видео жасау', 'Create text, an image, music, or video', 'Créer un texte, une image, de la musique ou une vidéo', 'creative'),
  q('Придумать название, образ или историю для проекта', 'Жобаға атау, бейне немесе оқиға ойлап табу', 'Create a name, visual identity, or story for a project', 'Imaginer un nom, une identité ou une histoire pour un projet', 'creative'),
  q('Переделать привычную вещь так, чтобы она выглядела по-новому', 'Таныс затты жаңа көрінетіндей етіп өзгерту', 'Redesign something familiar so it feels new', 'Repenser un objet familier pour lui donner un aspect nouveau', 'creative'),
  q('Собрать настроение с помощью цвета, формы, звука или слов', 'Түс, пішін, дыбыс немесе сөз арқылы көңіл күй жасау', 'Build a mood with color, form, sound, or words', 'Créer une ambiance avec la couleur, la forme, le son ou les mots', 'creative'),
  q('Экспериментировать, даже если первая версия получится неровной', 'Алғашқы нұсқа мінсіз болмаса да тәжірибе жасау', 'Experiment even if the first version is rough', 'Expérimenter même si la première version est imparfaite', 'creative'),
  q('Объяснить человеку сложную тему простыми словами', 'Күрделі тақырыпты адамға қарапайым сөзбен түсіндіру', 'Explain a difficult topic in plain language', 'Expliquer un sujet difficile avec des mots simples', 'social'),
  q('Помочь человеку освоиться в новой группе или на новой работе', 'Адамға жаңа топта немесе жұмыста бейімделуге көмектесу', 'Help someone settle into a new group or job', 'Aider une personne à s’intégrer dans un nouveau groupe ou emploi', 'social'),
  q('Выслушать две стороны и помочь им договориться', 'Екі тарапты тыңдап, келісуге көмектесу', 'Listen to both sides and help them reach agreement', 'Écouter les deux côtés et les aider à trouver un accord', 'social'),
  q('Провести занятие, консультацию или полезную встречу', 'Сабақ, кеңес немесе пайдалы кездесу өткізу', 'Run a lesson, consultation, or useful meeting', 'Animer un cours, une consultation ou une réunion utile', 'social'),
  q('Узнать, что человеку действительно нужно, а не только что он просит', 'Адамның сұрағанынан бөлек, шын мәнінде не қажет екенін түсіну', 'Find out what someone truly needs, beyond what they first ask for', 'Comprendre ce dont une personne a vraiment besoin au-delà de sa demande initiale', 'social'),
  q('Сделать так, чтобы в группе спокойнее общались и слышали друг друга', 'Топта адамдардың бір-бірін тыныш тыңдауына көмектесу', 'Help a group communicate calmly and hear one another', 'Aider un groupe à communiquer calmement et à s’écouter', 'social'),
  q('Представить идею незнакомой аудитории', 'Идеяны бейтаныс аудиторияға таныстыру', 'Present an idea to an unfamiliar audience', 'Présenter une idée à un public inconnu', 'enterprising'),
  q('Договориться об условиях, выгодных для обеих сторон', 'Екі жаққа да тиімді шарттар туралы келісу', 'Negotiate terms that work for both sides', 'Négocier des conditions utiles aux deux parties', 'enterprising'),
  q('Запустить небольшой проект и найти первых клиентов или участников', 'Шағын жобаны іске қосып, алғашқы клиенттерді не қатысушыларды табу', 'Launch a small project and find its first customers or participants', 'Lancer un petit projet et trouver ses premiers clients ou participants', 'enterprising'),
  q('Взять инициативу, когда никто не решается начать', 'Ешкім бастауға шешім қабылдамаған кезде бастама көтеру', 'Take initiative when nobody else wants to start', 'Prendre l’initiative quand personne n’ose commencer', 'enterprising'),
  q('Оценить возможность роста и решить, стоит ли рисковать', 'Өсу мүмкіндігін бағалап, тәуекелге бару керек пе екенін шешу', 'Assess a growth opportunity and decide whether it is worth the risk', 'Évaluer une occasion de croissance et décider si le risque vaut la peine', 'enterprising'),
  q('Убедить людей поддержать полезную идею', 'Адамдарды пайдалы идеяны қолдауға сендіру', 'Persuade people to support a useful idea', 'Convaincre des personnes de soutenir une idée utile', 'enterprising'),
  q('Разбить большую задачу на понятные шаги', 'Үлкен тапсырманы түсінікті қадамдарға бөлу', 'Break a large task into clear steps', 'Découper une grande tâche en étapes claires', 'organizing'),
  q('Следить за сроками и заранее замечать задержки', 'Мерзімді қадағалап, кідірісті алдын ала байқау', 'Track deadlines and notice delays early', 'Suivre les délais et repérer les retards à l’avance', 'organizing'),
  q('Навести порядок в файлах, документах или расписании', 'Файлдарда, құжаттарда немесе кестеде тәртіп орнату', 'Bring order to files, documents, or a schedule', 'Mettre de l’ordre dans des fichiers, documents ou un planning', 'organizing'),
  q('Распределить роли и ресурсы перед стартом проекта', 'Жоба басталмай тұрып рөлдер мен ресурстарды бөлу', 'Assign roles and resources before a project starts', 'Répartir les rôles et les ressources avant le début d’un projet', 'organizing'),
  q('Проверить качество результата по понятным критериям', 'Нәтиже сапасын түсінікті өлшемдермен тексеру', 'Check the quality of a result against clear criteria', 'Vérifier la qualité d’un résultat selon des critères clairs', 'organizing'),
  q('Улучшить повторяющийся процесс, чтобы было меньше ошибок', 'Қайталанатын үдерісті қате аз болатындай жақсарту', 'Improve a repeated process so it produces fewer errors', 'Améliorer un processus récurrent pour réduire les erreurs', 'organizing'),
  q('Сделать что-то руками и сразу увидеть результат', 'Қолмен бір нәрсе жасап, нәтижесін бірден көру', 'Make something with your hands and see the result right away', 'Fabriquer quelque chose de ses mains et voir le résultat tout de suite', 'practical'),
  q('Работать с инструментами, материалами или оборудованием', 'Құралдармен, материалдармен немесе жабдықпен жұмыс істеу', 'Work with tools, materials, or equipment', 'Travailler avec des outils, des matériaux ou du matériel', 'practical'),
  q('Провести день не за столом, а в мастерской, на объекте или в поле', 'Күнді үстел басында емес, шеберханада, нысанда немесе далада өткізу', 'Spend a day in a workshop, on site, or outdoors rather than at a desk', 'Passer une journée en atelier, sur le terrain ou dehors plutôt qu’à un bureau', 'practical'),
  q('Починить или обслужить вещь, которой будут пользоваться', 'Қолданылатын затты жөндеу немесе күтіп ұстау', 'Repair or maintain something people will use', 'Réparer ou entretenir quelque chose qui sera utilisé', 'practical'),
  q('Собрать, приготовить или изготовить готовый продукт', 'Дайын өнімді жинау, әзірлеу немесе жасау', 'Assemble, prepare, or make a finished product', 'Assembler, préparer ou fabriquer un produit fini', 'practical'),
  q('Быстро решить конкретную бытовую или рабочую проблему', 'Нақты тұрмыстық немесе жұмыс мәселесін тез шешу', 'Quickly solve a concrete practical or workplace problem', 'Résoudre rapidement un problème concret du quotidien ou du travail', 'practical')
];

const interleaved = Array.from({ length: 6 }, (_, round) => scales.map((_, scaleIndex) => raw[scaleIndex * 6 + round])).flat();
export const questions = interleaved.map((item, index) => ({ id: `career_${String(index + 1).padStart(3, '0')}`, ...item }));

export const profiles = {
  analytical: { emoji: '◫', color: '#5b5bd6' }, technical: { emoji: '⚙', color: '#3976c6' },
  creative: { emoji: '✦', color: '#a052c2' }, social: { emoji: '♡', color: '#2b9a83' },
  enterprising: { emoji: '↗', color: '#d77b31' }, organizing: { emoji: '✓', color: '#657389' },
  practical: { emoji: '⌁', color: '#3b8f54' }
};

const title = (ru, kk, en, fr) => ({ ru, kk, en, fr });
export const careers = [
  { id: 'data', title: title('Аналитик данных', 'Деректер талдаушысы', 'Data analyst', 'Analyste de données'), w: { analytical: 5, technical: 3, organizing: 2 } },
  { id: 'engineer', title: title('Инженер-разработчик', 'Инженер-әзірлеуші', 'Development engineer', 'Ingénieur de développement'), w: { technical: 5, analytical: 3, practical: 3 } },
  { id: 'software', title: title('Разработчик программ', 'Бағдарлама әзірлеуші', 'Software developer', 'Développeur logiciel'), w: { technical: 5, analytical: 4, creative: 2 } },
  { id: 'ux', title: title('UX/UI-дизайнер', 'UX/UI дизайнері', 'UX/UI designer', 'Designer UX/UI'), w: { creative: 5, social: 3, analytical: 2 } },
  { id: 'content', title: title('Редактор или контент-продюсер', 'Редактор немесе контент-продюсер', 'Editor or content producer', 'Éditeur ou producteur de contenu'), w: { creative: 5, social: 3, organizing: 2 } },
  { id: 'teacher', title: title('Преподаватель или методист', 'Оқытушы немесе әдіскер', 'Teacher or learning designer', 'Enseignant ou concepteur pédagogique'), w: { social: 5, organizing: 3, creative: 2 } },
  { id: 'psychologist', title: title('Психолог-консультант', 'Психолог-кеңесші', 'Counselling psychologist', 'Psychologue-conseil'), w: { social: 5, analytical: 2, organizing: 1 } },
  { id: 'product', title: title('Продакт-менеджер', 'Өнім менеджері', 'Product manager', 'Chef de produit'), w: { enterprising: 5, social: 3, analytical: 3, organizing: 3 } },
  { id: 'sales', title: title('B2B-продажи и партнёрства', 'B2B сату және серіктестік', 'B2B sales and partnerships', 'Vente B2B et partenariats'), w: { enterprising: 5, social: 4, organizing: 2 } },
  { id: 'entrepreneur', title: title('Предприниматель', 'Кәсіпкер', 'Entrepreneur', 'Entrepreneur'), w: { enterprising: 5, creative: 3, organizing: 3, social: 2 } },
  { id: 'project', title: title('Руководитель проектов', 'Жоба жетекшісі', 'Project manager', 'Chef de projet'), w: { organizing: 5, social: 3, enterprising: 3, analytical: 2 } },
  { id: 'logistics', title: title('Логист или операционный менеджер', 'Логист немесе операциялық менеджер', 'Logistics or operations manager', 'Responsable logistique ou opérations'), w: { organizing: 5, analytical: 3, practical: 2 } },
  { id: 'quality', title: title('Специалист по качеству', 'Сапа маманы', 'Quality specialist', 'Spécialiste qualité'), w: { organizing: 5, analytical: 4, technical: 2 } },
  { id: 'architect', title: title('Архитектор систем или решений', 'Жүйе немесе шешімдер сәулетшісі', 'Systems or solutions architect', 'Architecte systèmes ou solutions'), w: { technical: 5, analytical: 5, organizing: 2 } },
  { id: 'researcher', title: title('Исследователь', 'Зерттеуші', 'Researcher', 'Chercheur'), w: { analytical: 5, technical: 2, creative: 2 } },
  { id: 'craft', title: title('Мастер, технолог или ремесленник', 'Шебер, технолог немесе қолөнерші', 'Craftsperson or technologist', 'Artisan ou technologue'), w: { practical: 5, technical: 4, creative: 2 } },
  { id: 'field', title: title('Полевой специалист', 'Далалық маман', 'Field specialist', 'Spécialiste de terrain'), w: { practical: 5, technical: 3, social: 2 } },
  { id: 'hr', title: title('HR-партнёр или рекрутер', 'HR серіктес немесе рекрутер', 'HR partner or recruiter', 'Partenaire RH ou recruteur'), w: { social: 5, enterprising: 3, organizing: 3 } },
  { id: 'marketing', title: title('Маркетолог-стратег', 'Маркетинг стратегі', 'Marketing strategist', 'Stratège marketing'), w: { creative: 4, enterprising: 4, analytical: 3, social: 2 } },
  { id: 'service', title: title('Сервисный инженер', 'Сервис инженері', 'Service engineer', 'Ingénieur de maintenance'), w: { practical: 5, technical: 5, social: 2 } }
];
