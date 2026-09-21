// Build-time settings shared by every existing and future episode.
export const FEATURES={
  share:true,
  // Use a local adapter which registers PortHubDevelopment.registerComments().
  // Keep disabled until a provider, privacy policy, and moderation are selected.
  comments:{enabled:false,adapter:null,preview:'off',previewLimit:3}
};
export const POST_UI={
 ru:{share:'Поделиться постом',copy:'Скопировать ссылку',copied:'Ссылка скопирована',manual:'Скопируйте ссылку из поля ниже.',link:'Ссылка на пост',comments:'Комментарии',load:'Загрузить комментарии',loading:'Загрузка…',error:'Не удалось загрузить комментарии. Попробуйте ещё раз.'},
 kk:{share:'Жазбамен бөлісу',copy:'Сілтемені көшіру',copied:'Сілтеме көшірілді',manual:'Төмендегі өрістен сілтемені көшіріңіз.',link:'Жазбаға сілтеме',comments:'Пікірлер',load:'Пікірлерді жүктеу',loading:'Жүктелуде…',error:'Пікірлер жүктелмеді. Қайталап көріңіз.'},
 en:{share:'Share this post',copy:'Copy link',copied:'Link copied',manual:'Copy the link from the field below.',link:'Post link',comments:'Comments',load:'Load comments',loading:'Loading…',error:'Could not load comments. Please try again.'},
 fr:{share:'Partager cet épisode',copy:'Copier le lien',copied:'Lien copié',manual:'Copiez le lien dans le champ ci-dessous.',link:'Lien de l’épisode',comments:'Commentaires',load:'Charger les commentaires',loading:'Chargement…',error:'Impossible de charger les commentaires. Réessayez.'}
};
const NAV={
 ru:{previous:'← Предыдущий пост',next:'Следующий пост →',back:'К списку'},
 kk:{previous:'← Алдыңғы жазба',next:'Келесі жазба →',back:'Тізімге оралу'},
 en:{previous:'← Previous post',next:'Next post →',back:'Back to list'},
 fr:{previous:'← Épisode précédent',next:'Épisode suivant →',back:'Retour à la liste'}
};
for(const lang of Object.keys(POST_UI))Object.assign(POST_UI[lang],NAV[lang]);
