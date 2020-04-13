const LanguageService = {
  getUsersLanguage(db, user_id) {
    return db
      .from('language')
      .select(
        'language.id',
        'language.name',
        'language.user_id',
        'language.head',
        'language.total_score',
      )
      .where('language.user_id', user_id)
      .first();
  },

  getLanguageWords(db, language_id) {
    return db
      .from('word')
      .select(
        'id',
        'language_id',
        'original',
        'translation',
        'next',
        'memory_value',
        'correct_count',
        'incorrect_count',
      )
      .where({ language_id });
  },

  async populateLinkedList(db, language_id, ll) {
    const words = await db
      .from('word')
      .select(
        'id',
        'language_id',
        'original',
        'translation',
        'next',
        'memory_value',
        'correct_count',
        'incorrect_count'
      )
      .where({ language_id });

    words.map(word => ll.insertLast(word));

    return words;
  },

  async insertNewLinkedList(db, ll) {
    for(let i = 0; i < ll.length; i++) {
      await db('word').where('id', ll[i].id).update(ll[i]);
    }
    return;
  },

  async updateLanguageTotalScore(db, language) {
    await db('language').where('user_id', language.user_id).andWhere('id', language.id).update({total_score: language.total_score});
  }
};

module.exports = LanguageService;
