const LinkedList = require('./LinkedList');

const LanguageService = {
  getUsersLanguage(db, user_id) {
    return db
      .from('language')
      .select(
        'language.id',
        'language.name',
        'language.user_id',
        'language.head',
        'language.total_score'
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
        'incorrect_count'
      )
      .where({ language_id });
  },

  getLanguageHead(db, head) {
    return db.raw(`SELECT original, correct_count, incorrect_count, total_score
      FROM word w JOIN "language" l ON w.language_id = l.id
      WHERE w.id = ${head};`);
  },

  createLinkedList(language, words) {
    const SLL = new LinkedList(
      language.user_id,
      language.id,
      language.total_score
    );
    let word = { next: language.head };
    while (word.next) {
      word = words.find((w) => w.id === word.next);
      SLL.insertLast({
        id: word.id,
        original: word.original,
        translation: word.translation,
        memory_value: word.memory_value,
        correct_count: word.correct_count,
        incorrect_count: word.incorrect_count,
      });
    }
    return SLL;
  },

  updateWords(db, updatedNodes) {
    return db.transaction((trx) => {
      let queries = [];
      updatedNodes.forEach((node) => {
        const query = db
          .from('word')
          .where('id', node.value.id)
          .update({
            memory_value: node.value.memory_value,
            correct_count: node.value.correct_count,
            incorrect_count: node.value.incorrect_count,
            next: node.next.value.id
          })
          .transacting(trx);
        queries.push(query);
      });

      Promise.all(queries).then(trx.commit).catch(trx.rollback);
    });
  },

  updateTotalScore(db, linkedLanguage) {
    return db.from('language').where('user_id', linkedLanguage.user_id).update({
      total_score: linkedLanguage.total_score,
      head: linkedLanguage.head.value.id,
    });
  },

  updateHead(db, id, head) {
    db('language').where({ id }).update({ head });
  },
};

module.exports = LanguageService;