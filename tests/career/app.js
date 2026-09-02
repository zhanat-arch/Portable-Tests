import { questions, profiles, scales, careers } from './data.js';
import '../../site-ui.js';

const ONLINE = globalThis.PT_CONFIG.onlineRoot;
const SUPPORT = { boosty: 'https://boosty.to/zhanat-arch', kofi: 'https://ko-fi.com/zhanat_arch' };
const supported = ['ru', 'kk', 'en', 'fr'];
const browserLang = (navigator.language || 'ru').toLowerCase().split('-')[0];
let lang = localStorage.getItem('pt.lang') || (supported.includes(browserLang) ? browserLang : 'ru');
let screen = 'intro';
let at = 0;
let answers = read('pt.career.v2.answers');

const enc = value => btoa(unescape(encodeURIComponent(JSON.stringify(value)))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const dec = value => { try { return JSON.parse(decodeURIComponent(escape(atob(value.replaceAll('-', '+').replaceAll('_', '/'))))); } catch { return null; } };
let sharedResult = dec(location.hash.startsWith('#r=') ? location.hash.slice(3) : '');
if (sharedResult?.test === 'career' && sharedResult.scores) { lang = supported.includes(sharedResult.lang) ? sharedResult.lang : lang; screen = 'result'; }
else {
  sharedResult = null;
  const launch = new URLSearchParams(location.search);
  const complete = questions.every(question => answers[question.id] !== undefined);
  if (launch.get('retake') === '1') {
    answers = {};
    localStorage.removeItem('pt.career.v2.answers');
    screen = 'quiz';
    history.replaceState(null, '', location.pathname);
  } else if (launch.get('view') === 'result' && complete) screen = 'result';
}

const UI = {
  ru: {
    introTitle: 'Какая работа будет заряжать, а не только кормить?', intro: '42 коротких действия без загадок и «правильных» ответов. Получите карту интересов, сочетание двух ведущих направлений и 10 профессий для проверки.', badge: '7 направлений · без ярлыков', privacy: 'Ответы остаются на этом устройстве', start: 'Собрать карту интересов', download: 'Скачать автономный HTML', q: 'действия', min: '≈ 6 минут', paths: 'направлений',
    instruction: 'Представьте, что навык уже есть. Насколько вам хотелось бы этим заниматься?', back: 'Назад', next: 'Дальше', of: 'из', choices: ['Точно не хочется', 'Скорее не хочется', 'Не знаю', 'Скорее хочется', 'Очень хочется'], milestones: ['Первый слой готов', 'Половина карты собрана', 'Осталось совсем немного'], continue: 'Продолжить',
    result: 'Ваша карта профессиональных интересов', shared: 'С вами поделились результатом', introResult: 'Это карта интереса к задачам, а не оценка способностей. Высокий балл означает «хочется делать чаще», низкий — «такой режим быстрее утомляет».', blend: 'Ваше рабочее сочетание', strength: 'Что здесь может стать силой', shadow: 'Где сочетание может мешать', environment: 'В какой среде легче раскрыться', experiment: 'Проверка за 7 дней', professions: '10 профессий для исследования', professionsNote: 'Индекс показывает сходство с вашим набором интересов, а не шанс устроиться или добиться успеха.', why: 'Почему в списке', energy: 'Что может забирать больше энергии', numbers: 'Как читать проценты', numbersText: 'Проценты показывают ваши ответы по каждой шкале. Они не сравнивают вас с другими людьми и не измеряют талант.', full: 'Показать все проценты', hide: 'Скрыть проценты', restart: 'Пройти заново', share: 'Поделиться результатом', copy: 'Скопировать ссылку', copied: 'Ссылка на результат скопирована', other: 'Другие тесты', support: '☕ Поддержать разработчика', supportText: 'Тест остаётся бесплатным. Если оказался полезным, можно угостить разработчика кофе или поделиться приложением.', close: 'Закрыть', delete: 'Удалить прогресс', disclaimer: 'Авторский ознакомительный тест. Не диагноз и не единственное основание для выбора учёбы или профессии. Лучше проверить 2–3 идеи короткими реальными пробами.', lowIntro: 'Задачи из этих направлений могут быть нормальными, но, вероятно, потребуют больше внешней мотивации:', fit: 'индекс совпадения', version: 'Portable Tests · карьерная карта 2.0', app: 'Portable Tests', home: 'На главную',
    labels: { analytical: 'Анализ и исследование', technical: 'Техника и системы', creative: 'Идеи и творчество', social: 'Люди и помощь', enterprising: 'Инициатива и влияние', organizing: 'Порядок и процессы', practical: 'Практика и видимый результат' },
    bands: ['низкий интерес', 'скорее утомляет', 'нейтрально', 'заметный интерес', 'сильный интерес']
  },
  kk: {
    introTitle: 'Қай жұмыс тек табыс емес, күш те береді?', intro: 'Жұмбақсыз және «дұрыс» жауабы жоқ 42 қысқа әрекет. Қызығушылық картасын, екі жетекші бағыттың үйлесімін және тексеруге болатын 10 кәсіпті алыңыз.', badge: '7 бағыт · бір ғана таңбасыз', privacy: 'Жауаптар осы құрылғыда қалады', start: 'Қызығушылық картасын жасау', download: 'Автономды HTML жүктеу', q: 'әрекет', min: '≈ 6 минут', paths: 'бағыт', instruction: 'Дағды бар деп елестетіңіз. Мұнымен айналысқыңыз келе ме?', back: 'Артқа', next: 'Әрі қарай', of: '/', choices: ['Мүлде қаламаймын', 'Көбіне қаламаймын', 'Білмеймін', 'Көбіне қалаймын', 'Өте қалаймын'], milestones: ['Бірінші бөлік дайын', 'Картаның жартысы дайын', 'Аз ғана қалды'], continue: 'Жалғастыру', result: 'Кәсіби қызығушылық картаңыз', shared: 'Сізбен нәтижені бөлісті', introResult: 'Бұл қабілет бағасы емес, тапсырмаларға қызығушылық картасы. Жоғары балл — «мұны жиірек істегім келеді», төмен балл — «бұл режим тез шаршатады».', blend: 'Жұмыс үйлесіміңіз', strength: 'Бұл неден күшке айналады', shadow: 'Қай жерде кедергі болуы мүмкін', environment: 'Қандай орта қолайлы', experiment: '7 күндік тексеріс', professions: 'Зерттеуге болатын 10 кәсіп', professionsNote: 'Индекс қызығушылықтарыңызбен ұқсастықты көрсетеді, жұмысқа орналасу не табыс ықтималдығын емес.', why: 'Неге тізімде', energy: 'Көбірек күш алуы мүмкін нәрсе', numbers: 'Пайыздарды қалай оқу керек', numbersText: 'Пайыздар әр бағыт бойынша жауаптарыңызды көрсетеді. Олар сізді басқалармен салыстырмайды және талантты өлшемейді.', full: 'Барлық пайызды көрсету', hide: 'Пайыздарды жасыру', restart: 'Қайта өту', share: 'Нәтижемен бөлісу', copy: 'Сілтемені көшіру', copied: 'Нәтиже сілтемесі көшірілді', other: 'Басқа тесттер', support: '☕ Әзірлеушіні қолдау', supportText: 'Тест тегін болып қалады. Пайдалы болса, әзірлеушіні кофемен қуанта аласыз немесе қолданбамен бөлісе аласыз.', close: 'Жабу', delete: 'Прогресті жою', disclaimer: 'Авторлық таныстыру тесті. Диагноз емес және оқу не кәсіп таңдаудың жалғыз негізі болмауы керек. 2–3 идеяны шағын тәжірибемен тексерген дұрыс.', lowIntro: 'Бұл бағыттардағы тапсырмалар орындалуы мүмкін, бірақ көбірек сыртқы ынта қажет болуы ықтимал:', fit: 'сәйкестік индексі', version: 'Portable Tests · мансап картасы 2.0', app: 'Portable Tests', home: 'Басты бет', labels: { analytical: 'Талдау және зерттеу', technical: 'Техника және жүйелер', creative: 'Идея және шығармашылық', social: 'Адамдар және көмек', enterprising: 'Бастама және ықпал', organizing: 'Тәртіп және үдерістер', practical: 'Практика және нақты нәтиже' }, bands: ['қызығушылық төмен', 'көбіне шаршатады', 'бейтарап', 'айқын қызығушылық', 'күшті қызығушылық']
  },
  en: {
    introTitle: 'Which work could energize you, not just pay you?', intro: '42 plain activities with no riddles or “right” answers. Get an interest map, your leading blend, and 10 careers worth testing.', badge: '7 directions · no single label', privacy: 'Answers stay on this device', start: 'Build my interest map', download: 'Download standalone HTML', q: 'activities', min: '≈ 6 minutes', paths: 'directions', instruction: 'Imagine you already have the skill. How much would you like doing this?', back: 'Back', next: 'Next', of: 'of', choices: ['Definitely not', 'Probably not', 'Not sure', 'Probably yes', 'Very much'], milestones: ['First layer complete', 'Half the map is ready', 'Almost there'], continue: 'Continue', result: 'Your career-interest map', shared: 'Someone shared this result with you', introResult: 'This maps interest in tasks, not ability. A high score means “I want more of this”; a low score means this mode may drain energy sooner.', blend: 'Your working blend', strength: 'How this can become a strength', shadow: 'Where the blend can get in your way', environment: 'An environment that may fit', experiment: 'A seven-day reality check', professions: '10 careers to investigate', professionsNote: 'The index shows similarity to your interests, not your odds of getting hired or succeeding.', why: 'Why it appears', energy: 'What may cost more energy', numbers: 'How to read the percentages', numbersText: 'Percentages summarize your answers on each scale. They do not compare you with other people or measure talent.', full: 'Show all percentages', hide: 'Hide percentages', restart: 'Take again', share: 'Share result', copy: 'Copy result link', copied: 'Result link copied', other: 'Other tests', support: '☕ Support the developer', supportText: 'The test stays free. If it helped, you can buy the developer a coffee or share the app.', close: 'Close', delete: 'Delete progress', disclaimer: 'An original exploratory questionnaire, not a diagnosis or the sole basis for education or career decisions. Test two or three ideas with small real-world experiments.', lowIntro: 'Tasks in these areas may still be manageable, but could require more external motivation:', fit: 'match index', version: 'Portable Tests · career map 2.0', app: 'Portable Tests', home: 'Home', labels: { analytical: 'Analysis and research', technical: 'Technology and systems', creative: 'Ideas and creativity', social: 'People and support', enterprising: 'Initiative and influence', organizing: 'Order and processes', practical: 'Hands-on visible results' }, bands: ['low interest', 'often draining', 'neutral', 'clear interest', 'strong interest']
  },
  fr: {
    introTitle: 'Quel travail pourrait vous donner de l’énergie ?', intro: '42 activités claires, sans énigmes ni « bonne » réponse. Obtenez votre carte d’intérêts, votre duo principal et 10 métiers à tester.', badge: '7 directions · pas une seule étiquette', privacy: 'Les réponses restent sur cet appareil', start: 'Créer ma carte', download: 'Télécharger le HTML autonome', q: 'activités', min: '≈ 6 minutes', paths: 'directions', instruction: 'Imaginez que vous maîtrisez déjà la compétence. Aimeriez-vous faire cela ?', back: 'Retour', next: 'Suivant', of: 'sur', choices: ['Certainement pas', 'Plutôt non', 'Je ne sais pas', 'Plutôt oui', 'Beaucoup'], milestones: ['Première partie terminée', 'La moitié de la carte est prête', 'Presque terminé'], continue: 'Continuer', result: 'Votre carte d’intérêts professionnels', shared: 'Ce résultat a été partagé avec vous', introResult: 'Cette carte mesure l’intérêt pour des tâches, pas les capacités. Un score élevé signifie « j’aimerais en faire plus » ; un score bas indique un mode potentiellement plus fatigant.', blend: 'Votre combinaison de travail', strength: 'Comment en faire une force', shadow: 'Quand la combinaison peut gêner', environment: 'Un environnement favorable', experiment: 'Un test réel en sept jours', professions: '10 métiers à explorer', professionsNote: 'L’indice mesure la proximité avec vos intérêts, pas vos chances d’être recruté ou de réussir.', why: 'Pourquoi ce métier', energy: 'Ce qui peut demander plus d’énergie', numbers: 'Comment lire les pourcentages', numbersText: 'Les pourcentages résument vos réponses. Ils ne vous comparent pas aux autres et ne mesurent pas le talent.', full: 'Afficher tous les pourcentages', hide: 'Masquer les pourcentages', restart: 'Recommencer', share: 'Partager le résultat', copy: 'Copier le lien', copied: 'Lien du résultat copié', other: 'Autres tests', support: '☕ Soutenir le développeur', supportText: 'Le test reste gratuit. S’il vous a aidé, vous pouvez offrir un café au développeur ou partager l’application.', close: 'Fermer', delete: 'Effacer la progression', disclaimer: 'Questionnaire exploratoire original, sans valeur diagnostique et insuffisant à lui seul pour décider d’études ou d’un métier. Testez deux ou trois idées par de petites expériences réelles.', lowIntro: 'Les tâches de ces domaines restent possibles, mais peuvent demander davantage de motivation extérieure :', fit: 'indice de proximité', version: 'Portable Tests · carte carrière 2.0', app: 'Portable Tests', home: 'Accueil', labels: { analytical: 'Analyse et recherche', technical: 'Technique et systèmes', creative: 'Idées et création', social: 'Personnes et aide', enterprising: 'Initiative et influence', organizing: 'Ordre et processus', practical: 'Pratique et résultat visible' }, bands: ['intérêt faible', 'souvent fatigant', 'neutre', 'intérêt marqué', 'intérêt fort']
  }
};

const COPY = {
  ru: {
    analytical: ['Разборщик сложного', 'Вы любите не угадывать, а разбираться: отделять факт от впечатления, искать причину и проверять вывод.', 'Ваша сила — превращать туманную проблему в понятную схему и замечать слабые места до того, как они станут дорогими.', 'Можно слишком долго улучшать модель и отложить решение. Полезный вопрос: «каких данных уже достаточно для следующего шага?»', 'Сложные задачи, доступ к фактам, время на сосредоточение и право задавать неудобные вопросы.', 'Возьмите открытый набор данных или спорное утверждение и за час соберите короткий вывод с тремя доказательствами.', 'аналитика, исследования, финансы, риск, аудит, стратегия', 'Можете найти логическую дыру даже в шутке. Иногда шутке лучше выжить.'],
    technical: ['Создатель работающих систем', 'Вас притягивает вопрос «как это устроено?» и удовольствие от момента, когда система наконец работает устойчиво.', 'Вы умеете соединять логику с конструкцией: диагностировать, настраивать и делать решение надёжнее.', 'Есть риск чинить красивую техническую задачу, забыв спросить, нужна ли она человеку. Сначала уточняйте критерий пользы.', 'Понятная техническая цель, доступ к инструментам, возможность тестировать и улучшать без лишнего шума.', 'Настройте маленькую автоматизацию, соберите устройство или исправьте реальную техническую проблему.', 'разработка, инженерия, автоматизация, архитектура систем, энергетика, сервис', 'Лучший аргумент для вас: «смотрите, оно работает».'],
    creative: ['Автор новых вариантов', 'Вам важна возможность придумать иначе и оставить в результате свой почерк — словом, формой, образом или идеей.', 'Вы видите несколько дверей там, где остальным показали одну, и умеете оживить пустой лист.', 'Поток идей может обгонять завершение. Ограничение по времени и один выбранный формат часто усиливают результат.', 'Свобода эксперимента, разнообразие задач, понятная аудитория и обратная связь без микроконтроля.', 'Сделайте маленький законченный материал за один вечер: постер, текст, ролик, прототип или сценарий.', 'дизайн, контент, медиа, бренд, сценарии, геймдизайн', 'Один вариант? Хорошо. Сейчас появятся ещё семь.'],
    social: ['Человеческий интерфейс', 'Вам важно не только выполнить задачу, но и понять человека: объяснить, поддержать, договориться, помочь освоиться.', 'Вы переводите сложное на понятный язык и замечаете потребности, которые люди не всегда формулируют прямо.', 'Чужие задачи могут незаметно съесть ваши границы. Помощь работает лучше, когда заранее понятны роль и предел ответственности.', 'Живой контакт, заметная польза, уважительная команда и возможность видеть, кому помог результат.', 'Проведите короткое объяснение, консультацию или волонтёрскую смену и запишите, что дало энергию, а что забрало.', 'образование, HR, психология, customer success, медицина, сообщества', 'Иногда лучшая автоматизация — нормально написать человеку.'],
    enterprising: ['Запускатель движения', 'Вас заряжает возможность повлиять на результат: представить идею, собрать поддержку, договориться и начать.', 'Вы быстрее многих переходите от «можно было бы» к первому разговору, предложению или запуску.', 'Скорость и азарт могут недооценить цену обещаний. Перед стартом полезно назвать риск, владельца и точку остановки.', 'Динамика, право принимать решения, видимый эффект и люди, с которыми можно договариваться напрямую.', 'Сформулируйте маленькое предложение и покажите его пяти реальным людям. Считайте ответы, а не комплименты.', 'предпринимательство, продажи, продукт, партнёрства, управление, growth', 'Можете увидеть бизнес-модель в обычной бытовой проблеме.'],
    organizing: ['Сборщик порядка', 'Вам приятен момент, когда хаос превращается в шаги, сроки, роли и понятный критерий готовности.', 'Вы помогаете команде не только начать, но и закончить — без потери деталей по дороге.', 'Порядок может стать самоцелью. Если чек-лист уже длиннее задачи, пора вернуть внимание к результату.', 'Ясные приоритеты, устойчивые процессы, право улучшать правила и команда, которая соблюдает договорённости.', 'Возьмите повторяющийся процесс и уберите из него один лишний шаг или одну частую ошибку.', 'операции, управление проектами, логистика, качество, администрирование', 'Вы знаете страшную тайну: дедлайн иногда можно выполнить.'],
    practical: ['Мастер конкретного результата', 'Вам легче включиться, когда задачу можно потрогать, проверить или увидеть в готовом виде.', 'Вы быстро возвращаете разговор к реальности: что именно нужно сделать, чем и какой результат должен работать.', 'Теория без немедленной пользы может раздражать, хотя иногда она экономит дорогую переделку. Оставляйте время на короткий план.', 'Инструменты под рукой, конкретная задача, движение, видимый итог и минимум бессмысленных встреч.', 'Сделайте или почините одну полезную вещь и оцените: понравился процесс, результат или и то и другое.', 'производство, сервис, ремесло, строительство, полевые работы, эксплуатация', 'После пятого созвона хочется молча взять инструмент и решить вопрос.']
  }
};

const genericCopy = {
  kk: {
    analytical: ['Күрделіні талдаушы', 'Сіз болжамнан гөрі тексеруді ұнатасыз: фактіні пікірден бөліп, себеп іздейсіз.', 'Күшіңіз — түсініксіз мәселені анық схемаға айналдыру.', 'Кейде модельді тым ұзақ жетілдіруге болады. Келесі қадамға қандай дерек жеткілікті екенін сұраңыз.', 'Күрделі міндет, дерекке қолжетімділік және тыныш ойлану уақыты.', 'Ашық дерек алып, бір сағатта үш дәлелі бар қысқа қорытынды жасаңыз.', 'талдау, зерттеу, қаржы, аудит, стратегия', 'Әзілден де логикалық қате таба аласыз. Әзілге кейде жеңілдік беріңіз.'],
    technical: ['Жұмыс істейтін жүйе жасаушы', 'Сізді «бұл қалай жұмыс істейді?» деген сұрақ және тұрақты нәтиже қызықтырады.', 'Күшіңіз — ақауды табу, баптау және сенімді шешім жасау.', 'Техникалық қызық міндеттің адамға қажет-қажет еместігін ұмытпау керек.', 'Нақты мақсат, құралдар және сынауға мүмкіндік.', 'Шағын автоматтандыру жасаңыз немесе нақты ақауды түзетіңіз.', 'әзірлеу, инженерия, автоматтандыру, жүйе сәулеті', 'Сіз үшін ең жақсы дәлел: «қараңыз, жұмыс істейді».'],
    creative: ['Жаңа нұсқа авторы', 'Сізге басқаша ойлап, нәтижеде өз қолтаңбаңызды қалдыру маңызды.', 'Күшіңіз — бір есіктің орнына бірнеше мүмкіндік көру.', 'Идеялар аяқтаудан озып кетуі мүмкін. Бір формат пен нақты мерзім көмектеседі.', 'Еркін тәжірибе, әртүрлі міндет және тірі кері байланыс.', 'Бір кеште шағын, бірақ аяқталған материал жасаңыз.', 'дизайн, контент, медиа, бренд, геймдизайн', 'Бір нұсқа ма? Қазір тағы жетеуі пайда болады.'],
    social: ['Адамдар арасындағы көпір', 'Сізге тапсырмамен бірге адамды түсіну де маңызды.', 'Күшіңіз — күрделіні қарапайым түсіндіру және адамдарды келістіру.', 'Өзгенің міндеті сіздің шекараңызды алып қоюы мүмкін.', 'Тірі байланыс, көрінетін пайда және сыйластық.', 'Қысқа сабақ не кеңес өткізіп, не күш бергенін белгілеңіз.', 'білім, HR, психология, медицина, қауымдастық', 'Кейде ең жақсы автоматтандыру — адамға дұрыс жазу.'],
    enterprising: ['Қозғалыс бастаушы', 'Сізге идеяны көрсету, қолдау жинау және бастау қуат береді.', 'Күшіңіз — ойдан алғашқы нақты қадамға тез өту.', 'Жылдамдық уәденің бағасын төмендетуі мүмкін. Тәуекел мен тоқтау нүктесін атаңыз.', 'Динамика, шешім құқығы және көрінетін әсер.', 'Ұсынысты бес нақты адамға көрсетіп, жауаптарды санаңыз.', 'кәсіпкерлік, сату, өнім, серіктестік, басқару', 'Күнделікті мәселеден бизнес-модель көре аласыз.'],
    organizing: ['Тәртіп құрастырушы', 'Сізге ретсіздіктің қадам, мерзім және рөлге айналғаны ұнайды.', 'Күшіңіз — басталған істі жоғалтпай аяқтауға көмектесу.', 'Тәртіп мақсатқа айналып кетпеуі керек.', 'Анық басымдық, тұрақты үдеріс және келісімді сақтайтын топ.', 'Қайталанатын үдерістен бір артық қадамды алып тастаңыз.', 'операциялар, жоба басқару, логистика, сапа', 'Дедлайнды кейде орындауға болатынын білесіз.'],
    practical: ['Нақты нәтиже шебері', 'Тапсырманы ұстап, тексеріп не дайын күйінде көргенде тез қосыласыз.', 'Күшіңіз — әңгімені нақты әрекетке қайтару.', 'Теория бірден пайда бермесе жалықтыруы мүмкін, бірақ қысқа жоспар қайта жасаудан сақтайды.', 'Құрал, нақты міндет, қозғалыс және көрінетін нәтиже.', 'Бір пайдалы зат жасап не жөндеп көріңіз.', 'өндіріс, сервис, қолөнер, құрылыс, дала жұмысы', 'Бесінші жиналыстан кейін құрал алып, мәселені шешкіңіз келеді.']
  },
  en: {
    analytical: ['Complexity decoder', 'You would rather investigate than guess: separate fact from impression, find causes, and test conclusions.', 'Your strength is turning a vague problem into a clear model.', 'You may refine the model for too long. Ask what evidence is sufficient for the next step.', 'Complex problems, access to facts, focused time, and permission to ask hard questions.', 'Use an open dataset or disputed claim and build a short conclusion with three pieces of evidence.', 'analytics, research, finance, risk, audit, strategy', 'You can find a logic flaw in a joke. Sometimes let the joke live.'],
    technical: ['Builder of working systems', 'You are drawn to how things work and to the moment a system becomes reliable.', 'You combine logic with construction: diagnose, configure, and improve.', 'A fascinating technical problem may not be a useful one. Check the human need first.', 'A clear technical goal, tools, testing, and room to improve.', 'Build a small automation, assemble something, or fix a real fault.', 'software, engineering, automation, systems architecture, service', 'Your favorite argument: “Look, it works.”'],
    creative: ['Maker of new options', 'You want room to do things differently and leave a recognizable voice in the result.', 'You see several doors where others were shown one.', 'Ideas can outrun completion. A deadline and one chosen format often improve the work.', 'Variety, experimentation, a real audience, and feedback without micromanagement.', 'Finish one small piece in an evening: a poster, story, video, or prototype.', 'design, content, media, branding, games', 'One option? Great. Seven more are loading.'],
    social: ['Human interface', 'The person matters as much as the task: explaining, supporting, negotiating, and helping others settle in.', 'You translate complexity into plain language and notice unspoken needs.', 'Other people’s work can quietly consume your boundaries. Define your role first.', 'Human contact, visible usefulness, respect, and feedback.', 'Run a short lesson, consultation, or volunteer shift and note what energized you.', 'education, HR, psychology, customer success, health', 'Sometimes the best automation is writing to a person clearly.'],
    enterprising: ['Momentum starter', 'You gain energy from influencing an outcome: present, negotiate, gather support, and begin.', 'You move from “we could” to a real conversation or launch quickly.', 'Speed can hide the cost of promises. Name the risk, owner, and stop point.', 'Movement, decision rights, visible impact, and direct contact.', 'Show a small offer to five real people and count responses, not compliments.', 'entrepreneurship, sales, product, partnerships, growth', 'You can spot a business model in an everyday annoyance.'],
    organizing: ['Order builder', 'You enjoy turning chaos into steps, deadlines, roles, and a definition of done.', 'You help work finish without losing important details.', 'Order can become the goal. If the checklist is longer than the task, return to the outcome.', 'Clear priorities, stable processes, and a team that keeps agreements.', 'Remove one unnecessary step or common error from a repeated process.', 'operations, project management, logistics, quality', 'You know the secret: deadlines can occasionally be met.'],
    practical: ['Maker of tangible results', 'You engage faster when the result can be touched, tested, or seen.', 'You bring discussion back to what must actually be done and what must work.', 'Theory without immediate use may frustrate you, though a short plan can prevent expensive rework.', 'Tools, concrete tasks, movement, and visible completion.', 'Make or repair one useful object and notice whether you enjoyed the process, outcome, or both.', 'production, service, crafts, construction, field work', 'After the fifth meeting, you want to pick up a tool and fix it.']
  },
  fr: {
    analytical: ['Décodeur de complexité', 'Vous préférez vérifier plutôt que deviner : distinguer les faits, chercher les causes et tester les conclusions.', 'Votre force consiste à transformer un problème flou en modèle clair.', 'Vous pouvez perfectionner le modèle trop longtemps. Demandez quelles données suffisent pour avancer.', 'Des problèmes complexes, des faits accessibles et du temps pour se concentrer.', 'Analysez une donnée ouverte ou une affirmation discutée et formulez une conclusion avec trois preuves.', 'analyse, recherche, finance, risque, audit, stratégie', 'Vous trouvez une faille logique même dans une blague. Laissez-la parfois vivre.'],
    technical: ['Créateur de systèmes fiables', 'Vous aimez comprendre le fonctionnement des choses et les rendre stables.', 'Vous savez diagnostiquer, régler et améliorer une solution.', 'Un problème technique passionnant n’est pas toujours utile. Vérifiez le besoin humain.', 'Un objectif clair, des outils et le droit de tester.', 'Créez une petite automatisation ou corrigez une panne réelle.', 'logiciel, ingénierie, automatisation, architecture système', 'Votre meilleur argument : « Regardez, ça marche. »'],
    creative: ['Auteur de nouvelles options', 'Vous aimez faire autrement et laisser une empreinte personnelle.', 'Vous voyez plusieurs portes là où les autres n’en voient qu’une.', 'Les idées peuvent dépasser la finition. Un délai et un format précis aident.', 'Variété, expérimentation, public réel et retours sans microgestion.', 'Terminez une petite création en une soirée.', 'design, contenu, médias, marque, jeu', 'Une option ? Très bien, sept autres arrivent.'],
    social: ['Interface humaine', 'La personne compte autant que la tâche : expliquer, soutenir et aider à s’entendre.', 'Vous rendez le complexe compréhensible et repérez les besoins implicites.', 'Les tâches des autres peuvent envahir vos limites. Définissez votre rôle.', 'Contact humain, utilité visible et respect.', 'Animez une courte séance ou une activité bénévole et notez votre énergie.', 'éducation, RH, psychologie, santé, communauté', 'Parfois, la meilleure automatisation consiste à écrire clairement à quelqu’un.'],
    enterprising: ['Déclencheur de mouvement', 'Vous aimez influencer le résultat : présenter, négocier, réunir du soutien et commencer.', 'Vous passez vite de « on pourrait » à une action réelle.', 'La vitesse peut cacher le coût des promesses. Nommez le risque et le point d’arrêt.', 'Dynamique, pouvoir de décision et impact visible.', 'Présentez une petite offre à cinq personnes réelles et comptez les réponses.', 'entrepreneuriat, vente, produit, partenariats, croissance', 'Vous voyez un modèle économique dans un problème quotidien.'],
    organizing: ['Constructeur d’ordre', 'Vous aimez transformer le chaos en étapes, délais, rôles et résultat défini.', 'Vous aidez le travail à se terminer sans perdre les détails.', 'L’ordre peut devenir une fin. Si la liste dépasse la tâche, revenez au résultat.', 'Priorités claires, processus stables et accords respectés.', 'Retirez une étape inutile d’un processus récurrent.', 'opérations, projets, logistique, qualité', 'Vous connaissez le secret : un délai peut parfois être respecté.'],
    practical: ['Artisan du concret', 'Vous vous engagez plus vite quand le résultat peut être touché, testé ou vu.', 'Vous ramenez la discussion vers l’action concrète et le résultat utile.', 'La théorie sans utilité immédiate peut agacer, même si un plan court évite les reprises.', 'Outils, tâche concrète, mouvement et résultat visible.', 'Fabriquez ou réparez une chose utile et observez ce que vous avez aimé.', 'production, service, artisanat, bâtiment, terrain', 'Après la cinquième réunion, vous voulez prendre un outil et régler le problème.']
  }
};
Object.assign(COPY, genericCopy);

const $ = selector => document.querySelector(selector);
const app = $('#app');
const t = () => UI[lang];
const copyFor = id => COPY[lang][id];
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
function read(key) { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } }

function shell(content) {
  app.innerHTML = `<header class="top"><a class="brand" href="../../index.html"><span class="mark">P</span><span>${t().app}</span></a><div class="tools"><a class="ghost home-link" href="../../index.html">⌂ ${t().home}</a><select id="lang" aria-label="Language">${supported.map(code => `<option>${code.toUpperCase()}</option>`).join('')}</select></div></header>${content}`;
  $('#lang').value = lang.toUpperCase();
  $('#lang').onchange = event => { lang = event.target.value.toLowerCase(); localStorage.setItem('pt.lang', lang); document.documentElement.lang = lang; render(); };
}

function intro() {
  shell(`<main class="card"><div class="intro-art"><img class="hero-image" src="../../hero-career.webp" alt=""><span class="hero-shade"></span><span class="hero-badge">${t().badge}</span></div><h1>${t().introTitle}</h1><p class="lead">${t().intro}</p><div class="meta"><span class="pill">42 ${t().q}</span><span class="pill">${t().min}</span><span class="pill">7 ${t().paths}</span></div><div class="privacy">🔒 ${t().privacy}</div><div class="cta"><button class="primary" id="start">${t().start} →</button><a class="btn secondary" href="../../downloads/career-interests.html" download>${t().download}</a></div></main>`);
  $('#start').onclick = () => { screen = 'quiz'; at = firstMissing(); render(); };
}

function firstMissing() { const index = questions.findIndex(question => answers[question.id] === undefined); return index < 0 ? 0 : index; }

function quiz() {
  const question = questions[at];
  const value = answers[question.id];
  const percent = Math.round(at / questions.length * 100);
  shell(`<main class="card"><div class="progress-line"><span>${at + 1} ${t().of} ${questions.length}</span><span>${percent}%</span></div><div class="track"><i style="width:${percent}%"></i></div><p class="question-hint">${t().instruction}</p><h2 class="question">${question.text[lang]}</h2><div class="answers">${t().choices.map((label, index) => `<button class="answer ${value === index ? 'selected' : ''}" data-value="${index}"><b>${index + 1}</b><span>${label}</span></button>`).join('')}</div><div class="nav"><button class="secondary" id="prev" ${at === 0 ? 'disabled' : ''}>← ${t().back}</button><button class="primary" id="next" ${value === undefined ? 'disabled' : ''}>${t().next} →</button></div></main>`);
  document.querySelectorAll('.answer').forEach(button => button.onclick = () => { answers[question.id] = Number(button.dataset.value); localStorage.setItem('pt.career.v2.answers', JSON.stringify(answers)); quiz(); });
  $('#prev').onclick = () => { if (at > 0) { at -= 1; render(); } };
  $('#next').onclick = advance;
}

function advance() {
  if (at === questions.length - 1) { screen = 'result'; render(); return; }
  at += 1;
  if ([14, 28, 38].includes(at)) screen = 'milestone';
  render();
}

function milestone() {
  const index = at < 20 ? 0 : at < 35 ? 1 : 2;
  shell(`<main class="card milestone"><div class="big">${['🌱', '🧭', '🌟'][index]}</div><h2>${t().milestones[index]}</h2><p class="lead">${at} ${t().of} ${questions.length}</p><button class="primary" id="go">${t().continue} →</button></main>`);
  $('#go').onclick = () => { screen = 'quiz'; render(); };
}

function calculateScores(sourceAnswers = answers) {
  const sums = Object.fromEntries(scales.map(scale => [scale, 0]));
  const maximums = Object.fromEntries(scales.map(scale => [scale, 0]));
  questions.forEach(question => Object.entries(question.weights).forEach(([scale, weight]) => {
    sums[scale] += (sourceAnswers[question.id] ?? 2) * weight;
    maximums[scale] += 4 * weight;
  }));
  return scales.map(id => ({ id, value: Math.round(sums[id] / maximums[id] * 100) })).sort((a, b) => b.value - a.value);
}

function scoreList() {
  if (!sharedResult) return calculateScores();
  return Object.entries(sharedResult.scores).filter(([id]) => scales.includes(id)).map(([id, value]) => ({ id, value: Number(value) })).sort((a, b) => b.value - a.value);
}

function careerMatches(scores) {
  const map = Object.fromEntries(scores.map(item => [item.id, item.value]));
  return careers.map(career => {
    const entries = Object.entries(career.w);
    const value = Math.round(entries.reduce((sum, [id, weight]) => sum + (map[id] || 0) * weight, 0) / entries.reduce((sum, [, weight]) => sum + weight, 0));
    const reasons = entries.sort((a, b) => (map[b[0]] * b[1]) - (map[a[0]] * a[1])).slice(0, 2).map(([id]) => t().labels[id]);
    return { ...career, value, reasons };
  }).sort((a, b) => b.value - a.value);
}

function band(value) { return value < 25 ? 0 : value < 45 ? 1 : value < 60 ? 2 : value < 75 ? 3 : 4; }

function result() {
  const scores = scoreList();
  const [top, second] = scores;
  const low = [...scores].sort((a, b) => a.value - b.value).slice(0, 2);
  const topCopy = copyFor(top.id);
  const secondCopy = copyFor(second.id);
  const jobs = careerMatches(scores).slice(0, 10);
  const payload = { v: 2, test: 'career', lang, scores: Object.fromEntries(scores.map(item => [item.id, item.value])) };
  const resultUrl = `${ONLINE}tests/career/index.html#r=${enc(payload)}`;
  const shareText = `${t().result}: ${t().labels[top.id]} + ${t().labels[second.id]}`;
  const gap = Math.abs(top.value - second.value);
  const blendText = gap <= 10
    ? `${topCopy[1]} ${secondCopy[1]}`
    : `${topCopy[1]} ${lang === 'ru' ? 'Второе направление добавляет к профилю:' : lang === 'kk' ? 'Екінші бағыт профильге қосады:' : lang === 'fr' ? 'La seconde direction ajoute :' : 'The second direction adds:'} ${secondCopy[0].toLowerCase()}.`;

  shell(`<main class="card result-card"><section class="result-head"><div class="eyebrow">${sharedResult ? t().shared : t().version}</div><div class="result-symbols">${profiles[top.id].emoji} ${profiles[second.id].emoji}</div><h1>${topCopy[0]} + ${secondCopy[0]}</h1><p class="summary">${t().introResult}</p></section>
    <section class="feature"><span class="eyebrow">${t().blend}</span><h2>${t().labels[top.id]} × ${t().labels[second.id]}</h2><p>${blendText}</p><blockquote>${topCopy[7]}</blockquote></section>
    <div class="grid rich-grid"><section class="mini"><h3>✦ ${t().strength}</h3><p>${topCopy[2]} ${secondCopy[2]}</p></section><section class="mini"><h3>⚠ ${t().shadow}</h3><p>${topCopy[3]} ${secondCopy[3]}</p></section><section class="mini"><h3>☀ ${t().environment}</h3><p>${topCopy[4]} ${secondCopy[4]}</p></section><section class="mini"><h3>→ ${t().experiment}</h3><p>${topCopy[5]} ${secondCopy[5]}</p></section></div>
    <section class="section-block"><h2>${t().professions}</h2><p class="muted">${t().professionsNote}</p><div class="jobs">${jobs.map((job, index) => `<article class="job"><span class="job-rank">${index + 1}</span><div><h3>${esc(job.title[lang])}</h3><p><b>${t().why}:</b> ${job.reasons.join(' · ')}</p></div><strong>${job.value}%<small>${t().fit}</small></strong></article>`).join('')}</div></section>
    <section class="energy"><h2>${t().energy}</h2><p>${t().lowIntro}</p><div class="energy-tags">${low.map(item => `<span>${profiles[item.id].emoji} ${t().labels[item.id]}</span>`).join('')}</div></section>
    <section class="numbers"><h2>${t().numbers}</h2><p>${t().numbersText}</p><button class="secondary" id="toggle-scores">${t().full}</button><div class="scores collapsed" id="scores">${scores.map(item => `<div class="score"><strong>${profiles[item.id].emoji} ${t().labels[item.id]}<small>${t().bands[band(item.value)]}</small></strong><b>${item.value}%</b><div class="bar"><i style="width:${item.value}%;background:${profiles[item.id].color}"></i></div></div>`).join('')}</div></section>
    <p class="disclaimer">${t().disclaimer}</p><div class="footer-actions"><button class="primary" id="share">${t().share}</button><button class="secondary" id="copy">${t().copy}</button><button class="secondary" id="again">${t().restart}</button><a class="btn ghost" href="../../index.html">${t().other}</a>${sharedResult ? '' : `<button class="ghost" id="delete">${t().delete}</button>`}</div><div class="support"><button class="ghost" id="support">${t().support}</button></div></main>
    <dialog id="support-dialog"><h2>${t().support}</h2><p class="lead">${t().supportText}</p><div class="links"><a class="btn primary" href="${SUPPORT.boosty}" target="_blank" rel="noopener">Boosty</a><a class="btn secondary" href="${SUPPORT.kofi}" target="_blank" rel="noopener">Ko-fi</a><button class="ghost" id="close">${t().close}</button></div></dialog>`);

  $('#toggle-scores').onclick = event => { const list = $('#scores'); const open = list.classList.toggle('open'); event.currentTarget.textContent = open ? t().hide : t().full; };
  $('#share').onclick = async () => navigator.share ? navigator.share({ title: t().result, text: shareText, url: resultUrl }) : copy(`${shareText}\n${resultUrl}`);
  $('#copy').onclick = () => copy(`${shareText}\n${resultUrl}`);
  $('#again').onclick = () => { history.replaceState(null, '', location.pathname); sharedResult = null; answers = {}; localStorage.removeItem('pt.career.v2.answers'); at = 0; screen = 'quiz'; render(); };
  if ($('#delete')) $('#delete').onclick = () => { answers = {}; localStorage.removeItem('pt.career.v2.answers'); toast(t().copied); };
  $('#support').onclick = () => $('#support-dialog').showModal();
  $('#close').onclick = () => $('#support-dialog').close();
}

async function copy(value) { await navigator.clipboard.writeText(value); toast(t().copied); }
function toast(value) { const element = $('#toast'); element.textContent = value; element.classList.add('show'); setTimeout(() => element.classList.remove('show'), 1800); }
function render() { document.documentElement.lang = lang; ({ intro, quiz, milestone, result }[screen])(); }
render();
